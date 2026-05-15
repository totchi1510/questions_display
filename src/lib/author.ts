import 'server-only';
import crypto from 'crypto';
import { cookies } from 'next/headers';

export const AUTHOR_COOKIE = 'qd_author';

/**
 * Returns the current visitor's anonymous author token, or null if none yet.
 * Used to read existing tokens from a Server Component / Route Handler.
 */
export async function getAuthorToken(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get(AUTHOR_COOKIE)?.value ?? null;
}

/**
 * Returns an author token, generating + flagging it as new if absent.
 * The caller is responsible for actually setting the cookie on the response
 * when isNew=true (Server Components can't set cookies).
 */
export async function getOrInitAuthorToken(): Promise<{ token: string; isNew: boolean }> {
  const existing = await getAuthorToken();
  if (existing) return { token: existing, isNew: false };
  return { token: crypto.randomUUID(), isNew: true };
}

export function authorCookieOptions(maxAgeSec = 60 * 60 * 24 * 365) {
  return {
    httpOnly: true,
    sameSite: 'lax' as const,
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: maxAgeSec,
  };
}
