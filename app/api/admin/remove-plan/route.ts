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

  const { email } = await request.json();
  if (!email) {
    return NextResponse.json({ error: "Missing email." }, { status: 400 });
  }

  const matchedUser = await findUserByEmail(email);
  if (!matchedUser) {
    return NextResponse.json({ error: `Couldn't find a client with email ${email}.` }, { status: 404 });
  }

  const { error: deleteError } = await supabaseAdmin
    .from("plan_changes")
    .delete()
    .eq("user_id", matchedUser.id);

  if (deleteError) {
    return NextResponse.json({ error: deleteError.message }, { status: 500 });
  }

  if (matchedUser.email) {
    await sendEmail({
      to: matchedUser.email,
      subject: "Sorry to see you go",
      html: `<p>Your subscription with Web Skillet has been cancelled — sorry to see you go.</p><p>Here's what happens next:</p><ul><li>Any live website stays up as-is; nothing gets taken down automatically.</li><li>You can still log in to your <a href="https://webskillet.net/client-access">client portal</a> any time to review your account.</li><li>If you ever want to come back or have questions about what changes, just reply to this email — we're happy to help.</li></ul><p>Thanks for giving us a shot.</p><p>— The Web Skillet team</p>`,
    });
  }

  return NextResponse.json({ success: true });
}
