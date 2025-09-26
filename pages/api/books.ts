// src/pages/api/books.ts
import type { NextApiRequest, NextApiResponse } from "next";
import axios from "axios";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") return res.status(405).json({ message: "Method Not Allowed" });

  const GAS_URL = process.env.GOOGLE_SCRIPT_URL;
  if (!GAS_URL) return res.status(500).json({ error: "サーバー設定エラー" });
  
  try {
    const response = await axios.get(GAS_URL, { params: req.query });
    res.status(200).json(response.data);
  } catch (error: any) {
    console.error("API Error (books):", error);
    res.status(error.response?.status || 500).json({ error: error.response?.data?.error || "サーバーエラー" });
  }
}
