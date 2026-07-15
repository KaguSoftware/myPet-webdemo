import { NextResponse } from "next/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";

// Deletes the signed-in user's account. Requires the service-role key (admin
// API) — never exposed to the browser. Deleting the auth user cascades to the
// household and all its data via `households.owner_id ... on delete cascade`.
export async function POST() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }

  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey) {
    return NextResponse.json(
      { error: "Account deletion isn't configured on this deployment." },
      { status: 501 }
    );
  }

  const admin = createAdminClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const { error } = await admin.auth.admin.deleteUser(user.id);
  if (error) {
    console.error("[petpal] account deletion failed:", error);
    return NextResponse.json({ error: "Couldn't delete the account." }, { status: 500 });
  }

  // Clear the now-orphaned session cookies.
  await supabase.auth.signOut();
  return NextResponse.json({ ok: true });
}
