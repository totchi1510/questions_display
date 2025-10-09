import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { parseSessionToken } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { postSlackModeration } from '@/lib/slack';

export async function POST(req: NextRequest) {
  const cookieStore = await cookies();
  const token = cookieStore.get('qd_session')?.value;
  const session = parseSessionToken(token);
  const role = session?.role;
  const jti = session?.jti;
  if (!role || (role !== 'moderator' && role !== 'admin')) {
    return new NextResponse('forbidden', { status: 403 });
  }

  const form = await req.formData();
  const id = (form.get('id') ?? '').toString();
  if (!id) return NextResponse.redirect(new URL('/admin/review?error=missing', req.url));

  try {
    const { data: pr, error: getErr } = await supabaseAdmin
      .from('pending_reviews')
      .select('id, question_id')
      .eq('id', id)
      .single();
    if (getErr) throw getErr;

    const qid = pr.question_id as string;

    // mark review and archive the question (soft)
    const { error: upErr } = await supabaseAdmin
      .from('pending_reviews')
      .update({ status: 'rejected', reviewed_at: new Date().toISOString() })
      .eq('id', id);
    if (upErr) throw upErr;

    const { error: qErr } = await supabaseAdmin
      .from('questions')
      .update({ archived: true, archived_at: new Date().toISOString() })
      .eq('id', qid);
    if (qErr) throw qErr;

    await supabaseAdmin
      .from('moderation_logs')
      .insert({ action: 'reject', actor_role: role, question_id: qid, details: { pending_id: id, jti } });

    await postSlackModeration('Rejected by moderator', { question_id: qid, pending_id: id, role });
    return NextResponse.redirect(new URL('/admin/review?ok=1', req.url));
  } catch (e) {
    await postSlackModeration('Reject failed', { error: (e as Error).message, id });
    return NextResponse.redirect(new URL('/admin/review?error=server', req.url));
  }
}
