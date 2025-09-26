//utils/googlesheets.ts 
import { google, sheets_v4 } from "googleapis";

// 認証クライアントを一度生成したら再利用（キャッシュ）する
let sheetsClient: sheets_v4.Sheets | null = null;

export async function getSheetsClient() {
  if (sheetsClient) {
    return sheetsClient;
  }

  const auth = new google.auth.JWT(
    process.env.GOOGLE_CLIENT_EMAIL,
    undefined,
    process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    ["https://www.googleapis.com/auth/spreadsheets"]
  );

  sheetsClient = google.sheets({ version: "v4", auth });
  return sheetsClient;
}
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
