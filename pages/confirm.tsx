// src/pages/confirm.tsx (エラー修正版)

import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import axios from "axios"; // isAxiosErrorを使わない場合は、axiosのみインポート
import styles from '../styles/Form.module.css';
import { FaCheckCircle, FaArrowLeft } from "react-icons/fa";

// 型定義から id を削除し、isbn のみとする
type BookConfirmationData = {
  isbn?: string;
  title: string;
  author?: string;
  thumbnail?: string;
  from: 'donate' | 'receive';
};

export default function ConfirmPage() {
  const router = useRouter();
  const [book, setBook] = useState<BookConfirmationData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    setError('');
    if (router.isReady && router.query.data) {
      try {
        const decoded = JSON.parse(decodeURIComponent(router.query.data as string));
        setBook(decoded as BookConfirmationData);
      } catch (e) {
        console.error("❌ Failed to parse query data:", e);
        setError("確認データの読み込みに失敗しました。");
        setBook(null);
      }
    } else if (router.isReady && !router.query.data) {
      setError("確認するデータが見つかりません。");
    }
  }, [router.isReady, router.query.data]);

  const handleSubmit = async () => {
    if (!book) {
      setError("確認データがありません。");
      return;
    }
    setIsLoading(true);
    setError('');

    try {
      if (book.from === "donate") {
        // donate フロー (変更なし)
        if (!book.isbn || !book.title) {
          throw new Error("登録にはISBNとタイトルが必要です。");
        }
        await axios.post("/api/donate", book);
        console.log("/api/donate successful");

      } else if (book.from === "receive") {
        // ★★★ ここから修正 ★★★
        // IDの代わりにISBNをチェック
        if (!book.isbn || book.isbn.trim() === "") {
           console.error("Receive validation failed: Missing ISBN", book);
           throw new Error("受け取り処理に必要な本のISBNがありません。");
        }
        // APIに送信するペイロードを { id: ... } から { isbn: ... } に変更
        await axios.post("/api/receive", { isbn: book.isbn });
        console.log("/api/receive successful");
        // ★★★ 修正ここまで ★★★

      } else {
        throw new Error("不明な操作タイプです。");
      }
      router.push("/done");

    } catch (err: any) {
      console.error("❌ Submit Error:", err);
      let displayError = "エラーが発生しました。";
      if (err.response) { // isAxiosErrorを使わない判定
        const apiErrorMessage = err.response.data?.error || `サーバーエラー (ステータス: ${err.response.status})`;
        displayError = apiErrorMessage;
      } else if (err instanceof Error) {
        displayError = err.message;
      }
      setError(`処理に失敗しました: ${displayError}`);
    } finally {
      setIsLoading(false);
    }
  };

  // --- JSX (Mixed Content警告対策を追加) ---
  if (!router.isReady || (!book && !error)) {
    return <p className={styles.infoMessage}>読み込み中...</p>;
  }
  if (error && !book) {
    return (
      <div className={styles.container}>
        <p className={styles.error}>{error}</p>
        <div className={styles.buttonGroup}>
          <button type="button" onClick={() => router.back()} className={`${styles.button} ${styles.buttonSecondary}`}>
            <FaArrowLeft /> 戻る
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <h2 className={styles.formTitle}>📋 内容の確認</h2>
      {book && (
        <div className={styles.confirmDetails}>
          {book.thumbnail && (
            <img
              // (推奨) httpをhttpsに変換してMixed Content警告を抑制
              src={book.thumbnail.replace('http://', 'https://')}
              alt={book.title}
              className={styles.thumbnailPreview}
              style={{ marginBottom: '1rem' }}
            />
          )}
          <p><strong>タイトル:</strong> {book.title}</p>
          {book.author && <p><strong>著者:</strong> {book.author}</p>}
          {book.isbn && <p><strong>ISBN:</strong> {book.isbn}</p>}
          <p><strong>操作:</strong> {book.from === 'donate' ? '寄付する' : '受け取る'}</p>
        </div>
      )}
      {error && <p className={styles.error}>{error}</p>}
      <div className={styles.buttonGroup}>
        <button type="button" onClick={() => router.back()} className={`${styles.button} ${styles.buttonSecondary}`} disabled={isLoading}> <FaArrowLeft /> 戻る </button>
        <button type="button" onClick={handleSubmit} className={`${styles.button} ${styles.buttonPrimary}`} disabled={isLoading || !book}> {isLoading ? '処理中...' : <><FaCheckCircle /> 確定する</>} </button>
      </div>
    </div>
  );
}
