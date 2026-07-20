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
    .from("plan_requests")
    .select("id, user_id, plan_name, requested_at")
    .eq("status", "pending")
    .order("requested_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!data) {
    return NextResponse.json({ request: null });
  }

  const { data: userList, error: userListError } = await supabaseAdmin.auth.admin.listUsers({
    perPage: 1000,
  });
  if (userListError) {
    return NextResponse.json({ error: userListError.message }, { status: 500 });
  }
  const user = userList.users.find((u) => u.id === data.user_id);

  return NextResponse.json({
    request: {
      id: data.id,
      email: user?.email ?? "Unknown",
      business_name: user?.user_metadata?.business_name ?? null,
      plan_name: data.plan_name,
      requested_at: data.requested_at,
    },
  });
}
