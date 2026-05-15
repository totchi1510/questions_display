import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { parseSessionToken } from '@/lib/auth';
import { revokeToken } from '@/lib/qrTokens';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export async function POST(req: NextRequest) {
  const cookieStore = await cookies();
  const session = parseSessionToken(cookieStore.get('qd_session')?.value);
  if (session?.role !== 'admin') {
    return new NextResponse('forbidden', { status: 403 });
  }

  const form = await req.formData();
  const id = (form.get('id') ?? '').toString();
  if (!id) return NextResponse.redirect(new URL('/admin/qr?error=missing', req.url));

  try {
    await revokeToken(id);
    await supabaseAdmin.from('moderation_logs').insert({
      action: 'qr_revoke',
      actor_role: 'admin',
      details: { token_id: id, jti: session.jti },
    });
    return NextResponse.redirect(new URL('/admin/qr?revoked=1', req.url));
  } catch (e) {
    console.error('qr revoke error', e);
    return NextResponse.redirect(new URL('/admin/qr?error=server', req.url));
  }
}
