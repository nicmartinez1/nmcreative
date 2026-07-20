import { NextResponse } from "next/server";
import { supabaseAdmin, isAdminConfigured, verifyAdmin } from "../../../lib/supabaseAdmin";

export async function GET(request: Request) {
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

  const { data, error } = await supabaseAdmin
    .from("contact_messages")
    .select("id, business_name, phone, email, address, is_startup, services, message, created_at, read")
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ messages: data });
}
