import Link from 'next/link';
import BigQ from '@/components/BigQ';
import QuestionMasonry from '@/components/QuestionMasonry';
import { fetchCurrentMonthQuestions, currentMonthLabelJST } from '@/lib/questions';
import { getStaffRole } from '@/lib/staff';
import { getAuthorToken } from '@/lib/author';

export const dynamic = 'force-dynamic';

export default async function Home() {
  const staff = await getStaffRole();
  const hasAuthor = Boolean(await getAuthorToken());
  const { items, error } = await fetchCurrentMonthQuestions(24);
  const monthLabel = currentMonthLabelJST();

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-[#FFF7D6] to-white text-black">
      <header className="flex items-center justify-between px-6 py-5 border-b border-black/10 backdrop-blur-sm bg-white/70">
        <span className="text-sm font-semibold tracking-wider">Questions Display</span>
        <div className="flex items-center gap-3 text-sm">
          <span className="text-gray-500 hidden sm:inline">{monthLabel}</span>
          {staff ? (
            <>
              <span className="rounded-full border border-black/40 px-3 py-1 bg-white/90 text-xs">
                {staff.role}
              </span>
              <Link className="underline" href="/admin/review">
                review
              </Link>
              <Link className="underline" href="/admin/logs">
                logs
              </Link>
              <Link className="underline" href="/logout">
                logout
              </Link>
            </>
          ) : (
            <Link className="underline text-gray-500" href="/login">
              スタッフログイン
            </Link>
          )}
          {hasAuthor && !staff && (
            <Link className="underline text-gray-500" href="/me">
              あなたの問い
            </Link>
          )}
        </div>
      </header>

      <main className="px-6 pb-16">
        <section className="max-w-6xl mx-auto pt-12 pb-10 text-center">
          <h1 className="mb-6 flex justify-center">
            <span className="sr-only">問い</span>
            <BigQ />
          </h1>
          <p className="text-sm sm:text-base text-gray-600 max-w-xl mx-auto leading-relaxed">
            誰かの問いに、ふと立ち止まる。
            <br className="hidden sm:inline" />
            通りすがりの対話から、考えが広がっていく。
          </p>
          <p className="mt-3 text-xs text-gray-400 tracking-widest">{monthLabel}</p>
          <Link
            href="/ask"
            className="mt-8 inline-block px-10 py-3 bg-[#FAD55A] text-black font-semibold rounded-full shadow-sm hover:bg-[#f7c93a] transition"
          >
            問いを投稿する
          </Link>
        </section>

        <section className="max-w-6xl mx-auto">
          <QuestionMasonry items={items} interactive breakpoints={{ default: 3, 1024: 3, 640: 2 }} />
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
