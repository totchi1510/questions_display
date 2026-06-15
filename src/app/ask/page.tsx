import Link from 'next/link';
import { getAuthorToken } from '@/lib/author';
import { fetchCurrentMonthQuestions } from '@/lib/questions';
import { fetchActiveTheme } from '@/lib/theme';
import AskCanvas from './AskCanvas';

export const dynamic = 'force-dynamic';

const ERROR_MESSAGES: Record<string, string> = {
  empty: '問いが空です。何か書いてから投稿してください。',
  rate: '本日の投稿上限に達しました。明日また試してください。',
  server: 'サーバーエラーが発生しました。少し時間をおいてから再度試してください。',
};

export default async function AskPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = (await searchParams) ?? {};
  const queued = sp.queued === '1';
  const errorKey = typeof sp.error === 'string' ? sp.error : null;
  const errorMessage = errorKey ? ERROR_MESSAGES[errorKey] ?? null : null;
  const hasAuthor = Boolean(await getAuthorToken());
  const [{ items }, theme] = await Promise.all([
    fetchCurrentMonthQuestions(60),
    fetchActiveTheme(),
  ]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-[#FFF7D6] to-white text-black flex flex-col items-center px-6 py-12">
      <h1 className="text-3xl sm:text-4xl font-bold tracking-wide mb-10">問いを投稿</h1>

      {queued && (
        <div className="w-full max-w-4xl mb-8 rounded-2xl border border-green-300 bg-green-50 p-5 text-sm text-green-900 space-y-2">
          <p>投稿を受け付けました。モデレータの確認後、選んだ場所に表示されます。</p>
          {hasAuthor && (
            <p>
              これまでの問いと反応は{' '}
              <Link href="/me" className="underline font-semibold">
                あなたの問い
              </Link>{' '}
              で確認できます。
            </p>
          )}
        </div>
      )}

      {errorMessage && (
        <div className="w-full max-w-4xl mb-8 rounded-2xl border border-red-300 bg-red-50 p-5 text-sm text-red-900">
          {errorMessage}
        </div>
      )}

      <div className="w-full max-w-4xl">
        {theme && (
          <div className="mb-6 rounded-2xl border border-black/15 bg-white/70 px-5 py-4 text-center">
            <p className="text-[11px] text-gray-500 tracking-[0.3em]">今月のテーマ</p>
            <p className="mt-1 text-lg font-semibold">{theme.label}</p>
            {theme.description && (
              <p className="mt-1 text-sm text-gray-600 leading-relaxed">{theme.description}</p>
            )}
            <p className="mt-2 text-xs text-gray-500">
              テーマに関する問いでなくても OK です。気になる問いを書いてください。
            </p>
          </div>
        )}

        <div className="mb-6 rounded-2xl border border-amber-200 bg-amber-50/70 px-5 py-3 text-xs text-amber-900 leading-relaxed">
          <p className="font-semibold mb-1">投稿の前に</p>
          <ul className="list-disc list-inside space-y-0.5">
            <li>個人が特定される情報は書かないでください。</li>
            <li>モデレータの確認後に掲示されます(削除は依頼ベース)。</li>
            <li>誰でも見られる前提で、誰かの心に残る問いを残せると素敵です。</li>
            <li>
              インスピレーション元の問いを選ぶときは、自分の付箋を<strong>その近くに置く</strong>と
              つながりが見やすくなります。
            </li>
          </ul>
        </div>

        <AskCanvas existing={items} themeLabel={theme?.label ?? null} />
        <div className="mt-8 text-center">
          <Link className="underline text-gray-500 text-sm" href="/">
            一覧に戻る
          </Link>
        </div>
      </div>
    </div>
  );
}
