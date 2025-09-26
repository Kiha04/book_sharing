// src/pages/api/books.ts
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
  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  try {
    const { search } = req.query;
    const sheets = await getSheetsClient();
    const spreadsheetId = process.env.SPREADSHEET_ID as string;

    const result = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: "Books!A2:E", // [isbn, title, author, thumbnail, stock]
    });

    const rows = result.data.values || [];
    let books = rows.map((r) => ({
      isbn: r[0],
      title: r[1],
      author: r[2],
      thumbnail: r[3],
      stock: parseInt(r[4] || "0", 10),
    }));

    // 在庫 > 0 のみに絞る
    books = books.filter((b) => b.stock > 0);

    // 検索ワードがある場合フィルタ
    if (search) {
      const s = (search as string).toLowerCase();
      books = books.filter(
        (b) =>
          b.title.toLowerCase().includes(s) ||
          b.author.toLowerCase().includes(s) ||
          b.isbn.includes(s)
      );
    }

    return res.status(200).json(books);
  } catch (error) {
    console.error("❌ API /api/books Error:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
}
