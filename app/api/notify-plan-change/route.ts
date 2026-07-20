import { NextResponse } from "next/server";
import { verifyUser } from "../../lib/supabaseAdmin";
import { sendEmail, escapeHtml } from "../../lib/resend";

const ADMIN_EMAIL = process.env.ADMIN_EMAIL;

export async function POST(request: Request) {
  const user = await verifyUser(request);
  if (!user) {
    return NextResponse.json({ error: "Not authorized." }, { status: 401 });
  }

  const { planName } = await request.json();
  if (!planName) {
    return NextResponse.json({ error: "Missing plan name." }, { status: 400 });
  }

  if (ADMIN_EMAIL && user.email) {
    const businessName = user.user_metadata?.business_name;
    await sendEmail({
      to: ADMIN_EMAIL,
      subject: `Plan request: ${businessName ? `${businessName} (${user.email})` : user.email} wants ${planName}`,
      html: `<p><strong>${escapeHtml(businessName ? `${businessName} — ${user.email}` : user.email)}</strong> requested a switch to <strong>${escapeHtml(planName)}</strong>.</p><p>Approve or deny it from the <a href="https://webskillet.net/admin">admin dashboard</a>.</p>`,
    });
  }

  return NextResponse.json({ success: true });
}
