// src/pages/api/receive.ts

import type { NextApiRequest, NextApiResponse } from "next";
import axios from "axios";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // POSTメソッド以外は受け付けない
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  // Vercelの環境変数からGASのURLを取得
  const GAS_URL = process.env.GOOGLE_SCRIPT_URL;
  if (!GAS_URL) {
    console.error("Google Apps ScriptのURLが設定されていません。");
    return res.status(500).json({ error: "サーバー設定エラー" });
  }
  
  try {
    // フロントエンドから送られてきたボディに 'action: receive' を追加してGASに転送
    const payload = { ...req.body, action: 'receive' };

    console.log("Forwarding data to Google Apps Script (receive):", payload);

    const response = await axios.post(GAS_URL, payload);

    console.log("Response from Google Apps Script (receive):", response.data);

    // GASからの応答内容に応じて、フロントエンドへの応答を決定
    if (response.data.result === "success") {
        // 成功した場合
        return res.status(200).json({ message: response.data.message, stock: response.data.stock });
    } else {
        // GAS側でエラーがあった場合 (例: 在庫なし)
        return res.status(400).json({ error: response.data.message || "スプレッドシートでの処理に失敗しました。" });
    }

  } catch (error: any) {
    console.error("API Error (receive):", error);
    // GASの呼び出し自体に失敗した場合
    res.status(error.response?.status || 500).json({ error: error.response?.data?.error || "サーバーエラー" });
  }
}
