import { google } from "googleapis";

export async function getSheetsClient() {
  const auth = new google.auth.GoogleAuth({
    credentials: JSON.parse(process.env.GOOGLE_SERVICE_KEY as string),
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });

  return google.sheets({ version: "v4", auth });
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
    requestBody: {
      values: [values],
    },
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

console.log("ENV check:", {
  email: process.env.GOOGLE_CLIENT_EMAIL,
  keyExists: !!process.env.GOOGLE_PRIVATE_KEY,
  sheet: process.env.SPREADSHEET_ID,
});
