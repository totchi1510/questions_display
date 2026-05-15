import QuestionMasonry from '@/components/QuestionMasonry';
import { fetchCurrentMonthQuestions, currentMonthLabelJST } from '@/lib/questions';

export const dynamic = 'force-dynamic';

function siteUrl() {
  return (
    process.env.NEXT_PUBLIC_SITE_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000')
  );
}

function qrImageSrc(target: string) {
  const encoded = encodeURIComponent(target);
  return `https://api.qrserver.com/v1/create-qr-code/?size=180x180&margin=0&data=${encoded}`;
}

export default async function BoardPage() {
  const { items, error } = await fetchCurrentMonthQuestions(18);
  const monthLabel = currentMonthLabelJST();
  const askUrl = `${siteUrl()}/ask`;

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-[#FFF7D6] to-white text-black relative">
      <header className="flex items-center justify-between px-10 py-6">
        <span className="text-sm font-semibold tracking-wider text-gray-700">
          Questions Display
        </span>
        <h1 className="text-2xl font-bold tracking-[0.4em]">問い</h1>
        <span className="text-sm text-gray-500">{monthLabel}</span>
      </header>

      <main className="px-10 pb-32">
        <QuestionMasonry items={items} breakpoints={{ default: 5, 1280: 5, 1024: 4, 640: 3 }} />

        {error && (
          <p className="mt-8 text-center text-sm text-amber-700">
            データ取得でエラーが発生しました: {error}
          </p>
        )}
      </main>

      <aside className="absolute bottom-8 right-10 flex flex-col items-center gap-2">
        <div className="rounded-2xl bg-white p-2 shadow-md shadow-black/5">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={qrImageSrc(askUrl)}
            alt="問いを投稿する QR コード"
            width={120}
            height={120}
            className="block"
          />
        </div>
        <span className="text-xs text-gray-600 tracking-wider">問いを投稿する</span>
      </aside>
    </div>
  );
}
