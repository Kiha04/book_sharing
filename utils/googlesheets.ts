// src/utils/googlesheets.ts (推奨版)

import { google } from "googleapis";

// 認証クライアントを一度生成したら再利用（キャッシュ）する
let sheetsClient: google.sheets_v4.Sheets | null = null;

export async function getSheetsClient() {
  if (sheetsClient) {
    return sheetsClient;
  }

  try {
    // Vercelに設定した GOOGLE_SERVICE_KEY のJSON文字列をパース
    const credentials = JSON.parse(process.env.GOOGLE_SERVICE_KEY as string);

    // GoogleAuth を使うのがより現代的で推奨される方法
    const auth = new google.auth.GoogleAuth({
      credentials,
      scopes: ["https://www.googleapis.com/auth/spreadsheets"],
    });

    const client = google.sheets({ version: "v4", auth });
    sheetsClient = client; // 作成したクライアントをキャッシュ
    return client;

  } catch (error) {
    console.error("❌ Google Sheets Clientの認証に失敗しました:", error);
    throw new Error("Google Sheets Clientの認証に失敗しました。環境変数を確認してください。");
  }
}

// --- これ以降の関数 (appendBookRow, readBooks) は変更なし ---

export async function appendBookRow(
  spreadsheetId: string,
  values: (string | number)[]
) {
  const sheets = await getSheetsClient();
  await sheets.spreadsheets.values.append({
    spreadsheetId,
    range: "Books!A:E", // シート名を確認
    valueInputOption: "USER_ENTERED",
    requestBody: {
      values: [values],
    },
  });
}

export async function readBooks(spreadsheetId: string) {
  const sheets = await getSheetsClient();
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: "Books!A:E", // シート名を確認
  });
  return res.data.values || [];
}
