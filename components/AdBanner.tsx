// src/components/AdBanner.tsx

import React, { useState, useEffect, useRef, JSX } from 'react'; // JSX 型のインポートは通常不要
import Link from 'next/link';
import styles from '../styles/AdBanner.module.css'; // ラッパーとタイトルのスタイルも含む
import { FaVolumeMute, FaVolumeUp } from 'react-icons/fa';

// --- 型定義 ---
type AdConfig = {
  id: string;
  type: 'image';
  imageUrl?: string;
  videoUrl?: string;
  altText: string;
  linkUrl: string;
  isExternal: boolean;
  weight: number; // 正の数である必要あり
};

// --- 広告設定 ---
const ADS_CONFIG: AdConfig[] = [
  {
    id: 'ad001',
    type: 'image',
    imageUrl: '/images/ads/questionnaire.png', // public/images/ads/ に配置
    altText: 'アンケート',
    isExternal: false,
    weight: 5,
  },
  {
    id: 'ad002',
    type: 'image',
    imageUrl: '/images/ads/meiowelnavi-logo.png',
    altText: '名桜ウェルナビ',
    linkUrl: 'https://www.meio-u.ac.jp/welnavi/',
    isExternal: false,
    weight: 5,
  },
  // 必要に応じて広告を追加
];
// --- ここまで広告設定 ---


// 重み付け選択関数
const selectWeightedRandomAd = (ads: AdConfig[]): AdConfig | null => {
  const validAds = ads.filter(ad => ad.weight > 0);
  if (validAds.length === 0) {
    return null;
  }
  const totalWeight = validAds.reduce((sum, ad) => sum + ad.weight, 0);
  if (totalWeight <= 0) {
     return validAds[Math.floor(Math.random() * validAds.length)];
  }
  let randomNum = Math.random() * totalWeight;
  for (const ad of validAds) {
    if (randomNum < ad.weight) {
      return ad;
    }
    randomNum -= ad.weight;
  }
  return validAds[validAds.length - 1]; // フォールバック
};


const AdBanner: React.FC = () => {
  const [selectedAd, setSelectedAd] = useState<AdConfig | null>(null);
  const [isMuted, setIsMuted] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    setSelectedAd(selectWeightedRandomAd(ADS_CONFIG));
  }, []);

  const toggleMute = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();
    if (videoRef.current) {
      const currentMuted = !videoRef.current.muted;
      videoRef.current.muted = currentMuted;
      setIsMuted(currentMuted);
    }
  };

  // ★ 表示すべき広告がない場合は、ここで null を返す
  if (!selectedAd) {
    return null;
  }

  // --- 広告コンテンツ (画像または動画) を生成 ---
  let adContentElement: JSX.Element | null = null;

  if (selectedAd.type === 'image' && selectedAd.imageUrl) {
    adContentElement = (
       <img
         src={selectedAd.imageUrl}
         alt={selectedAd.altText}
         className={styles.adBannerImage}
       />
    );
  } 

  // コンテンツが正しく生成されなかった場合も null を返す
  if (!adContentElement) {
     return null;
  }

  // ★ 広告がある場合のみ、ラッパー、タイトル、広告本体を返すように修正
  return (
    <div className={styles.adAreaWrapper}> {/* 全体を囲むラッパー */}
      <h3 className={styles.adAreaTitle}>協賛・サポーター</h3> {/* タイトル */}
      <div className={styles.adBannerContainer}> {/* 広告自体のコンテナ */}
        {selectedAd.isExternal ? (
          <a href={selectedAd.linkUrl} target="_blank" rel="noopener noreferrer sponsored" className={styles.adBannerLink}>
            {adContentElement}
          </a>
        ) : (
          <Link href={selectedAd.linkUrl} className={styles.adBannerLink}>
              {adContentElement}
          </Link>
        )}
         {/* <span className={styles.adLabel}>広告</span> */}
      </div>
    </div>
  );
};

export default AdBanner;
