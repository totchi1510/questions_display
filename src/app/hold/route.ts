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
    // IP-based dedup: one hold per question per browser network.
    if (ipHash) {
      const { count } = await supabaseAdmin
        .from('likes')
        .select('id', { count: 'exact', head: true })
        .eq('question_id', qid)
        .eq('source_ip_hash', ipHash);
      if ((count ?? 0) > 0) return redirectBack(req, '?held=dup');
    }

    const { error: insErr } = await supabaseAdmin
      .from('likes')
      .insert({ question_id: qid, source_jti: null, source_ip_hash: ipHash });
    if (insErr) throw insErr;

    const { error: rpcErr } = await supabaseAdmin.rpc('increment_question_hold', { qid });
    if (rpcErr) {
      const { data: q } = await supabaseAdmin
        .from('questions')
        .select('hold_count')
        .eq('id', qid)
        .single();
      const next = (q?.hold_count ?? 0) + 1;
      await supabaseAdmin.from('questions').update({ hold_count: next }).eq('id', qid);
    }

    return redirectBack(req, '?held=1');
  } catch (e) {
    console.error('hold error', e);
    return redirectBack(req, '?held=err');
  }
}
