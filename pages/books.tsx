import { useState, useEffect } from "react";
import axios from "axios";
import Head from "next/head";
import styles from '../styles/Form.module.css';
import { FaSearch } from "react-icons/fa";

interface VolumeInfo {
  imageLinks?: {
    thumbnail?: string;
  };
}
interface BookItem {
  volumeInfo: VolumeInfo;
}
interface GoogleBooksApiResponse {
  items?: BookItem[];
}

type Book = {
  id: number;
  isbn: string;
  title: string;
  author: string;
  subject?: string;
  stock: number;
  imageLinks?: {
    thumbnail?: string;
  };
};

export default function SearchPage() {
  const [search, setSearch] = useState("");
  const [books, setBooks] = useState<Book[]>([]);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const fetchThumbnailFromGoogleBooks = async (isbn: string): Promise<string | undefined> => {
    if (!isbn) return undefined;
    try {
      const res = await axios.get<GoogleBooksApiResponse>(
        `https://www.googleapis.com/books/v1/volumes?q=isbn:${isbn}`
      );
      return res.data.items?.[0]?.volumeInfo?.imageLinks?.thumbnail;
    } catch (err) {
      console.error(`📕 ISBN ${isbn} のサムネイル取得エラー:`, err);
      return undefined;
    }
  };

  const fetchBooks = async () => {
    setIsLoading(true);
    setError("");
    try {
      const res = await axios.get<Book[]>("/api/books", {
        params: { search },
      });
      const booksFromApi = res.data;

      if (booksFromApi.length === 0) {
        setBooks([]);
        setIsLoading(false);
        return;
      }

      const booksWithThumbnailsPromises = booksFromApi.map(async (book) => {
        const thumbnailUrl = await fetchThumbnailFromGoogleBooks(book.isbn);
        return {
          ...book,
          imageLinks: { thumbnail: thumbnailUrl },
        };
      });

      const booksWithThumbnails = await Promise.all(booksWithThumbnailsPromises);
      setBooks(booksWithThumbnails);
    } catch (err) {
      console.error("📚 本の取得エラー:", err);
      setError("📛 本の取得中にエラーが発生しました");
      setBooks([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchBooks();
  };

  useEffect(() => {
    fetchBooks();
  }, []);

  return (
    <>
      <Head>
        <title>本を探す</title>
      </Head>
      <div className={styles.container}>
        <h2 className={styles.formTitle}>📚 本を探す</h2>

        <form onSubmit={handleSearch} className={styles.searchForm}>
          <input
            type="text"
            placeholder="タイトルなどで検索"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className={styles.input}
          />
          <button
            type="submit"
            className={`${styles.button} ${styles.buttonPrimary}`}
            disabled={isLoading}
          >
            {isLoading ? '検索中...' : <><FaSearch /> 検索</>}
          </button>
        </form>

        {error && <p className={styles.error}>{error}</p>}
        {isLoading && <p className={styles.infoMessage}>書籍情報を読み込んでいます...</p>}

        {!isLoading && (
          <ul className={styles.resultsList}>
            {books.length === 0 && !error && (
              <li className={styles.noResults}>該当する本が見つかりませんでした。</li>
            )}
            {books.map((book) => (
              <li key={book.id} className={styles.searchResultItem}>
                {book.imageLinks?.thumbnail ? (
                  <img
                    src={book.imageLinks.thumbnail}
                    alt={`${book.title} の表紙`}
                    className={styles.resultThumbnail}
                  />
                ) : (
                  <div className={styles.resultThumbnailPlaceholder}>
                    画像なし
                  </div>
                )}
                <div className={styles.resultDetails}>
                  <strong className={styles.bookTitle}>{book.title}</strong><br />
                  <span className={styles.bookAuthor}>著者: {book.author}</span><br />
                  <span
                    className={`${styles.bookMeta} ${book.stock > 0 ? styles.stockAvailable : styles.stockUnavailable}`}
                  >
                    在庫: {book.stock > 0 ? `${book.stock} 冊` : "在庫なし"}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  );
}
