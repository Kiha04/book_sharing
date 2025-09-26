// utils/googlesheets.ts
import { google } from "googleapis";

let sheetsClient: any | null = null;

export async function getSheetsClient() {
  if (sheetsClient) {
    return sheetsClient;
  }

  try {
    const clientEmail = process.env.GOOGLE_CLIENT_EMAIL;
    const privateKey = process.env.GOOGLE_PRIVATE_KEY;

    if (!clientEmail || !privateKey) {
      throw new Error("必要なGoogle認証用の環境変数が設定されていません。");
    }

    const auth = new google.auth.JWT({
      email: clientEmail,
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

export async function appendBookRow(
  spreadsheetId: string,
  values: (string | number)[]
) {
  const sheets = await getSheetsClient();
  await sheets.spreadsheets.values.append({
    spreadsheetId,
    range: "Books!A:E",
    valueInputOption: "USER_ENTERED",
    requestBody: { values: [values] },
  });
}

export async function readBooks(spreadsheetId: string) {
  const sheets = await getSheetsClient();
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: "Books!A:E",
  });
  return res.data.values || [];
}
