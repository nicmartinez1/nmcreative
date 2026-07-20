import "server-only";
import { google } from "googleapis";

// The whole service account JSON key, base64-encoded into one line —
// avoids every env-var UI mangling multi-line PEM keys with stray
// quotes or converted newlines. Generate it with:
//   base64 -i service-account.json | tr -d '\n'
const SERVICE_ACCOUNT_JSON_BASE64 = process.env.GOOGLE_SERVICE_ACCOUNT_JSON_BASE64;
const SHEET_ID = process.env.GOOGLE_SHEET_ID;

function loadServiceAccount() {
  if (!SERVICE_ACCOUNT_JSON_BASE64) return null;
  try {
    const decoded = Buffer.from(SERVICE_ACCOUNT_JSON_BASE64, "base64").toString("utf8");
    const parsed = JSON.parse(decoded);
    if (!parsed.client_email || !parsed.private_key) return null;
    return parsed as { client_email: string; private_key: string };
  } catch {
    return null;
  }
}

export const isGoogleSheetsConfigured = Boolean(loadServiceAccount() && SHEET_ID);

// Appends one row to the end of the sheet — the durable, ever-growing
// record of every inquiry, kept outside the site's own database so the
// database itself can be cleared out anytime without losing history.
export async function appendContactRow(row: (string | boolean)[]) {
  const serviceAccount = loadServiceAccount();
  if (!serviceAccount || !SHEET_ID) {
    return { ok: false, error: "Google Sheets isn't configured." };
  }

  try {
    const auth = new google.auth.JWT({
      email: serviceAccount.client_email,
      key: serviceAccount.private_key,
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
