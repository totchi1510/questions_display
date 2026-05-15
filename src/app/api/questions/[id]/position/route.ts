import { NextRequest, NextResponse } from 'next/server';
import { getAuthorToken } from '@/lib/author';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function clampPercent(n: unknown): number | null {
  const v = typeof n === 'number' ? n : parseFloat(String(n));
  if (!Number.isFinite(v)) return null;
  return Math.max(0, Math.min(100, v));
}

export async function POST(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  const { id } = await ctx.params;
  if (!UUID_RE.test(id)) {
    return NextResponse.json({ ok: false, error: 'invalid_id' }, { status: 400 });
  }

  const token = await getAuthorToken();
  if (!token) {
    return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  if (!body || typeof body !== 'object') {
    return NextResponse.json({ ok: false, error: 'invalid_body' }, { status: 400 });
  }
  const x = clampPercent((body as { x?: unknown }).x);
  const y = clampPercent((body as { y?: unknown }).y);
  if (x === null || y === null) {
    return NextResponse.json({ ok: false, error: 'invalid_position' }, { status: 400 });
  }

  // Ownership check + update gated by author_token match. Doing this in a
  // single statement keeps the check race-free.
  const { data, error } = await supabaseAdmin
    .from('questions')
    .update({ position_x: x, position_y: y })
    .eq('id', id)
    .eq('author_token', token)
    .select('id')
    .maybeSingle();

  if (error) {
    return NextResponse.json({ ok: false, error: 'update_failed' }, { status: 500 });
  }
  if (!data) {
    return NextResponse.json({ ok: false, error: 'not_owner_or_missing' }, { status: 403 });
  }

  return NextResponse.json({ ok: true, position: { x, y } });
}
