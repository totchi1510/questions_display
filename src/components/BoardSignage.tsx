import BoardStage from '@/components/BoardStage';
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
 * A fixed 16:9 "stage" tuned for full-HD signage. `BoardStage` lays it out at
 * a constant design size and scales the whole box to fit the viewport, so the
 * composition holds together on a phone as well as on the display — turn the
 * phone sideways and the same board simply gets bigger.
 *
 * `SignageExport` captures the stage as an exact 1920×1080 PNG, which is the
 * supported way to get an image for the display. Printing is NOT that path:
 * browsers ignore the `@page` size, so a saved PDF comes out at the wrong
 * aspect ratio. The print rules below only exist so an accidental Ctrl+P still
 * yields something sane. All interactive chrome carries `no-print`, which
 * doubles as the export filter.
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
    <div className="board-page relative h-dvh w-full overflow-hidden bg-neutral-100 p-3 sm:p-6">
      <style>{`
        /* Only worth showing where the board is genuinely cramped. */
        .board-rotate-hint { display: none; }
        @media (orientation: portrait) and (max-width: 640px) {
          .board-rotate-hint { display: block; }
        }
        @media print {
          @page { margin: 0; }
          html, body {
            margin: 0;
            padding: 0;
            background: white;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          .no-print { display: none !important; }
          .board-page { display: block; height: auto; padding: 0; background: white; overflow: visible; }
          /* Undo the fit-to-viewport shrink so the board prints at its design
             size instead of at whatever the screen happened to need. */
          .board-scaler {
            position: static !important;
            transform: none !important;
          }
          .board-stage {
            border-radius: 0;
            box-shadow: none;
            border: 0;
            page-break-inside: avoid;
          }
        }
      `}</style>

      <BoardStage>
      <div className="board-stage relative flex h-full w-full flex-col overflow-hidden rounded-3xl border border-black/10 bg-gradient-to-b from-white via-[#FFF7D6] to-white text-black shadow-xl shadow-black/10">
        <p className="absolute bottom-4 left-12 z-10 text-xs text-gray-400">
          制作: DS部
        </p>

        <header className="relative flex items-center justify-between px-12 pt-6 pb-3">
          <span className="text-base font-semibold tracking-wider text-gray-700">
            Questions Display
          </span>
          {/* Absolutely centered so the Q sits at the true page center
              regardless of the differing left/right header widths. */}
          <h1 className="pointer-events-none absolute left-1/2 -translate-x-1/2 text-4xl font-bold">
            Q
          </h1>
          <div className="flex items-center gap-3">
            <span className="text-base text-gray-500">{monthLabel}</span>
            <SignageExport />
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
      </BoardStage>

      <p className="board-rotate-hint no-print pointer-events-none absolute inset-x-0 bottom-2 text-center text-[11px] text-gray-500">
        端末を横向きにすると大きく表示されます
      </p>
    </div>
  );
}
