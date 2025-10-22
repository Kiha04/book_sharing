// src/pages/confirm.tsx (同意チェックボックス追加)

import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import axios from "axios";
import styles from '../styles/Form.module.css';
import { FaCheckCircle, FaArrowLeft, FaExclamationTriangle } from "react-icons/fa"; // アイコン追加

// 型定義
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
  // ★ 1. 同意チェック用の State を追加 (初期値は false)
  const [consentChecked, setConsentChecked] = useState(false);

  useEffect(() => {
    setError('');
    setConsentChecked(false); // ページ読み込み時にチェックをリセット
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
    // ★ 寄付の場合、同意チェックも確認
    if (!book || (book.from === 'donate' && !consentChecked)) {
      setError(book?.from === 'donate' ? "所有権の放棄に同意してください。" : "確認データがありません。");
      return;
    }
    setIsLoading(true);
    setError('');

    try {
      if (book.from === "donate") {
        if (!book.isbn || !book.title) { throw new Error("登録にはISBNとタイトルが必要です。"); }
        await axios.post("/api/donate", book);
      } else if (book.from === "receive") {
        if (!book.isbn || String(book.isbn).trim() === "") { throw new Error("受け取り処理に必要な本のISBNがありません。"); }
        await axios.post("/api/receive", { isbn: book.isbn });
      } else {
        throw new Error("不明な操作タイプです。");
      }
      router.push("/done");

    } catch (err: any) {
      console.error("❌ Submit Error:", err);
      let displayError = "エラーが発生しました。";
      if (axios.isAxiosError(err)) { // ← isAxiosErrorを使えるように axios もインポートしておく
        const apiErrorMessage = err.response?.data?.error || `サーバーエラー (ステータス: ${err.response?.status})`;
        displayError = apiErrorMessage;
      } else if (err instanceof Error) {
        displayError = err.message;
      }
      setError(`処理に失敗しました: ${displayError}`);
    } finally {
      setIsLoading(false);
    }
  };

  // --- JSX ---
  if (!router.isReady || (!book && !error)) { return <p className={styles.infoMessage}>読み込み中...</p>; }
  if (error && !book) { /* ... エラー表示JSX ... */ }

  return (
    <div className={styles.container}>
      <h2 className={styles.formTitle}>📋 内容の確認</h2>
      {book && (
        <div className={styles.confirmDetails}>
          {/* ... 書籍情報の表示 (変更なし) ... */}
          <p><strong>タイトル:</strong> {book.title}</p>
          {book.author && <p><strong>著者:</strong> {book.author}</p>}
          {book.isbn && <p><strong>ISBN:</strong> {book.isbn}</p>}
          <p><strong>操作:</strong> {book.from === 'donate' ? '寄付する' : '受け取る'}</p>
        </div>
      )}

      {/* ★ 2. 寄付の場合のみ同意チェックボックスを表示 */}
      {book?.from === 'donate' && (
        <div className={styles.consentCheckboxWrapper}>
          <input
            type="checkbox"
            id="ownershipConsent"
            checked={consentChecked}
            // ★ 3. チェック状態を state に反映
            onChange={(e) => setConsentChecked(e.target.checked)}
            className={styles.consentCheckbox}
          />
          <label htmlFor="ownershipConsent" className={styles.consentLabel}>
            <FaExclamationTriangle style={{ marginRight: '0.3em', color: 'orange' }} />
            私はこの教科書の所有権を放棄し、「学内図書シェア」プロジェクトを通じて他の学生に無償で提供されることに同意します。一度寄付した本は返却されません。
          </label>
        </div>
      )}

      {error && <p className={styles.error}>{error}</p>}

      <div className={styles.buttonGroup}>
        <button type="button" onClick={() => router.back()} className={`${styles.button} ${styles.buttonSecondary}`} disabled={isLoading}> <FaArrowLeft /> 戻る </button>
        {/* ★ 4. 確定ボタンの無効化条件を追加 */}
        <button
          type="button"
          onClick={handleSubmit}
          className={`${styles.button} ${styles.buttonPrimary}`}
          // 寄付の場合は consentChecked も確認
          disabled={isLoading || !book || (book.from === 'donate' && !consentChecked)}
        >
          {isLoading ? '処理中...' : <><FaCheckCircle /> 確定する</>}
        </button>
      </div>
    </div>
  );
}
