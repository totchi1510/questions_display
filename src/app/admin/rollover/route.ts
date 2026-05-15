import { NextRequest, NextResponse } from 'next/server';
import { getStaffRole } from '@/lib/staff';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { isValidMonthKey, jstMonthLabel, jstMonthRangeUtc, previousMonthKey } from '@/lib/month';
import { postSlackModeration } from '@/lib/slack';

/**
 * Snapshot a given month's published, non-archived questions into archive_questions.
 * If `month` form field is omitted, defaults to the previous JST month.
 * Idempotent: skips rows whose id already exists in archive_questions.
 */
export async function POST(req: NextRequest) {
  const staff = await getStaffRole();
  if (staff?.role !== 'admin') {
    return new NextResponse('forbidden', { status: 403 });
  }

  const form = await req.formData();
  const requested = (form.get('month') ?? '').toString();
  const month = requested || previousMonthKey(jstMonthLabel());

  if (!isValidMonthKey(month)) {
    return NextResponse.redirect(new URL('/admin/review?rollover=invalid', req.url));
  }

  try {
    const { startUtc, endUtc } = jstMonthRangeUtc(month);
    const { data: rows, error: selErr } = await supabaseAdmin
      .from('questions')
      .select('id, content, created_at, likes_count')
      .eq('published', true)
      .eq('archived', false)
      .gte('created_at', startUtc)
      .lt('created_at', endUtc);
    if (selErr) throw selErr;

    if (!rows || rows.length === 0) {
      await postSlackModeration('Rollover: no rows', { month });
      return NextResponse.redirect(new URL(`/admin/review?rollover=empty&month=${month}`, req.url));
    }

    const archivedAt = new Date().toISOString();
    const snapshots = rows.map((r) => ({
      id: r.id,
      content: r.content,
      created_at: r.created_at,
      archived_at: archivedAt,
      likes_count: r.likes_count ?? 0,
    }));

    const { error: insErr } = await supabaseAdmin
      .from('archive_questions')
      .upsert(snapshots, { onConflict: 'id', ignoreDuplicates: true });
    if (insErr) throw insErr;

    await supabaseAdmin.from('moderation_logs').insert({
      action: 'rollover',
      actor_role: staff.role,
      details: { month, count: snapshots.length, user_id: staff.userId, email: staff.email },
    });
    await postSlackModeration('Rollover: snapshot saved', { month, count: snapshots.length });

    return NextResponse.redirect(new URL(`/admin/review?rollover=ok&month=${month}`, req.url));
  } catch (e) {
    console.error('rollover error', e);
    await postSlackModeration('Rollover failed', { error: (e as Error).message, month });
    return NextResponse.redirect(new URL('/admin/review?rollover=err', req.url));
  }
}
