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
    const { error: upErr } = await supabaseAdmin
      .from('questions')
      .update({ archived: false, archived_at: null, published: true })
      .eq('id', qid);
    if (upErr) throw upErr;

    await supabaseAdmin.from('moderation_logs').insert({
      action: 'restore',
      actor_role: staff.role,
      question_id: qid,
      details: { user_id: staff.userId, email: staff.email },
    });

    await postSlackModeration('Restored by moderator', { question_id: qid, role: staff.role });
    return NextResponse.redirect(new URL('/admin/review?ok=1', req.url));
  } catch (e) {
    await postSlackModeration('Restore failed', { error: (e as Error).message, question_id: qid });
    return NextResponse.redirect(new URL('/admin/review?error=server', req.url));
  }
}
