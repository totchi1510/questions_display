import { NextRequest, NextResponse } from 'next/server';
import { createSessionCookie, Role } from '@/lib/auth';

const TOKEN_TO_ROLE: Record<string, Role> = {
  'demo-viewer': 'viewer',
  'demo-moderator': 'moderator',
  'demo-admin': 'admin',
};

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const token = url.searchParams.get('token') ?? '';
  const role = TOKEN_TO_ROLE[token];

  if (!role) {
    return new Response('Invalid or missing token', { status: 400 });
  }

  const cookie = createSessionCookie(role);
  const redirectTo = new URL('/', req.url);
  const res = NextResponse.redirect(redirectTo, 302);
  res.cookies.set(cookie.name, cookie.value, cookie.options);
  return res;
}
