import Link from 'next/link';
import { cookies } from 'next/headers';
import { parseSessionToken } from '@/lib/auth';
import QuestionMasonry from '@/components/QuestionMasonry';
import { fetchCurrentMonthQuestions, currentMonthLabelJST } from '@/lib/questions';

export const dynamic = 'force-dynamic';

export default async function Home() {
  const cookieStore = await cookies();
  const session = parseSessionToken(cookieStore.get('qd_session')?.value);
  const role = session?.role ?? null;
  const isStaff = role === 'moderator' || role === 'admin';

  const { items, error } = await fetchCurrentMonthQuestions(24);
  const monthLabel = currentMonthLabelJST();

  const showDemoTokens =
    process.env.ENABLE_DEMO_TOKENS === 'true' ||
    process.env.NEXT_PUBLIC_ENABLE_DEMO_TOKENS === 'true';

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-[#FFF7D6] to-white text-black">
      <header className="flex items-center justify-between px-6 py-5 border-b border-black/10 backdrop-blur-sm bg-white/70">
        <span className="text-sm font-semibold tracking-wider">Questions Display</span>
        <div className="flex items-center gap-3 text-sm">
          <span className="text-gray-500 hidden sm:inline">{monthLabel}</span>
          {isStaff && (
            <>
              <span className="rounded-full border border-black/40 px-3 py-1 bg-white/90 text-xs">
                Role: {role}
              </span>
              <Link className="underline" href="/admin/review">
                review
              </Link>
              <Link className="underline" href="/admin/logs">
                logs
              </Link>
              {role === 'admin' && (
                <Link className="underline" href="/admin/qr">
                  qr
                </Link>
              )}
            </>
          )}
          {session && (
            <Link className="underline" href="/logout">
              logout
            </Link>
          )}
          {!session && showDemoTokens && (
            <>
              <Link className="underline" href="/auth/qr?token=demo-viewer">
                viewer
              </Link>
              <Link className="underline" href="/auth/qr?token=demo-moderator">
                moderator
              </Link>
              <Link className="underline" href="/auth/qr?token=demo-admin">
                admin
              </Link>
            </>
          )}
        </div>
      </header>

      <main className="px-6 pb-16">
        <section className="max-w-6xl mx-auto pt-10 pb-8 text-center">
          <h1 className="text-3xl sm:text-4xl font-bold tracking-[0.4em] mb-2">問い</h1>
          <p className="text-sm text-gray-500">{monthLabel}</p>
          <Link
            href="/ask"
            className="mt-6 inline-block px-10 py-3 bg-[#FAD55A] text-black font-semibold rounded-full shadow-sm hover:bg-[#f7c93a] transition"
          >
            問いを投稿する
          </Link>
        </section>

        <section className="max-w-6xl mx-auto">
          <QuestionMasonry items={items} interactive columnsClass="columns-1 sm:columns-2 lg:columns-3" />
          {error && (
            <p className="mt-6 text-center text-sm text-amber-700">
              データ取得でエラーが発生しました: {error}
            </p>
          )}
        </section>

        <footer className="max-w-6xl mx-auto mt-16 text-center">
          <Link href="/archive" className="text-sm text-gray-500 underline">
            過去の問いを見る
          </Link>
        </footer>
      </main>
    </div>
  );
}
