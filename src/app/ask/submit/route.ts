import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { cookies } from 'next/headers';
import { parseSessionToken } from '@/lib/auth';
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

  // Evaluate content per moderation policy
  const evaluation = evaluateContent(content);

  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get('qd_session')?.value;
  const session = parseSessionToken(sessionCookie);
  const role = session?.role ?? 'viewer';
  const jti = session?.jti ?? null;

  try {
    // resolve client ip once (masked storage)
    const ip = (await headers()).get('x-forwarded-for')?.split(',')[0]?.trim() || '';

    // simple rate limiting (MVP): per-session (jti) and per-IP counts per JST day
    const { startUtc, endUtc } = jstDayRangeUtc();
    // per-session via moderation_logs.details.jti
    if (jti) {
      const { count: sessionCount, error: countErr1 } = await supabaseAdmin
        .from('moderation_logs')
        .select('id', { count: 'exact', head: true })
        .contains('details', { jti })
        .gte('created_at', startUtc)
        .lt('created_at', endUtc);
      if (countErr1) throw countErr1;
      if ((sessionCount ?? 0) >= 50) {
        await postSlackModeration('Rate limit: session threshold', { jti, ip: 'masked' });
        return NextResponse.redirect(new URL('/ask?error=rate', req.url));
      }
    }

    // per-IP via questions.meta_ip_hash (hashed and salted)
    if (ip) {
      const ipHash = hashIp(ip);
      const { count: ipCount, error: countErr2 } = await supabaseAdmin
        .from('questions')
        .select('id', { count: 'exact', head: true })
        .eq('meta_ip_hash', ipHash)
        .gte('created_at', startUtc)
        .lt('created_at', endUtc);
      if (countErr2) throw countErr2;
      if ((ipCount ?? 0) >= 100) {
        await postSlackModeration('Rate limit: IP threshold', { ip: 'masked' });
        return NextResponse.redirect(new URL('/ask?error=rate', req.url));
      }
    }
    if (evaluation.action === 'queue') {
      // insert a pending review and log
      const { data: qres, error: qerr } = await supabaseAdmin
        .from('questions')
        .insert({ content, meta_ip_hash: ip ? hashIp(ip) : null })
        .select('id')
        .single();
      if (qerr) throw qerr;

      const qid = qres.id as string;
      const { error: perr } = await supabaseAdmin
        .from('pending_reviews')
        .insert({ question_id: qid, reason: evaluation.reasons.join(','), status: 'pending' });
      if (perr) throw perr;

      await supabaseAdmin
        .from('moderation_logs')
        .insert({ action: 'queue', actor_role: role, question_id: qid, details: { reason: evaluation.reasons, jti } });

      await postSlackModeration('Queued for moderation', { question_id: qid, role, jti });
      return NextResponse.redirect(new URL('/ask?queued=1', req.url));
    }

    // direct publish to questions
    const { error } = await supabaseAdmin
      .from('questions')
      .insert({ content, meta_ip_hash: ip ? hashIp(ip) : null });
    if (error) throw error;

    await supabaseAdmin
      .from('moderation_logs')
      .insert({ action: 'publish', actor_role: role, details: { jti } });

    return NextResponse.redirect(new URL('/?posted=1', req.url));
  } catch (e) {
    console.error('ask submit POST error', e);
    return NextResponse.redirect(new URL('/ask?error=server', req.url));
  }
}
