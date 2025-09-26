// src/utils/googlesheets.ts (この内容に完全に置き換えてください)

import { google, sheets_v4 } from "googleapis"; // sheets_v4 もインポート

// 認証クライアントを一度生成したら再利用（キャッシュ）する
let sheetsClient: sheets_v4.Sheets | null = null;

export async function getSheetsClient(): Promise<sheets_v4.Sheets> {
  // キャッシュがあれば再利用
  if (sheetsClient) {
    return sheetsClient;
  }

  try {
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

// --- これ以降の関数はエラーハンドリングを追加 ---

export async function appendBookRow(
  spreadsheetId: string,
  values: (string | number)[]
) {
  try {
    const sheets = await getSheetsClient();
    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: "Books!A:E", // シート名を確認
      valueInputOption: "USER_ENTERED",
      requestBody: {
        values: [values],
      },
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
      range: "Books!A:E", // シート名を確認
    });
    return res.data.values || [];
  } catch (error: any) {
    console.error("スプレッドシートの読み込みに失敗しました:", error.message);
    throw new Error(`スプレッドシートの読み込みに失敗しました。`);
  }
}
