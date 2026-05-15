import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabaseServer';

export async function GET(req: NextRequest) {
  const supabase = await getSupabaseServer();
  await supabase.auth.signOut();

  const res = NextResponse.redirect(new URL('/', req.url), 302);
  // Clear the legacy custom cookie left over from the QR token model.
  res.cookies.set('qd_session', '', { maxAge: 0, path: '/' });
  return res;
}
