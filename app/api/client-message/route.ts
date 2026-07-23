import { NextResponse } from "next/server";
import { supabaseAdmin, verifyUser } from "../../lib/supabaseAdmin";
import { appendContactRow, formatReceivedAt } from "../../lib/googleSheets";

// A logged-in client sending a quick message from their portal —
// unlike the public contact form, we already know who they are, so
// this only needs the message itself. Lands in the same inbox/Sheet
// as everything else.
export async function POST(request: Request) {
  const user = await verifyUser(request);
  if (!user) {
    return NextResponse.json({ error: "Not authorized." }, { status: 401 });
  }

  const { message } = await request.json();
  if (!message || !message.trim()) {
    return NextResponse.json({ error: "Message can't be empty." }, { status: 400 });
  }

  const businessName = user.user_metadata?.business_name || user.email || "Client";
  const email = user.email ?? "";

  const { error: insertError } = await supabaseAdmin.from("contact_messages").insert({
    business_name: businessName,
    phone: "",
    email,
    address: null,
    is_startup: false,
    services: [],
    message: message.trim(),
  });

  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 500 });
  }

  const sheetResult = await appendContactRow([
    formatReceivedAt(new Date()),
    businessName,
    "",
    email,
    "",
    "No",
    "",
    message.trim(),
  ]);
  if (!sheetResult.ok) {
    console.error("Google Sheets append failed:", sheetResult.error);
  }

  return NextResponse.json({ success: true });
}
