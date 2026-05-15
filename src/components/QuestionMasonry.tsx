import LikeButton from './LikeButton';
import type { QuestionTile } from '@/lib/questions';

type Props = {
  items: QuestionTile[];
  interactive?: boolean;
  columnsClass?: string;
};

export default function QuestionMasonry({
  items,
  interactive = false,
  columnsClass = 'columns-2 sm:columns-3 lg:columns-4',
}: Props) {
  if (items.length === 0) {
    return (
      <div className="text-center text-gray-400 py-12">
        まだ問いがありません
      </div>
    );
  }

  return (
    <div className={`${columnsClass} gap-6`}>
      {items.map((item) => (
        <article
          key={item.id}
          className="break-inside-avoid mb-6 rounded-[32px] border border-black/30 bg-white p-6 shadow-sm shadow-yellow-200/30"
        >
          <div className="text-base leading-relaxed whitespace-pre-wrap break-words">
            {item.content}
          </div>
          {interactive && (
            <div className="mt-3 flex justify-end">
              <LikeButton questionId={item.id} count={item.likes_count} />
            </div>
          )}
        </article>
      ))}
    </div>
  );
}
