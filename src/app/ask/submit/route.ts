import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { getStaffRole } from '@/lib/staff';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { postSlackModeration } from '@/lib/slack';
import { flagContent, jstDayRangeUtc } from '@/lib/moderation';
import { hashIp } from '@/lib/ip';
import { AUTHOR_COOKIE, authorCookieOptions, getOrInitAuthorToken } from '@/lib/author';
import { clampWidthPx, DEFAULT_WIDTH_PX } from '@/lib/questions';

function clampPercent(raw: FormDataEntryValue | null, fallback: number): number {
  const n = parseFloat((raw ?? '').toString());
  if (!Number.isFinite(n)) return fallback;
  return Math.max(0, Math.min(100, n));
}

function parseWidth(raw: FormDataEntryValue | null): number {
  const n = parseFloat((raw ?? '').toString());
  return clampWidthPx(Number.isFinite(n) ? n : DEFAULT_WIDTH_PX);
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const MAX_INSPIRATIONS = 3;

function parseInspirations(raw: FormDataEntryValue | null): string[] {
  if (!raw) return [];
  const ids = raw
    .toString()
    .split(',')
    .map((s) => s.trim())
    .filter((s) => UUID_RE.test(s));
  return Array.from(new Set(ids)).slice(0, MAX_INSPIRATIONS);
}

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const content = (formData.get('content') ?? '').toString().trim();
  const positionX = clampPercent(formData.get('position_x'), 50);
  const positionY = clampPercent(formData.get('position_y'), 50);
  const widthPx = parseWidth(formData.get('width_px'));
  const inspiredBy = parseInspirations(formData.get('inspired_by'));

  if (!content) {
    return NextResponse.redirect(new URL('/ask?error=empty', req.url));
  }

  const flags = flagContent(content);

  const staff = await getStaffRole();
  const actorRole = staff?.role ?? 'anon';
  const actorUserId = staff?.userId ?? null;

  const { token: authorToken, isNew: isNewAuthor } = await getOrInitAuthorToken();

  try {
    console.log('ask/submit step:start');
    const ip = (await headers()).get('x-forwarded-for')?.split(',')[0]?.trim() || '';
    const { startUtc, endUtc } = jstDayRangeUtc();
    console.log('ask/submit step:after-headers', { hasIp: Boolean(ip) });

    if (ip) {
      try {
        const ipHash = hashIp(ip);
        const { count: ipCount, error: countErr } = await supabaseAdmin
          .from('questions')
          .select('id', { count: 'exact', head: true })
          .eq('meta_ip_hash', ipHash)
          .gte('created_at', startUtc)
          .lt('created_at', endUtc);
        if (countErr) throw countErr;
        console.log('ask/submit step:after-ip-count', { ipCount });
        if ((ipCount ?? 0) >= 100) {
          await postSlackModeration('Rate limit: IP threshold', { ip: 'masked' });
          return NextResponse.redirect(new URL('/ask?error=rate', req.url));
        }
      } catch (rateErr) {
        // Rate-limit is best-effort anti-abuse. Failing it shouldn't block
        // legit posts — log and continue.
        console.warn('ask/submit ip rate-limit skipped:', rateErr);
      }
    }

    console.log('ask/submit step:before-questions-insert');
    const { data: qres, error: qerr } = await supabaseAdmin
      .from('questions')
      .insert({
        content,
        meta_ip_hash: ip ? hashIp(ip) : null,
        published: false,
        author_token: authorToken,
        position_x: positionX,
        position_y: positionY,
        width_px: widthPx,
      })
      .select('id')
      .single();
    if (qerr) throw qerr;
    console.log('ask/submit step:after-questions-insert', { id: qres.id });

    const qid = qres.id as string;
    const reason = flags.length > 0 ? flags.join(',') : 'review_required';

    const { error: perr } = await supabaseAdmin
      .from('pending_reviews')
      .insert({ question_id: qid, reason, status: 'pending' });
    if (perr) throw perr;
    console.log('ask/submit step:after-pending-reviews-insert');

    let linkInsertError: string | null = null;
    if (inspiredBy.length > 0) {
      const linkRows = inspiredBy.map((toId) => ({
        from_question_id: qid,
        to_question_id: toId,
      }));
      const { error: lerr } = await supabaseAdmin
        .from('question_links')
        .insert(linkRows);
      if (lerr) {
        console.error('question_links insert error', lerr);
        linkInsertError = lerr.message;
      }
    }

    console.log('ask/submit step:before-mod-logs');
    await supabaseAdmin.from('moderation_logs').insert({
      action: 'queue',
      actor_role: actorRole,
      question_id: qid,
      details: {
        flags,
        user_id: actorUserId,
        inspired_by: inspiredBy,
        link_insert_error: linkInsertError,
      },
    });
    console.log('ask/submit step:after-mod-logs');

    await postSlackModeration('Queued for moderation', {
      question_id: qid,
      role: actorRole,
      flags,
    });
    console.log('ask/submit step:after-slack');

    const res = NextResponse.redirect(new URL('/ask?queued=1', req.url));
    if (isNewAuthor) {
      res.cookies.set(AUTHOR_COOKIE, authorToken, authorCookieOptions());
    }
    return res;
  } catch (e) {
    console.error('ask submit POST error (raw):', e);
    try {
      const obj = e as Record<string, unknown> | null | undefined;
      console.error(
        'ask submit POST error (props):',
        obj ? Object.getOwnPropertyNames(obj) : []
      );
      console.error(
        'ask submit POST error (json):',
        obj ? JSON.stringify(obj, Object.getOwnPropertyNames(obj)) : String(e)
      );
      console.error(
        'ask submit POST error (typeof):',
        typeof e,
        e instanceof Error ? 'Error' : (e as object)?.constructor?.name
      );
    } catch (logErr) {
      console.error('logging failed', logErr);
    }
    return NextResponse.redirect(new URL('/ask?error=server', req.url));
  }
}
