import { NextRequest, NextResponse } from 'next/server';
import { getStaffRole } from '@/lib/staff';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { postSlackModeration } from '@/lib/slack';

export async function POST(req: NextRequest) {
  const staff = await getStaffRole();
  if (!staff) {
    return new NextResponse('forbidden', { status: 403 });
  }

  const form = await req.formData();
  const qid = ((form.get('question_id') ?? form.get('qid')) ?? '').toString();
  if (!qid) return NextResponse.redirect(new URL('/admin/review?error=missing', req.url));

  try {
    const { data: q, error: getErr } = await supabaseAdmin
      .from('questions')
      .select('id, content, created_at, likes_count, archived, archived_at')
      .eq('id', qid)
      .single();
    if (getErr) throw getErr;

    const { error: delErr } = await supabaseAdmin.from('questions').delete().eq('id', qid);
    if (delErr) throw delErr;

    await supabaseAdmin.from('moderation_logs').insert({
      action: 'delete',
      actor_role: staff.role,
      question_id: qid,
      details: { snapshot: q, user_id: staff.userId, email: staff.email },
    });

    await postSlackModeration('Deleted by moderator', { question_id: qid, role: staff.role });
    return NextResponse.redirect(new URL('/admin/review?ok=1', req.url));
  } catch (e) {
    await postSlackModeration('Delete failed', { error: (e as Error).message, question_id: qid });
    return NextResponse.redirect(new URL('/admin/review?error=server', req.url));
  }
}
