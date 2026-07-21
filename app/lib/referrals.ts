import "server-only";
import { supabaseAdmin } from "./supabaseAdmin";

// Records a referral event — best-effort. A missing/invalid/self
// referral code should never block the contact form or signup it's
// attached to; it just quietly doesn't get credited.
export async function recordReferral(
  referralCode: string | null | undefined,
  referredEmail: string,
  source: "contact" | "signup"
) {
  if (!referralCode) return;

  try {
    const { data, error } = await supabaseAdmin.auth.admin.getUserById(referralCode);
    if (error || !data.user) return;
    if (data.user.email?.toLowerCase() === referredEmail.toLowerCase()) return;

    await supabaseAdmin.from("referrals").insert({
      referrer_user_id: referralCode,
      referred_email: referredEmail,
      source,
    });
  } catch {
    // Ignore — see comment above.
  }
}
