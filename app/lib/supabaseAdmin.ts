import "server-only";
import { createClient } from "@supabase/supabase-js";

// Server-only client using the service_role key — bypasses RLS entirely.
// Never import this from a "use client" component; it must only ever
// run inside API routes / server code.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";

export const isAdminConfigured = Boolean(supabaseUrl && serviceRoleKey && process.env.ADMIN_EMAIL);

export const supabaseAdmin = createClient(
  supabaseUrl || "https://placeholder.supabase.co",
  serviceRoleKey || "placeholder-service-role-key"
);

// Verifies the request's bearer token belongs to a logged-in user whose
// email matches ADMIN_EMAIL. Returns that user, or null if unauthorized.
export async function verifyAdmin(request: Request) {
  const authHeader = request.headers.get("authorization");
  const token = authHeader?.replace("Bearer ", "");
  if (!token) return null;

  const anonClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
  const { data: userData, error: userError } = await anonClient.auth.getUser(token);
  if (userError || !userData.user) return null;

  const adminEmail = process.env.ADMIN_EMAIL!.toLowerCase();
  if (userData.user.email?.toLowerCase() !== adminEmail) return null;

  return userData.user;
}

// Looks up an auth user by email using the admin API (auth.users isn't
// exposed via the regular REST API, so this is the supported way).
export async function findUserByEmail(email: string) {
  const listResult = await supabaseAdmin.auth.admin.listUsers({ perPage: 1000 });
  if (listResult.error) throw new Error(listResult.error.message);

  return listResult.data.users.find(
    (u: { email?: string }) => u.email?.toLowerCase() === email.toLowerCase()
  );
}
