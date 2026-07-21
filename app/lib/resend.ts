import "server-only";

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const RESEND_FROM_EMAIL = process.env.RESEND_FROM_EMAIL || "Web Skillet <hello@webskillet.net>";

export const isResendConfigured = Boolean(RESEND_API_KEY);

// Brand colors, pulled from globals.css — keep these in sync if the
// site's palette changes.
const BRAND = {
  bg: "#f8f6fb",
  paper: "#150e28",
  accent: "#ff3d7a",
  accent2: "#9b6bff",
  textMuted: "#6b6480",
  border: "#e7e1f2",
};

// Wraps a plain content HTML fragment (just <p>/<ul>/<a> etc, no outer
// document) in one consistent branded email shell — logo header, card
// container, footer. Every email sent through sendEmail() gets this
// automatically, so the look only ever needs updating in one place.
// Uses table-based layout + inline styles throughout since that's what
// actually renders consistently across Gmail/Outlook/Apple Mail, unlike
// the flexbox/CSS-class approach the rest of the site uses.
function wrapEmailTemplate(contentHtml: string) {
  return `<!doctype html>
<html>
  <body style="margin:0; padding:0; background:${BRAND.bg}; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${BRAND.bg}; padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" style="max-width:520px; background:#ffffff; border-radius:20px; border:1px solid ${BRAND.border}; overflow:hidden;" cellpadding="0" cellspacing="0">
            <tr>
              <td style="padding:28px 32px 20px; text-align:center; background:${BRAND.paper};">
                <img src="https://webskillet.net/assets/webskilletlogo.png" alt="Web Skillet" width="140" style="display:block; margin:0 auto; max-width:140px; height:auto;" />
              </td>
            </tr>
            <tr>
              <td style="padding:32px; color:${BRAND.paper}; font-size:15px; line-height:1.6;">
                ${contentHtml}
              </td>
            </tr>
            <tr>
              <td style="padding:20px 32px; border-top:1px solid ${BRAND.border}; text-align:center;">
                <p style="margin:0; font-size:12px; color:${BRAND.textMuted};">
                  Web Skillet · Web design · Social Media · Ads · SEO
                </p>
                <p style="margin:6px 0 0; font-size:12px;">
                  <a href="https://webskillet.net" style="color:${BRAND.accent}; text-decoration:none;">webskillet.net</a>
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

// Best-effort send — a failed notification email should never block the
// action that triggered it (a billing update, a plan switch, etc).
export async function sendEmail(opts: { to: string; subject: string; html: string; replyTo?: string }) {
  if (!RESEND_API_KEY) return { ok: false, error: "Resend isn't configured (missing RESEND_API_KEY)." };

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: RESEND_FROM_EMAIL,
        to: opts.to,
        subject: opts.subject,
        html: wrapEmailTemplate(opts.html),
        ...(opts.replyTo ? { reply_to: opts.replyTo } : {}),
      }),
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      return { ok: false, error: body.message || `Resend responded with ${res.status}.` };
    }
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Failed to reach Resend." };
  }
}

export function escapeHtml(value: string) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
