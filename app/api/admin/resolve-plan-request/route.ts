import { NextResponse } from "next/server";
import { supabaseAdmin, isAdminConfigured, verifyAdmin } from "../../../lib/supabaseAdmin";
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

  const { requestId, decision } = await request.json();
  if (!requestId || (decision !== "approve" && decision !== "deny")) {
    return NextResponse.json({ error: "Missing or invalid request." }, { status: 400 });
  }

  const { data: planRequest, error: fetchError } = await supabaseAdmin
    .from("plan_requests")
    .select("id, user_id, plan_name, status")
    .eq("id", requestId)
    .maybeSingle();

  if (fetchError) {
    return NextResponse.json({ error: fetchError.message }, { status: 500 });
  }
  if (!planRequest) {
    return NextResponse.json({ error: "That request no longer exists." }, { status: 404 });
  }
  if (planRequest.status !== "pending") {
    return NextResponse.json({ error: "That request has already been resolved." }, { status: 409 });
  }

  if (decision === "approve") {
    const { error: insertError } = await supabaseAdmin
      .from("plan_changes")
      .insert({ user_id: planRequest.user_id, plan_name: planRequest.plan_name });
    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }
  }

  const { error: updateError } = await supabaseAdmin
    .from("plan_requests")
    .update({ status: decision === "approve" ? "approved" : "denied", resolved_at: new Date().toISOString() })
    .eq("id", requestId);

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  const { data: userData } = await supabaseAdmin.auth.admin.getUserById(planRequest.user_id);
  const clientEmail = userData.user?.email;
  if (clientEmail && decision === "approve") {
    await sendEmail({
      to: clientEmail,
      subject: `Your plan change to ${planRequest.plan_name} is approved`,
      html: `<p>Good news — your request to switch to <strong>${planRequest.plan_name}</strong> has been approved and is now active.</p><p>Log in to your <a href="https://webskillet.net/client-access">Web Skillet client portal</a> any time to review your plan.</p>`,
    });
  }

  return NextResponse.json({ success: true });
}
