import Link from 'next/link';
import { getAuthorToken } from '@/lib/author';
import { fetchCurrentMonthQuestions } from '@/lib/questions';
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
  const { items } = await fetchCurrentMonthQuestions(60);

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
        <AskCanvas existing={items} />
        <div className="mt-8 text-center">
          <Link className="underline text-gray-500 text-sm" href="/">
            一覧に戻る
          </Link>
        </div>
      </div>
    </div>
  );
}
