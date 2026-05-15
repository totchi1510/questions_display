import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { getStaffRole } from '@/lib/staff';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { postSlackModeration } from '@/lib/slack';
import { evaluateContent, jstDayRangeUtc } from '@/lib/moderation';
import { hashIp } from '@/lib/ip';

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const content = (formData.get('content') ?? '').toString().trim();

  if (!content) {
    return NextResponse.redirect(new URL('/ask?error=empty', req.url));
  }

  const evaluation = evaluateContent(content);

  // Staff posters (rare) are tagged with their role; anonymous posters → 'anon'.
  const staff = await getStaffRole();
  const actorRole = staff?.role ?? 'anon';
  const actorUserId = staff?.userId ?? null;

  try {
    const ip = (await headers()).get('x-forwarded-for')?.split(',')[0]?.trim() || '';
    const { startUtc, endUtc } = jstDayRangeUtc();

    // Per-IP rate limit (hashed and salted). Sessions are gone with the cookie pivot,
    // so we rely on IP only for anonymous posters.
    if (ip) {
      const ipHash = hashIp(ip);
      const { count: ipCount, error: countErr } = await supabaseAdmin
        .from('questions')
        .select('id', { count: 'exact', head: true })
        .eq('meta_ip_hash', ipHash)
        .gte('created_at', startUtc)
        .lt('created_at', endUtc);
      if (countErr) throw countErr;
      if ((ipCount ?? 0) >= 100) {
        await postSlackModeration('Rate limit: IP threshold', { ip: 'masked' });
        return NextResponse.redirect(new URL('/ask?error=rate', req.url));
      }
    }

    if (evaluation.action === 'queue') {
      const { data: qres, error: qerr } = await supabaseAdmin
        .from('questions')
        .insert({ content, meta_ip_hash: ip ? hashIp(ip) : null, published: false })
        .select('id')
        .single();
      if (qerr) throw qerr;

      const qid = qres.id as string;
      const { error: perr } = await supabaseAdmin
        .from('pending_reviews')
        .insert({ question_id: qid, reason: evaluation.reasons.join(','), status: 'pending' });
      if (perr) throw perr;

      await supabaseAdmin.from('moderation_logs').insert({
        action: 'queue',
        actor_role: actorRole,
        question_id: qid,
        details: { reason: evaluation.reasons, user_id: actorUserId },
      });

      await postSlackModeration('Queued for moderation', { question_id: qid, role: actorRole });
      return NextResponse.redirect(new URL('/ask?queued=1', req.url));
    }

    const { error } = await supabaseAdmin
      .from('questions')
      .insert({ content, meta_ip_hash: ip ? hashIp(ip) : null, published: true });
    if (error) throw error;

    await supabaseAdmin.from('moderation_logs').insert({
      action: 'publish',
      actor_role: actorRole,
      details: { user_id: actorUserId },
    });

    return NextResponse.redirect(new URL('/?posted=1', req.url));
  } catch (e) {
    console.error('ask submit POST error', e);
    return NextResponse.redirect(new URL('/ask?error=server', req.url));
  }
}
