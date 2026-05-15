import ReactionBar from './ReactionBar';
import type { QuestionTile } from '@/lib/questions';

type Props = {
  items: QuestionTile[];
  interactive?: boolean;
  /**
   * Tailwind grid-cols utilities, e.g. "grid-cols-2 sm:grid-cols-4 lg:grid-cols-6".
   * Must allow up to 3 column spans at sm+ for the longest tiles.
   */
  gridClass?: string;
};

function widthSpan(content: string): string {
  const len = content.length;
  if (len <= 25) return 'col-span-1';
  if (len <= 70) return 'col-span-1 sm:col-span-2';
  return 'col-span-2 sm:col-span-3';
}

export default function QuestionMasonry({
  items,
  interactive = false,
  gridClass = 'grid-cols-2 sm:grid-cols-4 lg:grid-cols-6',
}: Props) {
  if (items.length === 0) {
    return (
      <div className="text-center text-gray-400 py-12">
        まだ問いがありません
      </div>
    );
  }

  return (
    <div
      className={`grid ${gridClass} gap-6 items-start`}
      style={{ gridAutoFlow: 'dense' }}
    >
      {items.map((item) => (
        <article
          key={item.id}
          className={`${widthSpan(item.content)} rounded-[32px] border border-black/30 bg-white p-6 shadow-sm shadow-yellow-200/30`}
        >
          <div className="text-base leading-relaxed whitespace-pre-wrap break-words">
            {item.content}
          </div>
          {interactive && (
            <div className="mt-3 flex justify-end">
              <ReactionBar
                questionId={item.id}
                counts={{
                  think: item.think_count,
                  talk: item.talk_count,
                  inspire: item.inspire_count,
                }}
              />
            </div>
          )}
        </article>
      ))}
    </div>
  );
}
