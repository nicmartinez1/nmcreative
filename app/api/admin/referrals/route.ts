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
    .from("referrals")
    .select("referrer_user_id, referred_email, source, created_at")
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const { data: userList, error: userListError } = await supabaseAdmin.auth.admin.listUsers({
    perPage: 1000,
  });
  if (userListError) {
    return NextResponse.json({ error: userListError.message }, { status: 500 });
  }
  const usersById = new Map<string, { email?: string; business_name?: string }>(
    userList.users.map((u): [string, { email?: string; business_name?: string }] => [
      u.id,
      { email: u.email, business_name: u.user_metadata?.business_name },
    ])
  );

  type ReferrerSummary = {
    referrer_user_id: string;
    email: string;
    business_name: string | null;
    count: number;
    referred: { email: string; source: string; created_at: string }[];
  };

  const summaryByReferrer = new Map<string, ReferrerSummary>();

  for (const row of data) {
    const existing = summaryByReferrer.get(row.referrer_user_id);
    const referredEntry = { email: row.referred_email, source: row.source, created_at: row.created_at };

    if (existing) {
      existing.count += 1;
      existing.referred.push(referredEntry);
    } else {
      const referrer = usersById.get(row.referrer_user_id);
      summaryByReferrer.set(row.referrer_user_id, {
        referrer_user_id: row.referrer_user_id,
        email: referrer?.email ?? "Unknown",
        business_name: referrer?.business_name ?? null,
        count: 1,
        referred: [referredEntry],
      });
    }
  }

  const referrals = Array.from(summaryByReferrer.values()).sort((a, b) => b.count - a.count);

  return NextResponse.json({ referrals });
}
