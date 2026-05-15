import 'server-only';
import crypto from 'crypto';
import type { Role } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export function hashToken(raw: string): string {
  return crypto.createHash('sha256').update(raw).digest('hex');
}

export function generateRawToken(): string {
  // 32 hex chars (128 bits) is plenty for an unguessable URL token.
  return crypto.randomBytes(16).toString('hex');
}

export type QrTokenRow = {
  id: string;
  hash: string;
  role: Role;
  expires_at: string;
  revoked_at: string | null;
  used_at: string | null;
  created_at: string;
};

export async function lookupValidToken(rawToken: string): Promise<QrTokenRow | null> {
  if (!rawToken) return null;
  const hash = hashToken(rawToken);

  const { data, error } = await supabaseAdmin
    .from('qr_tokens')
    .select('id, hash, role, expires_at, revoked_at, used_at, created_at')
    .eq('hash', hash)
    .maybeSingle();
  if (error || !data) return null;

  const row = data as QrTokenRow;
  if (row.revoked_at) return null;
  if (new Date(row.expires_at).getTime() <= Date.now()) return null;
  return row;
}

export async function markTokenUsed(tokenId: string): Promise<void> {
  await supabaseAdmin
    .from('qr_tokens')
    .update({ used_at: new Date().toISOString() })
    .eq('id', tokenId)
    .is('used_at', null);
}

export async function createToken(role: Role, ttlDays: number): Promise<{ raw: string; row: QrTokenRow }> {
  const raw = generateRawToken();
  const hash = hashToken(raw);
  const expiresAt = new Date(Date.now() + ttlDays * 24 * 60 * 60 * 1000).toISOString();

  const { data, error } = await supabaseAdmin
    .from('qr_tokens')
    .insert({ hash, role, expires_at: expiresAt })
    .select('id, hash, role, expires_at, revoked_at, used_at, created_at')
    .single();
  if (error) throw error;
  return { raw, row: data as QrTokenRow };
}

export async function revokeToken(id: string): Promise<void> {
  await supabaseAdmin
    .from('qr_tokens')
    .update({ revoked_at: new Date().toISOString() })
    .eq('id', id);
}

export async function listTokens(): Promise<QrTokenRow[]> {
  const { data, error } = await supabaseAdmin
    .from('qr_tokens')
    .select('id, hash, role, expires_at, revoked_at, used_at, created_at')
    .order('created_at', { ascending: false })
    .limit(100);
  if (error) return [];
  return (data ?? []) as QrTokenRow[];
}
