import { NextResponse } from "next/server";
import { supabaseAdmin, isAdminConfigured } from "../../../lib/supabaseAdmin";
import { sendEmail } from "../../../lib/resend";

const CRON_SECRET = process.env.CRON_SECRET;
const DAY_MS = 24 * 60 * 60 * 1000;
const CHECKIN_AFTER_DAYS = 30;
const FEEDBACK_AFTER_DAYS = 14;

type ClientRow = {
  user_id: string;
  email: string;
  current_plan: string;
  plan_since: string;
  has_subscription: boolean;
  website_completed_at: string | null;
  checkin_email_sent_at: string | null;
  feedback_email_sent_at: string | null;
};

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (!CRON_SECRET || authHeader !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json({ error: "Not authorized." }, { status: 401 });
  }

  if (!isAdminConfigured) {
    return NextResponse.json({ error: "Admin isn't configured yet." }, { status: 500 });
  }

  const { data, error } = await supabaseAdmin
    .from("client_current_plans")
    .select("user_id, email, current_plan, plan_since, has_subscription, website_completed_at, checkin_email_sent_at, feedback_email_sent_at");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const clients = data as ClientRow[];
  const now = Date.now();
  let checkinsSent = 0;
  let feedbackSent = 0;

  for (const c of clients) {
    // Recurring "how's it going / want to upgrade" check-in, once per
    // plan tenure — resets automatically whenever plan_since moves
    // forward (i.e. they switch plans again).
    const planSinceMs = new Date(c.plan_since).getTime();
    const dueForCheckin = now - planSinceMs >= CHECKIN_AFTER_DAYS * DAY_MS;
    const alreadySentThisCycle =
      c.checkin_email_sent_at && new Date(c.checkin_email_sent_at).getTime() >= planSinceMs;

    if (c.has_subscription && dueForCheckin && !alreadySentThisCycle) {
      const result = await sendEmail({
        to: c.email,
        subject: "How's everything going?",
        html: `<p>You've been on <strong>${c.current_plan}</strong> for a month now — how's it working out?</p><p>If you're ready for more (social media management, ads, SEO), reply to this email or log in to your <a href="https://webskillet.net/client-access">client portal</a> to request an upgrade any time.</p><p>— The Web Skillet team</p>`,
      });
      if (result.ok) {
        await supabaseAdmin
          .from("client_profiles")
          .upsert({ user_id: c.user_id, checkin_email_sent_at: new Date().toISOString() }, { onConflict: "user_id" });
        checkinsSent++;
      }
    }

    // One-time feedback request, a couple weeks after the website went live.
    if (c.website_completed_at && !c.feedback_email_sent_at) {
      const completedMs = new Date(c.website_completed_at).getTime();
      if (now - completedMs >= FEEDBACK_AFTER_DAYS * DAY_MS) {
        const result = await sendEmail({
          to: c.email,
          subject: "How are we doing?",
          html: `<p>Your website's been live for a couple weeks now — we'd love to hear how it's going.</p><p>Reply to this email with any feedback, good or bad. It genuinely helps.</p><p>— The Web Skillet team</p>`,
        });
        if (result.ok) {
          await supabaseAdmin
            .from("client_profiles")
            .upsert({ user_id: c.user_id, feedback_email_sent_at: new Date().toISOString() }, { onConflict: "user_id" });
          feedbackSent++;
        }
      }
    }
  }

  return NextResponse.json({ checkinsSent, feedbackSent, checked: clients.length });
}
