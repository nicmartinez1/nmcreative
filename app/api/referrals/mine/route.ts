import { NextResponse } from "next/server";
import { supabaseAdmin, verifyUser } from "../../../lib/supabaseAdmin";
import { ensureReferralCode } from "../../../lib/referrals";

export async function GET(request: Request) {
  const user = await verifyUser(request);
  if (!user) {
    return NextResponse.json({ error: "Not authorized." }, { status: 401 });
  }

  const { count, error } = await supabaseAdmin
    .from("referrals")
    .select("id", { count: "exact", head: true })
    .eq("referrer_user_id", user.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const referralCode = await ensureReferralCode(user.id, user.user_metadata?.business_name);

  return NextResponse.json({ count: count ?? 0, referralCode });
}
