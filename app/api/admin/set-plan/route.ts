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

  const { email, planName } = await request.json();
  if (!email || !planName) {
    return NextResponse.json({ error: "Missing email or planName." }, { status: 400 });
  }

  const matchedUser = await findUserByEmail(email);
  if (!matchedUser) {
    return NextResponse.json({ error: `Couldn't find a client with email ${email}.` }, { status: 404 });
  }

  const { error: insertError } = await supabaseAdmin
    .from("plan_changes")
    .insert({ user_id: matchedUser.id, plan_name: planName });

  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
