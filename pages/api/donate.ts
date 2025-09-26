// src/pages/api/donate.ts
import type { NextApiRequest, NextApiResponse } from "next";
import axios from "axios";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).json({ message: "Method Not Allowed" });

  const GAS_URL = process.env.GOOGLE_SCRIPT_URL;
  if (!GAS_URL) return res.status(500).json({ error: "サーバー設定エラー" });
  
  try {
    const payload = { ...req.body, action: 'donate' };
    const response = await axios.post(GAS_URL, payload);
    res.status(200).json(response.data);
  } catch (error: any) {
    console.error("API Error (donate):", error);
    res.status(error.response?.status || 500).json({ error: error.response?.data?.error || "サーバーエラー" });
  }
}
