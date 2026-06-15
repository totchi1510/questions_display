import Link from 'next/link';
import { notFound } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import QuestionWall from '@/components/QuestionWall';
import TabSwitch, { type Tab } from '@/components/TabSwitch';
import { isValidMonthKey, jstMonthDisplay, jstMonthRangeUtc } from '@/lib/month';
import {
  clampWidthPx,
  DEFAULT_WIDTH_PX,
  fetchQuestionLinks,
  type QuestionTile,
} from '@/lib/questions';

export const dynamic = 'force-dynamic';

type MonthArchiveResult = {
  items: QuestionTile[];
  themesPresent: { id: string; label: string }[];
};

async function fetchMonthArchive(
  monthKey: string,
  tab: Tab
): Promise<MonthArchiveResult> {
  const envReady = Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
  if (!envReady) return { items: [], themesPresent: [] };

  const { startUtc, endUtc } = jstMonthRangeUtc(monthKey);
  let query = supabase
    .from('archive_questions')
    .select('id, content, likes_count, created_at, position_x, position_y, width_px, theme_id')
    .gte('created_at', startUtc)
    .lt('created_at', endUtc);
  if (tab === 'free') {
    query = query.is('theme_id', null);
  } else {
    query = query.not('theme_id', 'is', null);
  }
  const { data, error } = await query
    .order('likes_count', { ascending: false })
    .order('created_at', { ascending: false });

  if (error) return { items: [], themesPresent: [] };
  const items: QuestionTile[] = (data ?? []).map((row) => ({
    id: String(row.id),
    content: String(row.content ?? ''),
    created_at: String(row.created_at),
    hold_count: Number(row.likes_count ?? 0),
    position_x: Number(row.position_x ?? 50),
    position_y: Number(row.position_y ?? 50),
    width_px: clampWidthPx(Number(row.width_px ?? DEFAULT_WIDTH_PX)),
    theme_id: row.theme_id ? String(row.theme_id) : null,
  }));

  // For the themed tab, look up theme labels so we can show them.
  const themeIds = Array.from(
    new Set(items.map((i) => i.theme_id).filter((v): v is string => Boolean(v)))
  );
  let themesPresent: { id: string; label: string }[] = [];
  if (themeIds.length > 0) {
    const { data: themeRows } = await supabase
      .from('themes')
      .select('id, label')
      .in('id', themeIds);
    themesPresent = (themeRows ?? []).map((t) => ({
      id: String(t.id),
      label: String(t.label),
    }));
  }
  return { items, themesPresent };
}

export default async function ArchiveMonth({
  params,
  searchParams,
}: {
  params: Promise<{ month: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { month } = await params;
  if (!isValidMonthKey(month)) notFound();
  const sp = (await searchParams) ?? {};
  const tabParam = typeof sp.tab === 'string' ? sp.tab : undefined;
  const activeTab: Tab = tabParam === 'free' ? 'free' : 'themed';

  const { items, themesPresent } = await fetchMonthArchive(month, activeTab);
  const links = await fetchQuestionLinks(items.map((i) => i.id));

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-[#FFF7D6] to-white text-black px-6 py-12">
      <header className="max-w-5xl mx-auto text-center mb-8">
        <h1 className="text-2xl font-bold tracking-[0.4em]">{jstMonthDisplay(month)}</h1>
        <p className="mt-2 text-sm text-gray-500">この月の問い</p>
      </header>

      <main className="max-w-5xl mx-auto">
        <div className="mb-5 flex justify-center">
          <TabSwitch
            active={activeTab}
            themedHref={`/archive/${month}?tab=themed`}
            freeHref={`/archive/${month}?tab=free`}
            themedLabel={
              themesPresent.length === 1
                ? themesPresent[0].label
                : themesPresent.length > 1
                  ? `テーマ (${themesPresent.length}件)`
                  : 'テーマ'
            }
            themedDisabled={activeTab === 'themed' && themesPresent.length === 0}
          />
        </div>

        {items.length === 0 ? (
          <p className="py-12 text-center text-sm text-gray-400">
            {activeTab === 'themed'
              ? 'この月にはテーマ関連の問いがありません'
              : 'この月にはテーマなしの問いがありません'}
          </p>
        ) : (
          <QuestionWall items={items} links={links} interactive />
        )}
      </main>

      <footer className="max-w-5xl mx-auto mt-16 text-center space-x-6 text-sm">
        <Link href="/archive" className="text-gray-500 underline">
          月一覧へ
        </Link>
        <Link href="/" className="text-gray-500 underline">
          今月の問いに戻る
        </Link>
      </footer>
    </div>
  );
}
