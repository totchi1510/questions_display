import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { jstMonthDisplay } from '@/lib/month';

export const dynamic = 'force-dynamic';

async function fetchArchivedMonths(): Promise<string[]> {
  const envReady = Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
  if (!envReady) return [];

  const { data, error } = await supabase
    .from('archive_questions')
    .select('created_at')
    .order('created_at', { ascending: false });

  if (error) return [];

  const months = new Set<string>();
  for (const row of data ?? []) {
    const d = new Date(String(row.created_at));
    const jst = new Date(d.getTime() + 9 * 60 * 60 * 1000);
    const key = `${jst.getUTCFullYear()}-${String(jst.getUTCMonth() + 1).padStart(2, '0')}`;
    months.add(key);
  }
  return Array.from(months).sort().reverse();
}

export default async function ArchiveIndex() {
  const months = await fetchArchivedMonths();

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-[#FFF7D6] to-white text-black px-6 py-12">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold tracking-[0.4em] text-center mb-10">過去の問い</h1>

        {months.length === 0 ? (
          <p className="text-center text-gray-500 text-sm">
            まだアーカイブされた月がありません
          </p>
        ) : (
          <ul className="space-y-2">
            {months.map((key) => (
              <li key={key}>
                <Link
                  href={`/archive/${key}`}
                  className="block px-6 py-4 rounded-2xl border border-black/20 bg-white hover:bg-[#FFF7D6] transition"
                >
                  {jstMonthDisplay(key)}
                </Link>
              </li>
            ))}
          </ul>
        )}

        <div className="mt-12 text-center">
          <Link href="/" className="text-sm text-gray-500 underline">
            今月の問いに戻る
          </Link>
        </div>
      </div>
    </div>
  );
}
