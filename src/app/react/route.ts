import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { hashIp } from '@/lib/ip';

const VALID_TYPES = ['think', 'talk', 'inspire'] as const;
type ReactionType = (typeof VALID_TYPES)[number];

function isReactionType(value: string): value is ReactionType {
  return (VALID_TYPES as readonly string[]).includes(value);
}

function redirectBack(req: NextRequest, suffix = '') {
  const referer = req.headers.get('referer');
  const url = referer ? new URL(referer) : new URL('/', req.url);
  if (suffix) {
    url.search = suffix;
  }
  return NextResponse.redirect(url);
}

export async function POST(req: NextRequest) {
  const form = await req.formData();
  const qid = (form.get('question_id') ?? '').toString();
  const typeRaw = (form.get('type') ?? '').toString();
  if (!qid || !isReactionType(typeRaw)) return redirectBack(req);
  const type: ReactionType = typeRaw;

  const ip = (await headers()).get('x-forwarded-for')?.split(',')[0]?.trim() || '';
  const ipHash = ip ? hashIp(ip) : null;

  try {
    if (ipHash) {
      const { count } = await supabaseAdmin
        .from('likes')
        .select('id', { count: 'exact', head: true })
        .eq('question_id', qid)
        .eq('reaction_type', type)
        .eq('source_ip_hash', ipHash);
      if ((count ?? 0) > 0) return redirectBack(req, '?reacted=dup');
    }

    const { error: insErr } = await supabaseAdmin.from('likes').insert({
      question_id: qid,
      source_jti: null,
      source_ip_hash: ipHash,
      reaction_type: type,
    });
    if (insErr) throw insErr;

    const { error: rpcErr } = await supabaseAdmin.rpc('increment_question_reaction', {
      qid,
      rtype: type,
    });
    if (rpcErr) {
      // Read-modify-write fallback
      const column =
        type === 'think' ? 'think_count' : type === 'talk' ? 'talk_count' : 'inspire_count';
      const { data: q } = await supabaseAdmin
        .from('questions')
        .select(column)
        .eq('id', qid)
        .single();
      const current = (q as Record<string, number> | null)?.[column] ?? 0;
      await supabaseAdmin
        .from('questions')
        .update({ [column]: current + 1 })
        .eq('id', qid);
    }

    return redirectBack(req, '?reacted=1');
  } catch (e) {
    console.error('react error', e);
    return redirectBack(req, '?reacted=err');
  }
}
