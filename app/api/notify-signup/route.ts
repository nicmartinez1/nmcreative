import { NextResponse } from "next/server";
import { findUserByEmail } from "../../lib/supabaseAdmin";
import { sendEmail } from "../../lib/resend";
import { recordReferral, ensureReferralCode } from "../../lib/referrals";

// New accounts only — guards against this public endpoint being used to
// re-send the welcome email to arbitrary existing accounts on demand.
const RECENT_SIGNUP_WINDOW_MS = 10 * 60 * 1000;

export async function POST(request: Request) {
  const { email, referralCode } = await request.json();
  if (!email) {
    return NextResponse.json({ error: "Missing email." }, { status: 400 });
  }

  const user = await findUserByEmail(email);
  if (!user || !user.created_at) {
    return NextResponse.json({ success: true });
  }

  const accountAge = Date.now() - new Date(user.created_at).getTime();
  if (accountAge > RECENT_SIGNUP_WINDOW_MS) {
    return NextResponse.json({ success: true });
  }

  await recordReferral(referralCode, email, "signup");
  await ensureReferralCode(user.id, user.user_metadata?.business_name);

  await sendEmail({
    to: email,
    subject: "Welcome to Web Skillet! \u{1F373}",
    html: `<p>Welcome aboard — your Web Skillet account is set up.</p><p>Log in any time at <a href="https://webskillet.net/client-access">webskillet.net/client-access</a> to manage your plan, check your project status, or reach support.</p><p>— The Web Skillet team</p>`,
  });

  return NextResponse.json({ success: true });
}
