import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

/**
 * Refresh the Supabase auth session on every request and forward fresh
 * cookies on the response. Without this, Server Components can refresh the
 * token in memory but can't write the new cookies back, so the next request
 * arrives with a stale (already-rotated) refresh token and auth.getUser()
 * fails. The Supabase SSR guide treats this middleware as required.
 */
export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return response;

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options)
        );
      },
    },
  });

  // Triggers refresh if needed and persists rotated cookies.
  await supabase.auth.getUser();

  return response;
}

export const config = {
  // Skip Next internals and static assets; everything else (pages and route
  // handlers) goes through session refresh.
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)'],
};
