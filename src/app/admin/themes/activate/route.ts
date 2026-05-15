import { NextRequest, NextResponse } from 'next/server';
import { getStaffRole } from '@/lib/staff';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function POST(req: NextRequest) {
  const staff = await getStaffRole();
  if (!staff) {
    return NextResponse.redirect(new URL('/login', req.url));
  }

  const form = await req.formData();
  const id = (form.get('id') ?? '').toString();
  if (!UUID_RE.test(id)) {
    return NextResponse.redirect(new URL('/admin/themes?flash=err', req.url));
  }

  try {
    const { error: e1 } = await supabaseAdmin
      .from('themes')
      .update({ active: false })
      .neq('id', id);
    if (e1) throw e1;
    const { error: e2 } = await supabaseAdmin
      .from('themes')
      .update({ active: true })
      .eq('id', id);
    if (e2) throw e2;
  } catch (e) {
    console.error('themes activate error', e);
    return NextResponse.redirect(new URL('/admin/themes?flash=err', req.url));
  }

  return NextResponse.redirect(new URL('/admin/themes?flash=activated', req.url));
}
