import Link from 'next/link';

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

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-[#FFF7D6] to-white text-black flex flex-col items-center px-6 py-12">
      <h1 className="text-3xl sm:text-4xl font-bold tracking-wide mb-10">問いを投稿</h1>

      {queued && (
        <div className="w-full max-w-3xl mb-8 rounded-2xl border border-green-300 bg-green-50 p-5 text-sm text-green-900">
          投稿を受け付けました。モデレータの確認後、掲示板に表示されます。
        </div>
      )}

      {errorMessage && (
        <div className="w-full max-w-3xl mb-8 rounded-2xl border border-red-300 bg-red-50 p-5 text-sm text-red-900">
          {errorMessage}
        </div>
      )}

      <form
        method="post"
        action="/ask/submit"
        className="w-full max-w-3xl flex flex-col gap-6"
      >
        <label htmlFor="content" className="text-sm font-medium text-gray-600">
          問いの内容
        </label>
        <div className="relative rounded-[32px] border border-black/60 bg-white shadow-sm">
          <span className="pointer-events-none absolute inset-0 flex items-center justify-center text-[140px] font-bold text-gray-200 select-none">
            Q
          </span>
          <textarea
            id="content"
            name="content"
            className="relative z-10 w-full h-72 sm:h-80 resize-none bg-transparent px-8 py-10 text-lg leading-relaxed focus:outline-none"
            placeholder="問いを書き込んでください"
            maxLength={2000}
            required
          />
        </div>
        <div className="flex items-center justify-between text-sm text-gray-500">
          <span>最大 2000 文字 / 投稿は確認後に表示されます</span>
          <Link className="underline" href="/">
            一覧に戻る
          </Link>
        </div>
        <button
          type="submit"
          className="self-center px-12 py-3 bg-[#FAD55A] text-black font-semibold rounded-md shadow-sm hover:bg-[#f7c93a] transition"
        >
          投稿する
        </button>
      </form>
    </div>
  );
}
