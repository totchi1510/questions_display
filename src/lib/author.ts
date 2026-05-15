import 'server-only';
import crypto from 'crypto';
import { cookies } from 'next/headers';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export const AUTHOR_COOKIE = 'qd_author';

/**
 * Returns the set of question ids posted by the current visitor's cookie token,
 * filtered to ids the caller actually sees on the page. Empty when no token
 * or no overlap.
 */
export async function fetchMyQuestionIds(visibleIds: string[]): Promise<Set<string>> {
  if (visibleIds.length === 0) return new Set();
  const token = await getAuthorToken();
  if (!token) return new Set();
  const { data, error } = await supabaseAdmin
    .from('questions')
    .select('id')
    .eq('author_token', token)
    .in('id', visibleIds);
  if (error || !data) return new Set();
  return new Set(data.map((r) => String(r.id)));
}

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
