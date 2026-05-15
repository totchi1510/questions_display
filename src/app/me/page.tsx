import Link from 'next/link';
import { getAuthorToken } from '@/lib/author';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export const dynamic = 'force-dynamic';

type MyQuestion = {
  id: string;
  content: string;
  created_at: string;
  published: boolean;
  archived: boolean;
  hold_count: number;
};

function statusOf(q: Pick<MyQuestion, 'published' | 'archived'>): {
  label: string;
  tone: 'pending' | 'live' | 'hidden';
} {
  if (q.archived) return { label: '非公開', tone: 'hidden' };
  if (q.published) return { label: '掲示中', tone: 'live' };
  return { label: '確認中', tone: 'pending' };
}

const TONE_CLASS: Record<'pending' | 'live' | 'hidden', string> = {
  pending: 'bg-amber-100 text-amber-800',
  live: 'bg-green-100 text-green-800',
  hidden: 'bg-gray-200 text-gray-600',
};

export default async function MyQuestionsPage() {
  const token = await getAuthorToken();

  if (!token) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-white via-[#FFF7D6] to-white text-black px-6 py-16">
        <div className="max-w-2xl mx-auto text-center space-y-4">
          <h1 className="text-2xl font-bold tracking-[0.4em]">あなたの問い</h1>
          <p className="text-sm text-gray-600 leading-relaxed">
            この端末からはまだ問いを投稿していません。
            <br />
            一度投稿すると、ここで自分の問いとその反応を辿れるようになります。
          </p>
          <Link
            href="/ask"
            className="inline-block px-8 py-3 bg-[#FAD55A] text-black font-semibold rounded-full shadow-sm hover:bg-[#f7c93a] transition"
          >
            問いを投稿する
          </Link>
          <div className="pt-6">
            <Link href="/" className="text-sm text-gray-500 underline">
              ← 問い一覧に戻る
            </Link>
          </div>
        </div>
      </div>
    );
  }

  let items: MyQuestion[] = [];
  let errorMsg: string | null = null;
  try {
    const { data, error } = await supabaseAdmin
      .from('questions')
      .select('id, content, created_at, published, archived, hold_count')
      .eq('author_token', token)
      .order('created_at', { ascending: false })
      .limit(100);
    if (error) throw error;
    items = (data ?? []) as MyQuestion[];
  } catch {
    errorMsg = '取得に失敗しました';
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-[#FFF7D6] to-white text-black px-6 py-12">
      <div className="max-w-3xl mx-auto">
        <header className="text-center mb-10">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-[0.4em] mb-3">あなたの問い</h1>
          <p className="text-sm text-gray-600">
            これまで投稿した問いと、どのように響いたかが残ります。
          </p>
        </header>

        {errorMsg ? (
          <p className="text-amber-700 text-sm text-center">{errorMsg}</p>
        ) : items.length === 0 ? (
          <p className="text-center text-sm text-gray-500">まだ投稿はありません。</p>
        ) : (
          <ul className="space-y-4">
            {items.map((q) => {
              const status = statusOf(q);
              return (
                <li
                  key={q.id}
                  className="rounded-3xl border border-black/20 bg-white p-6 shadow-sm shadow-yellow-200/30"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-gray-500 mb-3">
                    <span>{new Date(q.created_at).toLocaleString('ja-JP')}</span>
                    <span className={`px-2 py-0.5 rounded-full ${TONE_CLASS[status.tone]}`}>
                      {status.label}
                    </span>
                  </div>
                  <p className="text-base leading-relaxed whitespace-pre-wrap break-words">
                    {q.content}
                  </p>
                  <div className="mt-4 flex justify-end text-sm text-gray-600">
                    <span title="この問いを考えている人">
                      🤔 {q.hold_count}{' '}
                      <span className="text-xs text-gray-500">人が考えています</span>
                    </span>
                  </div>
                </li>
              );
            })}
          </ul>
        )}

        <div className="mt-12 text-center space-x-6 text-sm">
          <Link href="/ask" className="text-gray-500 underline">
            新しい問いを投稿する
          </Link>
          <Link href="/" className="text-gray-500 underline">
            問い一覧に戻る
          </Link>
        </div>
      </div>
    </div>
  );
}
