import Link from 'next/link';
import QuestionGraph from '@/components/QuestionGraph';
import {
  currentMonthLabelJST,
  fetchCurrentMonthQuestions,
  fetchQuestionLinks,
} from '@/lib/questions';
import { fetchMyQuestionIds } from '@/lib/author';
import { fetchActiveTheme } from '@/lib/theme';

export const dynamic = 'force-dynamic';

export default async function GraphPage() {
  const { items, error } = await fetchCurrentMonthQuestions(120);
  const visibleIds = items.map((i) => i.id);
  const [links, mySet, theme] = await Promise.all([
    fetchQuestionLinks(visibleIds),
    fetchMyQuestionIds(visibleIds),
    fetchActiveTheme(),
  ]);
  const myIds = Array.from(mySet);
  const monthLabel = currentMonthLabelJST();

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-[#FFF7D6] to-white text-black px-6 py-12">
      <div className="max-w-6xl mx-auto">
        <header className="text-center mb-8">
          <p className="text-[11px] text-gray-500 tracking-[0.4em]">{monthLabel}</p>
          <h1 className="mt-1 text-2xl sm:text-3xl font-bold tracking-[0.3em]">問いのグラフ</h1>
          <p className="mt-3 text-sm text-gray-600">
            問い同士のつながりを俯瞰します。ノードにカーソルを合わせると関連するつながりが浮かびます。
          </p>
          {theme && (
            <p className="mt-3 inline-flex items-center gap-2 rounded-full border border-black/15 bg-white/70 px-4 py-1 text-xs text-gray-700 tracking-wider">
              <span className="text-gray-400">今月のテーマ</span>
              <span className="font-semibold">{theme.label}</span>
            </p>
          )}
        </header>

        <QuestionGraph items={items} links={links} myIds={myIds} />

        {error && (
          <p className="mt-6 text-center text-sm text-amber-700">
            データ取得でエラーが発生しました: {error}
          </p>
        )}

        <footer className="mt-12 text-center text-sm space-x-6">
          <Link href="/" className="text-gray-500 underline">
            ← 掲示板に戻る
          </Link>
          <Link href="/ask" className="text-gray-500 underline">
            問いを投稿する
          </Link>
        </footer>
      </div>
    </div>
  );
}
