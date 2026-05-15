import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { getStaffRole } from '@/lib/staff';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { postSlackModeration } from '@/lib/slack';
import { flagContent, jstDayRangeUtc } from '@/lib/moderation';
import { hashIp } from '@/lib/ip';
import { AUTHOR_COOKIE, authorCookieOptions, getOrInitAuthorToken } from '@/lib/author';

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const content = (formData.get('content') ?? '').toString().trim();

  if (!content) {
    return NextResponse.redirect(new URL('/ask?error=empty', req.url));
  }

  const flags = flagContent(content);

  const staff = await getStaffRole();
  const actorRole = staff?.role ?? 'anon';
  const actorUserId = staff?.userId ?? null;

  const { token: authorToken, isNew: isNewAuthor } = await getOrInitAuthorToken();

  try {
    const ip = (await headers()).get('x-forwarded-for')?.split(',')[0]?.trim() || '';
    const { startUtc, endUtc } = jstDayRangeUtc();

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

    const { data: qres, error: qerr } = await supabaseAdmin
      .from('questions')
      .insert({
        content,
        meta_ip_hash: ip ? hashIp(ip) : null,
        published: false,
        author_token: authorToken,
      })
      .select('id')
      .single();
    if (qerr) throw qerr;

    const qid = qres.id as string;
    const reason = flags.length > 0 ? flags.join(',') : 'review_required';

    const { error: perr } = await supabaseAdmin
      .from('pending_reviews')
      .insert({ question_id: qid, reason, status: 'pending' });
    if (perr) throw perr;

    await supabaseAdmin.from('moderation_logs').insert({
      action: 'queue',
      actor_role: actorRole,
      question_id: qid,
      details: { flags, user_id: actorUserId },
    });

    await postSlackModeration('Queued for moderation', {
      question_id: qid,
      role: actorRole,
      flags,
    });

    const res = NextResponse.redirect(new URL('/ask?queued=1', req.url));
    if (isNewAuthor) {
      res.cookies.set(AUTHOR_COOKIE, authorToken, authorCookieOptions());
    }
    return res;
  } catch (e) {
    console.error('ask submit POST error', e);
    return NextResponse.redirect(new URL('/ask?error=server', req.url));
  }
}
