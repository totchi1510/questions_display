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

async function sendLink(formData: FormData) {
  'use server';
  const email = String(formData.get('email') ?? '').trim();
  if (!email) redirect('/login?error=email');

  const supabase = await getSupabaseServer();
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: { emailRedirectTo: `${siteUrl()}/auth/callback` },
  });
  if (error) {
    redirect(`/login?error=${encodeURIComponent(error.message)}`);
  }
  redirect(`/login?sent=${encodeURIComponent(email)}`);
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = (await searchParams) ?? {};
  const sent = typeof sp.sent === 'string' ? sp.sent : null;
  const errorMsg = typeof sp.error === 'string' ? sp.error : null;

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-[#FFF7D6] to-white flex flex-col items-center justify-center px-6">
      <div className="w-full max-w-md bg-white rounded-3xl border border-black/20 p-8 shadow-sm">
        <h1 className="text-2xl font-bold mb-2 text-center tracking-widest">スタッフログイン</h1>
        <p className="text-xs text-center text-gray-500 mb-6">
          モデレータ/管理者のみ
        </p>

        {sent ? (
          <div className="space-y-3 text-sm">
            <p>
              <strong>{sent}</strong> 宛にマジックリンクを送りました。
            </p>
            <p className="text-gray-500">
              メール内のリンクをクリックするとログインが完了します。リンクの有効期限は約 1 時間です。
            </p>
          </div>
        ) : (
          <form action={sendLink} className="space-y-4">
            <label className="block text-sm">
              メールアドレス
              <input
                name="email"
                type="email"
                required
                placeholder="email@example.com"
                className="mt-1 w-full border border-black/30 rounded-lg px-3 py-2 text-sm"
              />
            </label>
            <button
              type="submit"
              className="w-full bg-[#FAD55A] py-3 rounded-full font-semibold hover:bg-[#f7c93a] transition text-sm"
            >
              マジックリンクを送る
            </button>
            {errorMsg && <p className="text-sm text-red-600">{errorMsg}</p>}
          </form>
        )}

        <div className="mt-8 text-center text-xs text-gray-500">
          <Link href="/" className="underline">
            ← 問い一覧に戻る
          </Link>
        </div>
      </div>
    </div>
  );
}
