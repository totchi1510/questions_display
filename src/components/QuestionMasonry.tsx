'use client';

import Masonry from 'react-masonry-css';
import HoldButton from './HoldButton';
import type { QuestionTile } from '@/lib/questions';

type Breakpoints = {
  default: number;
  [width: number]: number;
};

type Props = {
  items: QuestionTile[];
  interactive?: boolean;
  /**
   * Breakpoint columns map for react-masonry-css.
   * Keys are min viewport widths; "default" is the widest fallback.
   */
  breakpoints?: Breakpoints;
};

const DEFAULT_BREAKPOINTS: Breakpoints = {
  default: 4,
  1024: 3,
  640: 2,
};

export default function QuestionMasonry({
  items,
  interactive = false,
  breakpoints = DEFAULT_BREAKPOINTS,
}: Props) {
  if (items.length === 0) {
    return (
      <div className="text-center text-gray-400 py-12">まだ問いがありません</div>
    );
  }

  return (
    <Masonry
      breakpointCols={breakpoints}
      className="masonry-grid"
      columnClassName="masonry-column"
    >
      {items.map((item) => (
        <article
          key={item.id}
          className="rounded-[32px] border border-black/30 bg-white p-6 shadow-sm shadow-yellow-200/30"
        >
          <div className="text-base leading-relaxed whitespace-pre-wrap break-words">
            {item.content}
          </div>
          {interactive && (
            <div className="mt-3 flex justify-end">
              <HoldButton questionId={item.id} count={item.hold_count} />
            </div>
          )}
        </article>
      ))}
    </Masonry>
  );
}
