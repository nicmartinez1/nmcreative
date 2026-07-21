import "server-only";
import { supabaseAdmin } from "./supabaseAdmin";

// Turns a business name into a short, memorable referral code like
// "RIVERSIDE-8K2Q" — a slug of the name plus a random suffix so two
// similarly-named businesses never collide.
function generateReferralCode(businessName: string | undefined) {
  const slug = (businessName || "CLIENT")
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "")
    .slice(0, 12) || "CLIENT";
  const suffix = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `${slug}-${suffix}`;
}

// Ensures the given user has a referral_code on client_profiles,
// generating one the first time (later calls are a no-op). Returns the
// code either way.
export async function ensureReferralCode(userId: string, businessName: string | undefined) {
  const { data: existing } = await supabaseAdmin
    .from("client_profiles")
    .select("referral_code")
    .eq("user_id", userId)
    .maybeSingle();

  if (existing?.referral_code) return existing.referral_code;

  // Retry a couple times on the (very unlikely) chance the random
  // suffix collides with an existing code, since referral_code is unique.
  for (let attempt = 0; attempt < 5; attempt++) {
    const code = generateReferralCode(businessName);
    const { error } = await supabaseAdmin
      .from("client_profiles")
      .upsert({ user_id: userId, referral_code: code }, { onConflict: "user_id" });
    if (!error) return code;
  }
  return null;
}

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
    const { data: profile } = await supabaseAdmin
      .from("client_profiles")
      .select("user_id")
      .eq("referral_code", referralCode.trim().toUpperCase())
      .maybeSingle();
    if (!profile) return;

    const { data: userData } = await supabaseAdmin.auth.admin.getUserById(profile.user_id);
    if (!userData.user) return;
    if (userData.user.email?.toLowerCase() === referredEmail.toLowerCase()) return;

    await supabaseAdmin.from("referrals").insert({
      referrer_user_id: profile.user_id,
      referred_email: referredEmail,
      source,
    });
  } catch {
    // Ignore — see comment above.
  }
}
