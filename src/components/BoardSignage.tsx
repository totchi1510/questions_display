import PrintButton from '@/components/PrintButton';
import QuestionWall from '@/components/QuestionWall';
import SignageExport from '@/components/SignageExport';
import type { QuestionLink, QuestionTile } from '@/lib/questions';

function qrImageSrc(target: string) {
  // Same-origin proxy so the PNG export (html-to-image) isn't tainted by a
  // cross-origin QR image. The proxy requests a high-res rendering upstream.
  return `/api/qr?data=${encodeURIComponent(target)}`;
}

type Props = {
  items: QuestionTile[];
  links: QuestionLink[];
  monthLabel: string;
  askUrl: string;
  /** Small label above the title (e.g. 今月のテーマ). */
  eyebrow?: string;
  /** Main heading — the theme label. Omit for the free board (no heading). */
  title?: string;
  description?: string | null;
  error?: string;
};

/**
 * A fixed 16:9 "stage" tuned for full-HD signage. On screen it scales to fit
 * its container; when printed it locks to exactly 1920×1080 so the saved PDF
 * fills a single signage frame with no overflow page. All interactive chrome
 * carries `no-print` so the export stays clean.
 */
export default function BoardSignage({
  items,
  links,
  monthLabel,
  askUrl,
  eyebrow,
  title,
  description,
  error,
}: Props) {
  return (
    <div className="board-page min-h-screen bg-neutral-100 flex items-center justify-center p-6">
      <style>{`
        .board-stage {
          width: 100%;
          max-width: 1500px;
          aspect-ratio: 16 / 9;
        }
        @media print {
          @page { size: 1920px 1080px landscape; margin: 0; }
          html, body {
            margin: 0;
            padding: 0;
            background: white;
            overflow: hidden;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          .no-print { display: none !important; }
          .board-page { display: block; min-height: 0; padding: 0; background: white; }
          /* Fill exactly one printed page rather than a fixed 1920px box, so
             the layout can never overflow the paper and clip the QR — if the
             browser honors @page it is 1920×1080, otherwise it still fits. */
          .board-stage {
            width: 100%;
            height: 100vh;
            max-width: none;
            aspect-ratio: auto;
            border-radius: 0;
            box-shadow: none;
            border: 0;
            page-break-inside: avoid;
          }
        }
      `}</style>

      <div className="board-stage relative flex flex-col overflow-hidden rounded-3xl border border-black/10 bg-gradient-to-b from-white via-[#FFF7D6] to-white text-black shadow-xl shadow-black/10">
        <header className="flex items-center justify-between px-12 pt-6 pb-3">
          <span className="text-base font-semibold tracking-wider text-gray-700">
            Questions Display
          </span>
          <h1 className="text-4xl font-bold tracking-[0.4em]">Q</h1>
          <div className="flex items-center gap-3">
            <span className="text-base text-gray-500">{monthLabel}</span>
            <SignageExport />
            <PrintButton />
          </div>
        </header>

        {title && (
          <div className="px-12 text-center">
            {eyebrow && (
              <p className="text-xs text-gray-500 tracking-[0.5em]">{eyebrow}</p>
            )}
            <p className="mt-1 text-3xl font-semibold tracking-wide">{title}</p>
            {description && (
              <p className="mt-1.5 text-base text-gray-600">{description}</p>
            )}
          </div>
        )}

        {/* Wall fills the remaining height. pr/pb reserve a safe corner so notes
            never hide behind the post-CTA card and the card stays clear of the
            page edge (where print margins would otherwise clip it). */}
        <main className="relative mt-3 min-h-0 flex-1 px-12 pb-10">
          <div className="h-full w-full overflow-hidden rounded-2xl border border-black/10">
            <QuestionWall items={items} links={links} fill hideAttribution zoomable />
          </div>

          <aside className="absolute bottom-14 right-16 flex flex-col items-center gap-2 rounded-2xl border border-black/10 bg-white/95 px-5 py-4 shadow-xl shadow-black/15 backdrop-blur">
            <div className="text-center leading-tight">
              <p className="text-lg font-bold tracking-wider text-gray-900">
                問いを投稿する
              </p>
              <p className="mt-0.5 text-[11px] text-gray-500 tracking-wide">
                QR を読み取って今すぐ
              </p>
            </div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={qrImageSrc(askUrl)}
              alt="問いを投稿する QR コード"
              width={112}
              height={112}
              className="block rounded-lg"
            />
          </aside>

          {error && (
            <p className="no-print absolute bottom-2 left-12 text-sm text-amber-700">
              データ取得でエラーが発生しました: {error}
            </p>
          )}
        </main>
      </div>
    </div>
  );
}
