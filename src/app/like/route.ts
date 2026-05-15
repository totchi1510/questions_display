import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { hashIp } from '@/lib/ip';

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
  if (!qid) return redirectBack(req);

  const ip = (await headers()).get('x-forwarded-for')?.split(',')[0]?.trim() || '';
  const ipHash = ip ? hashIp(ip) : null;

  try {
    // IP-based dedup. Without an IP we skip dedup (local dev / proxy edge cases).
    if (ipHash) {
      const { count } = await supabaseAdmin
        .from('likes')
        .select('id', { count: 'exact', head: true })
        .eq('question_id', qid)
        .eq('source_ip_hash', ipHash);
      if ((count ?? 0) > 0) return redirectBack(req, '?liked=dup');
    }

    const { error: likeErr } = await supabaseAdmin
      .from('likes')
      .insert({ question_id: qid, source_jti: null, source_ip_hash: ipHash });
    if (likeErr) throw likeErr;

    const { error: rpcErr } = await supabaseAdmin.rpc('increment_question_likes', { qid });
    if (rpcErr) {
      const { data: q } = await supabaseAdmin
        .from('questions')
        .select('likes_count')
        .eq('id', qid)
        .single();
      const next = (q?.likes_count ?? 0) + 1;
      await supabaseAdmin.from('questions').update({ likes_count: next }).eq('id', qid);
    }

    return redirectBack(req, '?liked=1');
  } catch (e) {
    console.error('like error', e);
    return redirectBack(req, '?liked=err');
  }
}
