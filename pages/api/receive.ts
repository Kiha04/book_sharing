// src/pages/api/receive.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { google } from "googleapis";

async function getSheetsClient() {
  const auth = new google.auth.GoogleAuth({
    credentials: JSON.parse(process.env.GOOGLE_SERVICE_KEY as string),
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });
  return google.sheets({ version: "v4", auth });
}

const SPREADSHEET_ID = process.env.SPREADSHEET_ID as string;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  try {
    const { isbn } = req.body;
    if (!isbn) {
      return res.status(400).json({ error: "ISBNが必要です" });
    }

    const sheets = await getSheetsClient();

    // 本一覧を取得
    const result = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: "Books!A:E", // A:ISBN, B:タイトル, C:著者, D:サムネイル, E:在庫
    });

    const rows = result.data.values || [];
    if (rows.length < 2) {
      return res.status(404).json({ error: "本が存在しません" });
    }

    const header = rows[0];
    const dataRows = rows.slice(1);

    // ISBN に一致する本を探す
    const rowIndex = dataRows.findIndex((row) => row[0] === isbn);
    if (rowIndex === -1) {
      return res.status(404).json({ error: "指定されたISBNの本が見つかりません" });
    }

    const row = dataRows[rowIndex];
    const stock = parseInt(row[4] || "0", 10);

    if (stock <= 0) {
      return res.status(400).json({ error: "在庫がありません" });
    }

    const newStock = stock - 1;

    // Google Sheets の特定セルを更新
    await sheets.spreadsheets.values.update({
      spreadsheetId: SPREADSHEET_ID,
      range: `Books!E${rowIndex + 2}`, // +2: ヘッダー行をスキップするため
      valueInputOption: "RAW",
      requestBody: {
        values: [[newStock]],
      },
    });

    return res.status(200).json({
      message: "本を受け取りました",
      book: {
        isbn: row[0],
        title: row[1],
        author: row[2],
        thumbnail: row[3],
        stock: newStock,
      },
    });
  } catch (error: any) {
    console.error("❌ API /api/receive Error:", error);
    return res.status(500).json({ error: "Internal Server Error", message: error.message });
  }
}
