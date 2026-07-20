import "server-only";

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const RESEND_FROM_EMAIL = process.env.RESEND_FROM_EMAIL || "Web Skillet <hello@webskillet.net>";

export const isResendConfigured = Boolean(RESEND_API_KEY);

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
        html: opts.html,
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
