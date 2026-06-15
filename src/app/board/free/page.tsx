import QuestionWall from '@/components/QuestionWall';
import {
  currentMonthLabelJST,
  fetchCurrentMonthQuestions,
  fetchQuestionLinks,
} from '@/lib/questions';

export const dynamic = 'force-dynamic';

function siteUrl() {
  return (
    process.env.NEXT_PUBLIC_SITE_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000')
  );
}

function qrImageSrc(target: string) {
  const encoded = encodeURIComponent(target);
  return `https://api.qrserver.com/v1/create-qr-code/?size=400x400&margin=0&data=${encoded}`;
}

export default async function FreeBoardPage() {
  const { items, error } = await fetchCurrentMonthQuestions(60, 'free');
  const links = await fetchQuestionLinks(items.map((i) => i.id));
  const monthLabel = currentMonthLabelJST();
  const askUrl = `${siteUrl()}/ask`;

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-[#FFF7D6] to-white text-black relative">
      <header className="flex items-center justify-between px-10 py-6">
        <span className="text-sm font-semibold tracking-wider text-gray-700">
          Questions Display
        </span>
        <h1 className="text-2xl font-bold tracking-[0.4em]">Q</h1>
        <span className="text-sm text-gray-500">{monthLabel}</span>
      </header>

      <main className="px-10 pb-32">
        <div className="mb-5 text-center">
          <p className="text-[11px] text-gray-500 tracking-[0.4em]">テーマ外の問い</p>
          <p className="mt-1 text-xl font-semibold tracking-wide">自由な問い</p>
          <p className="mt-1 text-sm text-gray-600">
            今月のテーマに縛られない、こぼれ落ちた問いたち。
          </p>
        </div>
        <QuestionWall items={items} links={links} />

        {error && (
          <p className="mt-8 text-center text-sm text-amber-700">
            データ取得でエラーが発生しました: {error}
          </p>
        )}
      </main>

      <aside className="absolute bottom-8 right-10 flex flex-col items-center gap-3">
        <div className="rounded-2xl bg-white p-3 shadow-md shadow-black/10 border border-black/5">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={qrImageSrc(askUrl)}
            alt="問いを投稿する QR コード"
            width={200}
            height={200}
            className="block"
          />
        </div>
        <span className="text-sm font-semibold text-gray-700 tracking-wider">
          問いを投稿する
        </span>
      </aside>
    </div>
  );
}
