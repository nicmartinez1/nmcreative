import { NextResponse } from "next/server";
import { supabaseAdmin } from "../../lib/supabaseAdmin";

export async function POST(request: Request) {
  const { businessName, phone, email, address, isStartup, services, message } = await request.json();

  if (!businessName || !phone || !email) {
    return NextResponse.json({ error: "Missing required fields." }, { status: 400 });
  }

  const { error: insertError } = await supabaseAdmin.from("contact_messages").insert({
    business_name: businessName,
    phone,
    email,
    address: isStartup ? null : address || null,
    is_startup: !!isStartup,
    services: Array.isArray(services) ? services : [],
    message: message || null,
  });

  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
