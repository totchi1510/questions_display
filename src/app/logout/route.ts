import { NextRequest, NextResponse } from 'next/server';
import { clearSessionCookie } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const res = NextResponse.redirect(new URL('/', req.url), 302);
  const cookie = clearSessionCookie();
  res.cookies.set(cookie.name, cookie.value, cookie.options);
  return res;
}
