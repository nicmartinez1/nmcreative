import { NextResponse } from "next/server";
import { supabaseAdmin, isAdminConfigured, verifyAdmin, findUserByEmail } from "../../../lib/supabaseAdmin";
import { sendEmail } from "../../../lib/resend";

export async function POST(request: Request) {
  if (!isAdminConfigured) {
    return NextResponse.json(
      { error: "Admin dashboard isn't configured yet — add SUPABASE_SERVICE_ROLE_KEY and ADMIN_EMAIL to .env.local." },
      { status: 500 }
    );
  }

  const admin = await verifyAdmin(request);
  if (!admin) {
    return NextResponse.json({ error: "Not authorized." }, { status: 403 });
  }

  const { email, hasWebsite, hasSubscription, monthlyAmount } = await request.json();
  if (!email) {
    return NextResponse.json({ error: "Missing email." }, { status: 400 });
  }

  const matchedUser = await findUserByEmail(email);
  if (!matchedUser) {
    return NextResponse.json({ error: `Couldn't find a client with email ${email}.` }, { status: 404 });
  }

  const { data: existingProfile } = await supabaseAdmin
    .from("client_profiles")
    .select("has_website, website_completed_at")
    .eq("user_id", matchedUser.id)
    .maybeSingle();
  const wasWebsiteLive = existingProfile?.has_website ?? false;
  const now = new Date().toISOString();
  // Only stamp the FIRST time a site goes live — later toggles don't move it.
  const websiteCompletedAt = existingProfile?.website_completed_at ?? (hasWebsite ? now : null);

  const { error: upsertError } = await supabaseAdmin.from("client_profiles").upsert(
    {
      user_id: matchedUser.id,
      has_website: !!hasWebsite,
      has_subscription: !!hasSubscription,
      monthly_amount: hasSubscription && monthlyAmount !== null && monthlyAmount !== undefined ? monthlyAmount : null,
      website_completed_at: websiteCompletedAt,
      updated_at: now,
    },
    { onConflict: "user_id" }
  );

  if (upsertError) {
    return NextResponse.json({ error: upsertError.message }, { status: 500 });
  }

  if (!wasWebsiteLive && hasWebsite && matchedUser.email) {
    await sendEmail({
      to: matchedUser.email,
      subject: "Your website is live! \u{1F389}",
      html: "<p>Great news — your new website is complete and live!</p><p>Log in to your <a href=\"https://webskillet.net/client-access\">Web Skillet client portal</a> any time to manage your plan or reach support.</p><p>— The Web Skillet team</p>",
    });
  }

  return NextResponse.json({ success: true });
}
