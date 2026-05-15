import Link from 'next/link';
import { notFound } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import QuestionWall from '@/components/QuestionWall';
import { isValidMonthKey, jstMonthDisplay, jstMonthRangeUtc } from '@/lib/month';
import type { QuestionTile } from '@/lib/questions';

export const dynamic = 'force-dynamic';

async function fetchMonthArchive(monthKey: string): Promise<QuestionTile[]> {
  const envReady = Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
  if (!envReady) return [];

  const { startUtc, endUtc } = jstMonthRangeUtc(monthKey);
  const { data, error } = await supabase
    .from('archive_questions')
    .select('id, content, likes_count, created_at, position_x, position_y')
    .gte('created_at', startUtc)
    .lt('created_at', endUtc)
    .order('likes_count', { ascending: false })
    .order('created_at', { ascending: false });

  if (error) return [];
  return (data ?? []).map((row) => ({
    id: String(row.id),
    content: String(row.content ?? ''),
    created_at: String(row.created_at),
    hold_count: Number(row.likes_count ?? 0),
    position_x: Number(row.position_x ?? 50),
    position_y: Number(row.position_y ?? 50),
  }));
}

export default async function ArchiveMonth({
  params,
}: {
  params: Promise<{ month: string }>;
}) {
  const { month } = await params;
  if (!isValidMonthKey(month)) notFound();

  const items = await fetchMonthArchive(month);

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-[#FFF7D6] to-white text-black px-6 py-12">
      <header className="max-w-5xl mx-auto text-center mb-10">
        <h1 className="text-2xl font-bold tracking-[0.4em]">{jstMonthDisplay(month)}</h1>
        <p className="mt-2 text-sm text-gray-500">この月の問い</p>
      </header>

      <main className="max-w-5xl mx-auto">
        <QuestionWall items={items} interactive />
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
