import { NextResponse } from "next/server";
import { supabaseAdmin, isAdminConfigured } from "../../../lib/supabaseAdmin";
import { sendEmail } from "../../../lib/resend";

const CRON_SECRET = process.env.CRON_SECRET;
const ADMIN_EMAIL = process.env.ADMIN_EMAIL?.toLowerCase();
const DAY_MS = 24 * 60 * 60 * 1000;
const SURVEY_AFTER_DAYS = 7;
const CHECKIN_AFTER_DAYS = 30;
const FEEDBACK_AFTER_DAYS = 14;

type ClientRow = {
  user_id: string;
  email: string;
  current_plan: string | null;
  plan_since: string | null;
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

  const now = Date.now();
  let surveysSent = 0;
  let checkinsSent = 0;
  let feedbackSent = 0;

  // Post-signup survey: 7 days after account creation, for EVERY client
  // regardless of plan/subscription status — plan_changes-driven data
  // only covers clients who've picked a plan, which misses brand new
  // signups, so this scans auth.users directly instead.
  const { data: userList, error: userListError } = await supabaseAdmin.auth.admin.listUsers({ perPage: 1000 });
  if (userListError) {
    return NextResponse.json({ error: userListError.message }, { status: 500 });
  }

  const { data: profiles, error: profilesError } = await supabaseAdmin
    .from("client_profiles")
    .select("user_id, signup_survey_sent_at");
  if (profilesError) {
    return NextResponse.json({ error: profilesError.message }, { status: 500 });
  }
  const surveySentByUserId = new Map(profiles.map((p) => [p.user_id, p.signup_survey_sent_at]));

  for (const u of userList.users) {
    if (!u.email || u.email.toLowerCase() === ADMIN_EMAIL) continue;
    if (!u.created_at) continue;

    const alreadySurveyed = surveySentByUserId.get(u.id);
    if (alreadySurveyed) continue;

    const accountAgeMs = now - new Date(u.created_at).getTime();
    if (accountAgeMs < SURVEY_AFTER_DAYS * DAY_MS) continue;

    const result = await sendEmail({
      to: u.email,
      subject: "How's it going so far?",
      html: `<p>You've had your Web Skillet account for a week now — we'd love a quick pulse check.</p><p>How's everything going? Reply to this email and let us know — good, bad, or anywhere in between.</p><p>— The Web Skillet team</p>`,
    });
    if (result.ok) {
      await supabaseAdmin
        .from("client_profiles")
        .upsert({ user_id: u.id, signup_survey_sent_at: new Date().toISOString() }, { onConflict: "user_id" });
      surveysSent++;
    }
  }

  const { data, error } = await supabaseAdmin
    .from("client_current_plans")
    .select("user_id, email, current_plan, plan_since, has_subscription, website_completed_at, checkin_email_sent_at, feedback_email_sent_at");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const clients = (data as ClientRow[]).filter((c) => c.email.toLowerCase() !== ADMIN_EMAIL);

  for (const c of clients) {
    // Recurring "how's it going / want to upgrade" check-in, once per
    // plan tenure — resets automatically whenever plan_since moves
    // forward (i.e. they switch plans again). Skipped entirely for
    // clients with no plan yet (plan_since null).
    const planSinceMs = c.plan_since ? new Date(c.plan_since).getTime() : null;
    const dueForCheckin = planSinceMs !== null && now - planSinceMs >= CHECKIN_AFTER_DAYS * DAY_MS;
    const alreadySentThisCycle =
      planSinceMs !== null && c.checkin_email_sent_at && new Date(c.checkin_email_sent_at).getTime() >= planSinceMs;

    if (c.has_subscription && c.current_plan && dueForCheckin && !alreadySentThisCycle) {
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

  return NextResponse.json({ surveysSent, checkinsSent, feedbackSent, checked: clients.length });
}
