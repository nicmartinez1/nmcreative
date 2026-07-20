import "server-only";
import { google } from "googleapis";

const SERVICE_ACCOUNT_EMAIL = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
const SERVICE_ACCOUNT_PRIVATE_KEY = process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY?.replace(/\\n/g, "\n");
const SHEET_ID = process.env.GOOGLE_SHEET_ID;

export const isGoogleSheetsConfigured = Boolean(
  SERVICE_ACCOUNT_EMAIL && SERVICE_ACCOUNT_PRIVATE_KEY && SHEET_ID
);

// Appends one row to the end of the sheet — the durable, ever-growing
// record of every inquiry, kept outside the site's own database so the
// database itself can be cleared out anytime without losing history.
export async function appendContactRow(row: (string | boolean)[]) {
  if (!isGoogleSheetsConfigured) {
    return { ok: false, error: "Google Sheets isn't configured." };
  }

  try {
    const auth = new google.auth.JWT({
      email: SERVICE_ACCOUNT_EMAIL,
      key: SERVICE_ACCOUNT_PRIVATE_KEY,
      scopes: ["https://www.googleapis.com/auth/spreadsheets"],
    });

    const sheets = google.sheets({ version: "v4", auth });
    await sheets.spreadsheets.values.append({
      spreadsheetId: SHEET_ID,
      range: "Sheet1!A:I",
      valueInputOption: "USER_ENTERED",
      insertDataOption: "INSERT_ROWS",
      requestBody: { values: [row] },
    });
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Failed to reach Google Sheets." };
  }
}
