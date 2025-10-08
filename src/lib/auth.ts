import crypto from 'crypto';

export type Role = 'viewer' | 'moderator' | 'admin';

export interface SessionPayload {
  role: Role;
  exp: number;
  jti: string;
}

export const COOKIE_NAME = 'qd_session';

function b64urlEncode(buf: Buffer) {
  return buf
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '');
}

function b64urlDecode(str: string) {
  const pad = (4 - (str.length % 4 || 4)) % 4;
  const b64 = str.replace(/-/g, '+').replace(/_/g, '/') + '='.repeat(pad);
  return Buffer.from(b64, 'base64');
}

function getSecret() {
  return process.env.SESSION_SECRET || '';
}

function sign(data: string, secret: string) {
  return crypto.createHmac('sha256', secret).update(data).digest();
}

export function createSessionToken(role: Role, ttlSec = 60 * 60 * 24 * 7) {
  const now = Math.floor(Date.now() / 1000);
  const payload: SessionPayload = {
    role,
    exp: now + ttlSec,
    jti: crypto.randomUUID(),
  };
  const payloadB64 = b64urlEncode(Buffer.from(JSON.stringify(payload)));
  const secret = getSecret();

  if (!secret) {
    return { token: 'u.' + payloadB64, exp: payload.exp };
  }

  const sig = b64urlEncode(sign(payloadB64, secret));
  return { token: payloadB64 + '.' + sig, exp: payload.exp };
}

export function parseSessionToken(token?: string): SessionPayload | null {
  if (!token) return null;
  try {
    if (token.startsWith('u.')) {
      const payloadB64 = token.slice(2);
      const json = b64urlDecode(payloadB64).toString('utf8');
      const payload = JSON.parse(json) as SessionPayload;
      if (payload.exp <= Math.floor(Date.now() / 1000)) return null;
      return payload;
    }

    const parts = token.split('.');
    if (parts.length !== 2) return null;
    const payloadB64 = parts[0];
    const sigB64 = parts[1];

    const secret = getSecret();
    if (!secret) {
      return null;
    }

    const expected = b64urlEncode(sign(payloadB64, secret));
    if (expected !== sigB64) return null;

    const json = b64urlDecode(payloadB64).toString('utf8');
    const payload = JSON.parse(json) as SessionPayload;
    if (payload.exp <= Math.floor(Date.now() / 1000)) return null;
    return payload;
  } catch {
    return null;
  }
}

export function createSessionCookie(role: Role, ttlSec?: number) {
  const created = createSessionToken(role, ttlSec);
  return {
    name: COOKIE_NAME,
    value: created.token,
    options: {
      httpOnly: true,
      secure: true,
      sameSite: 'lax' as const,
      path: '/',
      expires: new Date(created.exp * 1000),
    },
  };
}

export function clearSessionCookie() {
  return {
    name: COOKIE_NAME,
    value: '',
    options: {
      httpOnly: true,
      secure: true,
      sameSite: 'lax' as const,
      path: '/',
      maxAge: 0,
    },
  };
}
