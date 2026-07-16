import { NextResponse } from "next/server";
import { supabaseAdmin, isAdminConfigured, verifyAdmin, findUserByEmail } from "../../../lib/supabaseAdmin";

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const RESEND_FROM_EMAIL = process.env.RESEND_FROM_EMAIL || "Web Skillet <hello@webskillet.net>";

async function sendWebsiteLiveEmail(toEmail: string) {
  if (!RESEND_API_KEY) return;
  try {
    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: RESEND_FROM_EMAIL,
        to: toEmail,
        subject: "Your website is live! \u{1F389}",
        html: "<p>Great news — your new website is complete and live!</p><p>Log in to your <a href=\"https://webskillet.net/client-access\">Web Skillet client portal</a> any time to manage your plan or reach support.</p><p>— The Web Skillet team</p>",
      }),
    });
  } catch {
    // Best-effort — a failed congrats email shouldn't block the billing update.
  }
}

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

  const { email, hasWebsite, monthlyAmount } = await request.json();
  if (!email) {
    return NextResponse.json({ error: "Missing email." }, { status: 400 });
  }

  const matchedUser = await findUserByEmail(email);
  if (!matchedUser) {
    return NextResponse.json({ error: `Couldn't find a client with email ${email}.` }, { status: 404 });
  }

  const { data: existingProfile } = await supabaseAdmin
    .from("client_profiles")
    .select("has_website")
    .eq("user_id", matchedUser.id)
    .maybeSingle();
  const wasWebsiteLive = existingProfile?.has_website ?? false;

  const { error: upsertError } = await supabaseAdmin.from("client_profiles").upsert(
    {
      user_id: matchedUser.id,
      has_website: !!hasWebsite,
      monthly_amount: monthlyAmount === null || monthlyAmount === undefined ? null : monthlyAmount,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" }
  );

  if (upsertError) {
    return NextResponse.json({ error: upsertError.message }, { status: 500 });
  }

  if (!wasWebsiteLive && hasWebsite && matchedUser.email) {
    await sendWebsiteLiveEmail(matchedUser.email);
  }

  return NextResponse.json({ success: true });
}
