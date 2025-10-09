import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { cookies } from 'next/headers';
import { parseSessionToken } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const content = (formData.get('content') ?? '').toString().trim();

  if (!content) {
    return NextResponse.redirect(new URL('/ask?error=empty', req.url));
  }

  // naive moderation stub: queue long or suspicious posts
  const lower = content.toLowerCase();
  const banned = ['spam', 'abuse'];
  const shouldQueue = content.length > 280 || banned.some((w) => lower.includes(w));

  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get('qd_session')?.value;
  const session = parseSessionToken(sessionCookie);
  const role = session?.role ?? 'viewer';
  const jti = session?.jti ?? null;

  try {
    // optional ip hash placeholder (do not store raw IP)
    const ip = (await headers()).get('x-forwarded-for')?.split(',')[0]?.trim() || '';

    if (shouldQueue) {
      // insert a pending review and log
      const { data: qres, error: qerr } = await supabaseAdmin
        .from('questions')
        .insert({ content, meta_ip_hash: ip ? 'hashed' : null })
        .select('id')
        .single();
      if (qerr) throw qerr;

      const qid = qres.id as string;
      const { error: perr } = await supabaseAdmin
        .from('pending_reviews')
        .insert({ question_id: qid, reason: 'auto:stub', status: 'pending' });
      if (perr) throw perr;

      await supabaseAdmin
        .from('moderation_logs')
        .insert({ action: 'queue', actor_role: role, question_id: qid, details: { reason: 'auto:stub', jti } });

      return NextResponse.redirect(new URL('/ask?queued=1', req.url));
    }

    // direct publish to questions
    const { error } = await supabaseAdmin
      .from('questions')
      .insert({ content, meta_ip_hash: ip ? 'hashed' : null });
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

