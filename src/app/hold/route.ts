import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { hashIp } from '@/lib/ip';

type Result =
  | { ok: true; status: 'held' | 'duplicate'; count: number }
  | { ok: false; error: string };

function json(body: Result, init?: ResponseInit) {
  return NextResponse.json(body, init);
}

export async function POST(req: NextRequest) {
  const form = await req.formData();
  const qid = (form.get('question_id') ?? '').toString();
  if (!qid) {
    return json({ ok: false, error: 'missing_question_id' }, { status: 400 });
  }

  const ip = (await headers()).get('x-forwarded-for')?.split(',')[0]?.trim() || '';
  const ipHash = ip ? hashIp(ip) : null;

  try {
    if (ipHash) {
      const { count: dupCount } = await supabaseAdmin
        .from('likes')
        .select('id', { count: 'exact', head: true })
        .eq('question_id', qid)
        .eq('source_ip_hash', ipHash);
      if ((dupCount ?? 0) > 0) {
        const { data: q } = await supabaseAdmin
          .from('questions')
          .select('hold_count')
          .eq('id', qid)
          .single();
        return json({ ok: true, status: 'duplicate', count: q?.hold_count ?? 0 });
      }
    }

    const { error: insErr } = await supabaseAdmin
      .from('likes')
      .insert({ question_id: qid, source_jti: null, source_ip_hash: ipHash });
    if (insErr) throw insErr;

    let nextCount: number | null = null;
    const { error: rpcErr } = await supabaseAdmin.rpc('increment_question_hold', { qid });
    if (rpcErr) {
      const { data: q } = await supabaseAdmin
        .from('questions')
        .select('hold_count')
        .eq('id', qid)
        .single();
      nextCount = (q?.hold_count ?? 0) + 1;
      await supabaseAdmin.from('questions').update({ hold_count: nextCount }).eq('id', qid);
    } else {
      const { data: q } = await supabaseAdmin
        .from('questions')
        .select('hold_count')
        .eq('id', qid)
        .single();
      nextCount = q?.hold_count ?? null;
    }

    return json({ ok: true, status: 'held', count: nextCount ?? 0 });
  } catch (e) {
    console.error('hold error', e);
    return json({ ok: false, error: 'server' }, { status: 500 });
  }
}
