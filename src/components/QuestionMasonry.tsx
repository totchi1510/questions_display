import HoldButton from './HoldButton';
import type { QuestionTile } from '@/lib/questions';

type Props = {
  items: QuestionTile[];
  interactive?: boolean;
  /**
   * Tailwind grid-cols utilities. Each tile may col-span up to 2 at sm+
   * (long ones) or stays at 1 (short ones), so the grid should have at
   * least 2 columns at the smallest breakpoint where col-span-2 applies.
   */
  gridClass?: string;
};

const PALETTE = ['#FFFFFF', '#FFFAEA', '#FBEFE3', '#EFF3E8'];

function hashCode(str: string): number {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = (h * 31 + str.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

function stickyStyle(id: string): { rotation: number; color: string } {
  const h = hashCode(id);
  return {
    rotation: (h % 7) - 3, // deterministic -3°〜+3°
    color: PALETTE[h % PALETTE.length],
  };
}

function widthClass(content: string): string {
  return content.length > 32 ? 'col-span-1 sm:col-span-2' : 'col-span-1';
}

export default function QuestionMasonry({
  items,
  interactive = false,
  gridClass = 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4',
}: Props) {
  if (items.length === 0) {
    return (
      <div className="text-center text-gray-400 py-12">まだ問いがありません</div>
    );
  }

  return (
    <div
      className={`grid ${gridClass} gap-10 items-start`}
      style={{ gridAutoFlow: 'dense' }}
    >
      {items.map((item) => {
        const { rotation, color } = stickyStyle(item.id);
        return (
          <article
            key={item.id}
            className={`${widthClass(item.content)} rounded-[20px] border border-black/10 p-7 shadow-md shadow-black/10 motion-safe:transition-transform motion-safe:hover:scale-[1.03] motion-safe:hover:shadow-xl`}
            style={{
              transform: `rotate(${rotation}deg)`,
              backgroundColor: color,
            }}
          >
            <div className="text-base leading-relaxed whitespace-pre-wrap [word-break:auto-phrase] [line-break:strict]">
              {item.content}
            </div>
            {interactive && (
              <div className="mt-4 flex justify-end">
                <HoldButton questionId={item.id} count={item.hold_count} />
              </div>
            )}
          </article>
        );
      })}
    </div>
  );
}
