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

export function formatReceivedAt(date: Date) {
  const formatted = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Chicago",
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(date);
  return formatted.replace(" AM", "am").replace(" PM", "pm");
}

// Inserts one row right below the header (row 2) — the durable,
// ever-growing record of every inquiry, kept outside the site's own
// database so the database itself can be cleared out anytime without
// losing history. Newest first, so a fresh blank row 2 is inserted
// (pushing everything else down) before it's filled in — the Sheets
// API's own "append" only ever adds to the bottom, so this is a
// two-step insert-then-write instead of a single append call.
export async function appendContactRow(row: string[]) {
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

    const meta = await sheets.spreadsheets.get({ spreadsheetId: SHEET_ID });
    const sheet = meta.data.sheets?.find((s) => s.properties?.title === "Sheet1") ?? meta.data.sheets?.[0];
    const sheetId = sheet?.properties?.sheetId;
    if (sheetId === undefined || sheetId === null) {
      return { ok: false, error: "Couldn't find the Sheet1 tab." };
    }

    await sheets.spreadsheets.batchUpdate({
      spreadsheetId: SHEET_ID,
      requestBody: {
        requests: [
          {
            insertDimension: {
              range: { sheetId, dimension: "ROWS", startIndex: 1, endIndex: 2 },
              inheritFromBefore: false,
            },
          },
        ],
      },
    });

    await sheets.spreadsheets.values.update({
      spreadsheetId: SHEET_ID,
      range: "Sheet1!A2",
      valueInputOption: "USER_ENTERED",
      requestBody: { values: [row] },
    });

    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Failed to reach Google Sheets." };
  }
}
