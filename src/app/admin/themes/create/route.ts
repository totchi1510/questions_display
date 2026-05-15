import { NextRequest, NextResponse } from 'next/server';
import { getStaffRole } from '@/lib/staff';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export async function POST(req: NextRequest) {
  const staff = await getStaffRole();
  if (!staff) {
    return NextResponse.redirect(new URL('/login', req.url));
  }

  const form = await req.formData();
  const label = (form.get('label') ?? '').toString().trim();
  const description = (form.get('description') ?? '').toString().trim() || null;
  const activate = form.get('activate') === 'on';

  if (!label) {
    return NextResponse.redirect(new URL('/admin/themes?flash=err', req.url));
  }

  try {
    if (activate) {
      const { error: e1 } = await supabaseAdmin
        .from('themes')
        .update({ active: false })
        .eq('active', true);
      if (e1) throw e1;
    }
    const { error: e2 } = await supabaseAdmin
      .from('themes')
      .insert({ label, description, active: activate });
    if (e2) throw e2;
  } catch (e) {
    console.error('themes create error', e);
    return NextResponse.redirect(new URL('/admin/themes?flash=err', req.url));
  }

  return NextResponse.redirect(new URL('/admin/themes?flash=created', req.url));
}
