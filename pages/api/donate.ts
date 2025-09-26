// src/pages/api/donate.ts
import { google } from "googleapis";
import type { NextApiRequest, NextApiResponse } from "next";

async function getSheetsClient() {
  const credentials = JSON.parse(process.env.GOOGLE_SERVICE_KEY as string);

  const auth = new google.auth.JWT({
    email: credentials.client_email,
    key: credentials.private_key.replace(/\\n/g, "\n"),
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });

  return google.sheets({ version: "v4", auth });
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  const { isbn, title, author, thumbnail } = req.body;
  if (!isbn || !title) {
    return res.status(400).json({ error: "ISBN と タイトルは必須です" });
  }

  try {
    const sheets = await getSheetsClient();
    const spreadsheetId = process.env.SPREADSHEET_ID as string;

    // 既存データの取得
    const result = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: "Books!A2:E",
    });

    const rows = result.data.values || [];
    let foundRow = -1;
    let stock = 0;

    rows.forEach((r, i) => {
      if (r[0] === isbn) {
        foundRow = i + 2; // ヘッダーがあるので +2
        stock = parseInt(r[4] || "0", 10);
      }
    });

    if (foundRow > -1) {
      // 既存本 → 在庫数を +1
      await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: `Books!E${foundRow}`,
        valueInputOption: "RAW",
        requestBody: { values: [[stock + 1]] },
      });
      return res.status(200).json({ message: "在庫を +1 更新しました", isbn, stock: stock + 1 });
    } else {
      // 新規本を追加
      await sheets.spreadsheets.values.append({
        spreadsheetId,
        range: "Books!A:E",
        valueInputOption: "RAW",
        requestBody: {
          values: [[isbn, title, author || "著者不明", thumbnail || "", 1]],
        },
      });
      return res.status(200).json({ message: "新しい本を追加しました", isbn, stock: 1 });
    }
  } catch (error: any) {
    return res.status(500).json({ error: error.message, details: error });

  }
}
