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
    const { data: q, error: getErr } = await supabaseAdmin
      .from('questions')
      .select('id, content, created_at, likes_count, archived, archived_at')
      .eq('id', qid)
      .single();
    if (getErr) throw getErr;

    const { error: delErr } = await supabaseAdmin.from('questions').delete().eq('id', qid);
    if (delErr) throw delErr;

    await supabaseAdmin
      .from('moderation_logs')
      .insert({ action: 'delete', actor_role: role, question_id: qid, details: { snapshot: q, jti } });

    await postSlackModeration('Deleted by moderator', { question_id: qid, role });
    return NextResponse.redirect(new URL('/admin/review?ok=1', req.url));
  } catch (e) {
    await postSlackModeration('Delete failed', { error: (e as Error).message, question_id: qid });
    return NextResponse.redirect(new URL('/admin/review?error=server', req.url));
  }
}

