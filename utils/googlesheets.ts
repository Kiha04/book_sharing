// src/utils/googlesheets.ts (環境変数を分割する方式に修正)

import { google, sheets_v4 } from "googleapis";

let sheetsClient: sheets_v4.Sheets | null = null;

export async function getSheetsClient(): Promise<sheets_v4.Sheets> {
  if (sheetsClient) {
    return sheetsClient;
  }

  try {
    // 3つの別々の環境変数を使用
    const clientEmail = process.env.GOOGLE_CLIENT_EMAIL;
    const privateKey = process.env.GOOGLE_PRIVATE_KEY;
    const projectId = process.env.GOOGLE_PROJECT_ID;

    // いずれかの変数が設定されていない場合はエラー
    if (!clientEmail || !privateKey || !projectId) {
      throw new Error("必要なGoogle認証用の環境変数が設定されていません。");
    }

    // JWT (JSON Web Token) を使って認証
    const auth = new google.auth.JWT({
      email: clientEmail,
      // Vercelの環境変数では改行が \\n として扱われるため、\n に戻す
      key: privateKey.replace(/\\n/g, "\n"),
      scopes: ["https://www.googleapis.com/auth/spreadsheets"],
    });

    const client = google.sheets({ version: "v4", auth });
    sheetsClient = client;
    return client;

  } catch (error) {
    console.error("❌ Google Sheets Clientの認証に失敗しました:", error);
    throw new Error("Google Sheets Clientの認証に失敗しました。環境変数を確認してください。");
  }
}

// --- これ以降の関数 (appendBookRow, readBooks) は変更ありません ---

export async function appendBookRow(
  spreadsheetId: string,
  values: (string | number)[]
) {
  try {
    const sheets = await getSheetsClient();
    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: "Books!A:E",
      valueInputOption: "USER_ENTERED",
      requestBody: { values: [values] },
    });
  } catch (error: any) {
    console.error("スプレッドシートへの行追加に失敗しました:", error.message);
    throw new Error(`スプレッドシートへの行追加に失敗しました。`);
  }
}

export async function readBooks(spreadsheetId: string) {
  try {
    const sheets = await getSheetsClient();
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: "Books!A:E",
    });
    return res.data.values || [];
  } catch (error: any) {
    console.error("スプレッドシートの読み込みに失敗しました:", error.message);
    throw new Error(`スプレッドシートの読み込みに失敗しました。`);
  }
}
