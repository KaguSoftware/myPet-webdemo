import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { supabaseEnvReady } from "./env";

export async function updateSession(request: NextRequest) {
  // Without Supabase keys the client can't be created — skip the auth wall so
  // pages render the config screen instead of 500ing on every request.
  if (!supabaseEnvReady) return NextResponse.next({ request });

  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const path = request.nextUrl.pathname;
  // Reachable without a session. Matched exactly (not by prefix) so
  // "/login-anything" is NOT treated as public. Everything under /auth/* (the
  // email-confirm callback and password-reset landing) is public too — the
  // reset page needs the recovery session to load without a bounce to /login.
  const PUBLIC_PATHS = ["/login", "/signup", "/forgot-password"];
  const isPublic = PUBLIC_PATHS.includes(path) || path.startsWith("/auth/");
  // Entry pages a signed-in user has no reason to see — bounce them home.
  // (Deliberately excludes /auth/* so a logged-in recovery session can still
  // reach /auth/reset to set a new password.)
  const isAuthEntry = PUBLIC_PATHS.includes(path);

  if (!user && !isPublic) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  if (user && isAuthEntry) {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    return NextResponse.redirect(url);
  }

  return response;
}
