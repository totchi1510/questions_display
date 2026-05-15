import { redirect } from 'next/navigation';
import Link from 'next/link';
import { getSupabaseServer } from '@/lib/supabaseServer';

export const dynamic = 'force-dynamic';

function siteUrl() {
  return (
    process.env.NEXT_PUBLIC_SITE_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000')
  );
}

async function loginWithGoogle() {
  'use server';
  const supabase = await getSupabaseServer();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: `${siteUrl()}/auth/callback` },
  });
  if (error) {
    redirect(`/login?error=${encodeURIComponent(error.message)}`);
  }
  if (data?.url) {
    redirect(data.url);
  }
  redirect('/login?error=nourl');
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = (await searchParams) ?? {};
  const errorMsg = typeof sp.error === 'string' ? sp.error : null;

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-[#FFF7D6] to-white flex flex-col items-center justify-center px-6">
      <div className="w-full max-w-md bg-white rounded-3xl border border-black/20 p-8 shadow-sm">
        <h1 className="text-2xl font-bold mb-2 text-center tracking-widest">スタッフログイン</h1>
        <p className="text-xs text-center text-gray-500 mb-8">
          モデレータ/管理者のみ
        </p>

        <form action={loginWithGoogle}>
          <button
            type="submit"
            className="w-full flex items-center justify-center gap-3 border border-black/30 rounded-full py-3 hover:bg-gray-50 transition text-sm font-semibold"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 48 48"
              className="h-5 w-5"
              aria-hidden="true"
            >
              <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3c-1.6 4.7-6 8-11.3 8-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z"/>
              <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.6 16 19 13 24 13c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/>
              <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.5-5.2l-6.2-5.2C29.2 35 26.7 36 24 36c-5.3 0-9.7-3.3-11.3-8l-6.5 5C9.6 39.6 16.2 44 24 44z"/>
              <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.3-2.2 4.2-4 5.6l6.2 5.2c-.4.4 6.5-4.8 6.5-14.8 0-1.3-.1-2.4-.4-3.5z"/>
            </svg>
            Google でログイン
          </button>
        </form>

        {errorMsg && <p className="mt-4 text-sm text-red-600 text-center">{errorMsg}</p>}

        <p className="mt-6 text-xs text-gray-500 text-center leading-relaxed">
          このサイトにアカウントを作るのではなく、Google でログインします。<br />
          スタッフ権限は管理者が個別に付与します。
        </p>

        <div className="mt-8 text-center text-xs text-gray-500">
          <Link href="/" className="underline">
            ← 問い一覧に戻る
          </Link>
        </div>
      </div>
    </div>
  );
}
