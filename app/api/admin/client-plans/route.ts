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
    .from("client_current_plans")
    .select("*")
    .order("plan_since", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const { data: userList, error: userListError } = await supabaseAdmin.auth.admin.listUsers({
    perPage: 1000,
  });
  if (userListError) {
    return NextResponse.json({ error: userListError.message }, { status: 500 });
  }

  const businessNameByEmail = new Map<string | undefined, string | undefined>(
    userList.users.map((u): [string | undefined, string | undefined] => [
      u.email?.toLowerCase(),
      u.user_metadata?.business_name,
    ])
  );

  const clients = data.map((c) => ({
    ...c,
    business_name: businessNameByEmail.get(c.email?.toLowerCase()) || c.website || null,
  }));

  return NextResponse.json({ clients });
}
