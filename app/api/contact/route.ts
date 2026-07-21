import { NextResponse } from "next/server";
import { supabaseAdmin } from "../../lib/supabaseAdmin";
import { appendContactRow } from "../../lib/googleSheets";

export async function POST(request: Request) {
  const { businessName, phone, email, address, isStartup, services, message } = await request.json();

  if (!businessName || !phone || !email) {
    return NextResponse.json({ error: "Missing required fields." }, { status: 400 });
  }

  const addressLine = isStartup ? null : address || null;
  const servicesList = Array.isArray(services) ? services : [];

  const { error: insertError } = await supabaseAdmin.from("contact_messages").insert({
    business_name: businessName,
    phone,
    email,
    address: addressLine,
    is_startup: !!isStartup,
    services: servicesList,
    message: message || null,
  });

  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 500 });
  }

  // Best-effort — the durable ongoing record lives in the Sheet, but a
  // failure here shouldn't block the inquiry from landing in the inbox.
  const sheetResult = await appendContactRow([
    new Date().toISOString(),
    businessName,
    phone,
    email,
    addressLine || "",
    isStartup,
    servicesList.join(", "),
    message || "",
  ]);
  if (!sheetResult.ok) {
    console.error("Google Sheets append failed:", sheetResult.error);
  }

  return NextResponse.json({ success: true });
}
