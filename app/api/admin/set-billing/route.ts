import { NextResponse } from "next/server";
import { supabaseAdmin, isAdminConfigured, verifyAdmin, findUserByEmail } from "../../../lib/supabaseAdmin";

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

  return NextResponse.json({ success: true });
}
