import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabaseServer';

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const code = url.searchParams.get('code');
  const oauthError = url.searchParams.get('error');
  const oauthErrorDesc = url.searchParams.get('error_description');

  // Surface upstream errors (e.g., user cancelled, redirect URI mismatch)
  if (oauthError) {
    return NextResponse.redirect(
      new URL(`/login?error=${encodeURIComponent(oauthErrorDesc || oauthError)}`, req.url)
    );
  }

  if (!code) {
    return NextResponse.redirect(
      new URL(
        '/login?error=' +
          encodeURIComponent(
            'callback に code が届きませんでした。Supabase の URL Configuration（Site URL / Redirect URLs）と Google プロバイダ設定を確認してください。'
          ),
        req.url
      )
    );
  }

  const supabase = await getSupabaseServer();
  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) {
    return NextResponse.redirect(
      new URL(`/login?error=${encodeURIComponent(error.message)}`, req.url)
    );
  }

  return NextResponse.redirect(new URL('/', req.url));
}
