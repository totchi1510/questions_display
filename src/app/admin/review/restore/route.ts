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
  const qid = ((form.get('question_id') ?? form.get('qid')) ?? '').toString();
  if (!qid) return NextResponse.redirect(new URL('/admin/review?error=missing', req.url));

  try {
    const { error: upErr } = await supabaseAdmin
      .from('questions')
      .update({ archived: false, archived_at: null })
      .eq('id', qid);
    if (upErr) throw upErr;

    await supabaseAdmin
      .from('moderation_logs')
      .insert({ action: 'restore', actor_role: role, question_id: qid, details: { jti } });

    await postSlackModeration('Restored by moderator', { question_id: qid, role });
    return NextResponse.redirect(new URL('/admin/review?ok=1', req.url));
  } catch (e) {
    await postSlackModeration('Restore failed', { error: (e as Error).message, question_id: qid });
    return NextResponse.redirect(new URL('/admin/review?error=server', req.url));
  }
}

