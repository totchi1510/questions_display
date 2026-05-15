import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { parseSessionToken, type Role } from '@/lib/auth';
import { createToken } from '@/lib/qrTokens';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

const VALID_ROLES: Role[] = ['viewer', 'moderator', 'admin'];

export async function POST(req: NextRequest) {
  const cookieStore = await cookies();
  const session = parseSessionToken(cookieStore.get('qd_session')?.value);
  if (session?.role !== 'admin') {
    return new NextResponse('forbidden', { status: 403 });
  }

  const form = await req.formData();
  const role = (form.get('role') ?? '').toString() as Role;
  const ttlDaysRaw = Number(form.get('ttlDays') ?? 30);
  const ttlDays = Number.isFinite(ttlDaysRaw) ? Math.max(1, Math.min(365, ttlDaysRaw)) : 30;

  if (!VALID_ROLES.includes(role)) {
    return NextResponse.redirect(new URL('/admin/qr?error=role', req.url));
  }

  try {
    const { raw, row } = await createToken(role, ttlDays);
    await supabaseAdmin.from('moderation_logs').insert({
      action: 'qr_create',
      actor_role: 'admin',
      details: { token_id: row.id, role, ttlDays, jti: session.jti },
    });
    return NextResponse.redirect(
      new URL(`/admin/qr?raw=${raw}&issuedRole=${role}`, req.url)
    );
  } catch (e) {
    console.error('qr create error', e);
    return NextResponse.redirect(new URL('/admin/qr?error=server', req.url));
  }
}
