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
      className={`grid ${gridClass} gap-8 items-start`}
      style={{ gridAutoFlow: 'dense' }}
    >
      {items.map((item) => (
        <article
          key={item.id}
          className={`${widthClass(item.content)} rounded-[32px] border border-black/15 bg-white p-7 shadow-sm shadow-yellow-200/20`}
        >
          <div className="text-base leading-relaxed whitespace-pre-wrap break-words">
            {item.content}
          </div>
          {interactive && (
            <div className="mt-4 flex justify-end">
              <HoldButton questionId={item.id} count={item.hold_count} />
            </div>
          )}
        </article>
      ))}
    </div>
  );
}
