import { NextResponse } from "next/server";
import { sendEmail, escapeHtml, isResendConfigured } from "../../lib/resend";

const ADMIN_EMAIL = process.env.ADMIN_EMAIL;

export async function POST(request: Request) {
  const { businessName, phone, email, address, isStartup, services, message } = await request.json();

  if (!businessName || !phone || !email) {
    return NextResponse.json({ error: "Missing required fields." }, { status: 400 });
  }

  if (!isResendConfigured || !ADMIN_EMAIL) {
    return NextResponse.json(
      { error: "The contact form isn't connected yet — add RESEND_API_KEY and ADMIN_EMAIL to .env.local." },
      { status: 500 }
    );
  }

  const servicesList = Array.isArray(services) && services.length ? services.join(", ") : "Not specified";
  const addressLine = isStartup ? "New/startup business, no address yet" : address || "Not provided";

  const html = `
    <h2>New inquiry from webskillet.net</h2>
    <p><strong>Business:</strong> ${escapeHtml(businessName)}</p>
    <p><strong>Phone:</strong> ${escapeHtml(phone)}</p>
    <p><strong>Email:</strong> ${escapeHtml(email)}</p>
    <p><strong>Address:</strong> ${escapeHtml(addressLine)}</p>
    <p><strong>Interested in:</strong> ${escapeHtml(servicesList)}</p>
    <p><strong>Message:</strong><br/>${escapeHtml(message || "—").replace(/\n/g, "<br/>")}</p>
  `;

  const result = await sendEmail({
    to: ADMIN_EMAIL,
    subject: `New inquiry: ${businessName}`,
    html,
    replyTo: email,
  });

  if (!result.ok) {
    return NextResponse.json({ error: result.error ?? "Couldn't send the message." }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
