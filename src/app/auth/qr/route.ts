import { NextRequest, NextResponse } from 'next/server';
import { createSessionCookie, type Role } from '@/lib/auth';
import { lookupValidToken, markTokenUsed } from '@/lib/qrTokens';

const allowDemoTokens = process.env.ENABLE_DEMO_TOKENS === 'true';

const DEMO_TOKEN_TO_ROLE: Record<string, Role> = allowDemoTokens
  ? {
      'demo-viewer': 'viewer',
      'demo-moderator': 'moderator',
      'demo-admin': 'admin',
    }
  : {};

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const token = url.searchParams.get('token') ?? '';

  let role: Role | null = null;
  let tokenId: string | null = null;

  // 1. Demo tokens (only when explicitly enabled)
  if (DEMO_TOKEN_TO_ROLE[token]) {
    role = DEMO_TOKEN_TO_ROLE[token];
  } else if (token) {
    // 2. DB-backed qr_tokens (hash lookup)
    const row = await lookupValidToken(token);
    if (row) {
      role = row.role;
      tokenId = row.id;
    }
  }

  if (!role) {
    return new Response('Invalid or missing token', { status: 400 });
  }

  if (tokenId) {
    await markTokenUsed(tokenId);
  }

  const cookie = createSessionCookie(role);
  const res = NextResponse.redirect(new URL('/', req.url), 302);
  res.cookies.set(cookie.name, cookie.value, cookie.options);
  return res;
}
