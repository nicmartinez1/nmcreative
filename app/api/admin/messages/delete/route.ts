import { NextResponse } from "next/server";
import { supabaseAdmin, isAdminConfigured, verifyAdmin } from "../../../../lib/supabaseAdmin";

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

  const { id } = await request.json();
  if (!id) {
    return NextResponse.json({ error: "Missing message id." }, { status: 400 });
  }

  const { error } = await supabaseAdmin.from("contact_messages").delete().eq("id", id);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
