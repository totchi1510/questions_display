'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';

/**
 * Design size of the signage board. Everything inside is laid out against
 * these fixed dimensions and the whole box is then scaled to fit whatever
 * space is available.
 *
 * The board used to be a fluid `max-width: 1500px; aspect-ratio: 16/9` box,
 * which meant its px-based internals (padding, type scale, the 112px QR) kept
 * their absolute size while the box shrank — on a phone that collapsed into
 * the QR card covering the whole board. Fixing the design size and scaling
 * instead keeps the composition identical at every viewport, and makes the
 * on-screen board a true preview of the exported PNG.
 */
export const STAGE_WIDTH = 1600;
export const STAGE_HEIGHT = 900;

export default function BoardStage({ children }: { children: ReactNode }) {
  const frameRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState<number | null>(null);

  useEffect(() => {
    const frame = frameRef.current;
    if (!frame) return;

    const measure = () => {
      const { width, height } = frame.getBoundingClientRect();
      if (width <= 0 || height <= 0) return;
      setScale(Math.min(width / STAGE_WIDTH, height / STAGE_HEIGHT));
    };

    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(frame);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={frameRef} className="relative h-full w-full">
      {/* The transform lives here rather than on `.board-stage` itself:
          html-to-image copies the captured node's own computed style onto its
          clone, so a transform on the stage would bake the on-screen shrink
          into the exported PNG. Keeping the stage untransformed lets the
          export render it at its full design size. */}
      <div
        className="board-scaler absolute left-1/2 top-1/2"
        style={{
          width: STAGE_WIDTH,
          height: STAGE_HEIGHT,
          transformOrigin: 'center',
          transform: `translate(-50%, -50%) scale(${scale ?? 1})`,
          // Avoid a flash of the unscaled 1600px board before the first measure.
          visibility: scale === null ? 'hidden' : undefined,
        }}
      >
        {children}
      </div>
    </div>
  );
}
