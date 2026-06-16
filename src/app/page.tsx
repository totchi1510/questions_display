import Link from 'next/link';
import BigQ from '@/components/BigQ';
import QuestionGraph from '@/components/QuestionGraph';
import QuestionWall from '@/components/QuestionWall';
import SettingsMenu from '@/components/SettingsMenu';
import TabSwitch, { type Tab } from '@/components/TabSwitch';
import {
  currentMonthLabelJST,
  fetchCurrentMonthQuestions,
  fetchQuestionLinks,
} from '@/lib/questions';
import { getStaffRole } from '@/lib/staff';
import { fetchMyQuestionIds, getAuthorToken } from '@/lib/author';
import { fetchActiveTheme } from '@/lib/theme';

export const dynamic = 'force-dynamic';

export default async function Home({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = (await searchParams) ?? {};
  const tabParam = typeof sp.tab === 'string' ? sp.tab : undefined;

  const staff = await getStaffRole();
  const hasAuthor = Boolean(await getAuthorToken());
  const theme = await fetchActiveTheme();

  const activeTab: Tab = tabParam === 'free' ? 'free' : theme ? 'themed' : 'free';
  const themeFilter = activeTab === 'free' ? 'free' : (theme?.id ?? 'free');

  const { items, error } = await fetchCurrentMonthQuestions(24, themeFilter);
  const visibleIds = items.map((i) => i.id);
  const [links, mySet] = await Promise.all([
    fetchQuestionLinks(visibleIds),
    fetchMyQuestionIds(visibleIds),
  ]);
  const myIds = Array.from(mySet);
  const monthLabel = currentMonthLabelJST();

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-[#FFF7D6] to-white text-black">
      <header className="flex items-center justify-between px-6 py-5 border-b border-black/10 backdrop-blur-sm bg-white/70">
        <span className="text-sm font-semibold tracking-wider">Questions Display</span>
        <SettingsMenu
          monthLabel={monthLabel}
          hasAuthor={hasAuthor}
          staff={staff ? { role: staff.role } : null}
        />
      </header>

      <main className="px-6 pb-16">
        <section className="max-w-6xl mx-auto pt-12 pb-10 text-center">
          <h1 className="mb-6 flex justify-center">
            <span className="sr-only">問い</span>
            <BigQ />
          </h1>
          <p className="text-sm sm:text-base text-gray-600 max-w-xl mx-auto leading-relaxed">
            誰かの問いにふと立ち止まる
          </p>
          {theme && (
            <p className="mt-4 inline-flex items-center gap-2 rounded-full border border-black/15 bg-white/70 px-4 py-1 text-xs text-gray-700 tracking-wider">
              <span className="text-gray-400">今月のテーマ</span>
              <span className="font-semibold">{theme.label}</span>
            </p>
          )}
          <p className="mt-3 text-xs text-gray-400 tracking-widest">{monthLabel}</p>
          <Link
            href="/ask"
            className="mt-8 inline-block px-10 py-3 bg-[#FAD55A] text-black font-semibold rounded-full shadow-sm hover:bg-[#f7c93a] transition"
          >
            問いを投稿する
          </Link>
        </section>

        <section className="max-w-6xl mx-auto">
          <div className="mb-5 flex justify-center">
            <TabSwitch
              active={activeTab}
              themedHref="/?tab=themed"
              freeHref="/?tab=free"
              themedLabel={theme ? theme.label : 'テーマ'}
              themedDisabled={!theme}
            />
          </div>
          {activeTab === 'themed' && theme?.description && (
            <p className="mb-4 text-center text-sm text-gray-600 leading-relaxed">
              {theme.description}
            </p>
          )}
          {items.length === 0 ? (
            <p className="py-12 text-center text-sm text-gray-400">
              {activeTab === 'themed'
                ? 'まだこのテーマに関連する問いはありません'
                : 'まだテーマなしの問いはありません'}
            </p>
          ) : (
            <QuestionWall items={items} links={links} interactive myIds={myIds} />
          )}
          <p className="mt-3 text-center text-xs text-gray-400">
            カーソルを合わせると関連が強調 / クリックで拡大表示 / ピンチで拡大縮小 / 自分の問い(黄色破線枠)はドラッグで動かせます
          </p>
          <p className="mt-1 text-center text-[11px] text-gray-400">
            答えのない問いを味わってみてください。🤔 はそっと「考えている」を伝えるサインです。
          </p>
        </section>

        <section className="max-w-6xl mx-auto mt-12">
          <div className="text-center mb-3">
            <p className="text-[11px] text-gray-500 tracking-[0.3em]">つながりを俯瞰する</p>
            <h2 className="mt-1 text-lg font-semibold">問いのグラフ</h2>
          </div>
          <QuestionGraph items={items} links={links} myIds={myIds} height="min(60vh, 520px)" />
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
