'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  type Node,
  type ProOptions,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import HoldButton from './HoldButton';
import type { QuestionTile } from '@/lib/questions';

const X_SCALE = 16;
const Y_SCALE = 9;

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
    rotation: (h % 5) - 2,
    color: PALETTE[h % PALETTE.length],
  };
}

type StickyData = {
  item: QuestionTile;
  clickable: boolean;
};

function StickyNode({ data }: { data: StickyData }) {
  const { item, clickable } = data;
  const { rotation, color } = stickyStyle(item.id);

  const stopBubble = (e: React.SyntheticEvent) => {
    e.stopPropagation();
  };

  return (
    <div
      className={`rounded-2xl border border-black/10 p-4 shadow-[0_6px_16px_-6px_rgba(0,0,0,0.2)] transition-transform duration-150 ${
        clickable ? 'cursor-pointer hover:scale-[1.05] hover:shadow-[0_10px_24px_-6px_rgba(0,0,0,0.28)]' : ''
      }`}
      style={{
        width: 220,
        backgroundColor: color,
        transform: `rotate(${rotation}deg)`,
      }}
    >
      <div className="text-sm leading-relaxed whitespace-pre-wrap [word-break:auto-phrase] [line-break:strict]">
        {item.content}
      </div>
      {clickable && (
        <div
          className="mt-3 flex justify-end"
          onClick={stopBubble}
          onMouseDown={stopBubble}
          onPointerDown={stopBubble}
        >
          <HoldButton questionId={item.id} count={item.hold_count} />
        </div>
      )}
    </div>
  );
}

const nodeTypes = { sticky: StickyNode };
const proOptions: ProOptions = { hideAttribution: false };
const nodeOrigin: [number, number] = [0.5, 0.5];

function QuestionModal({
  item,
  onClose,
}: {
  item: QuestionTile;
  onClose: () => void;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  const { rotation, color } = stickyStyle(item.id);

  return (
    <div
      role="dialog"
      aria-modal="true"
      onClick={onClose}
      className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-6"
      style={{ animation: 'qd-fade-in 180ms ease-out' }}
    >
      <style>{`
        @keyframes qd-fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes qd-pop-in {
          from { opacity: 0; transform: scale(0.85) rotate(${rotation}deg); }
          to { opacity: 1; transform: scale(1) rotate(${rotation}deg); }
        }
      `}</style>
      <article
        onClick={(e) => e.stopPropagation()}
        className="relative max-w-2xl w-full rounded-3xl border border-black/10 shadow-2xl p-10 sm:p-14"
        style={{
          backgroundColor: color,
          transform: `rotate(${rotation}deg)`,
          animation: 'qd-pop-in 220ms cubic-bezier(0.2, 0.9, 0.3, 1.2)',
        }}
      >
        <button
          type="button"
          aria-label="閉じる"
          onClick={onClose}
          className="absolute top-3 right-3 w-10 h-10 rounded-full hover:bg-black/5 active:bg-black/10 flex items-center justify-center text-xl leading-none"
        >
          ✕
        </button>
        <div className="text-xl sm:text-2xl leading-relaxed whitespace-pre-wrap [word-break:auto-phrase] [line-break:strict] pr-6">
          {item.content}
        </div>
        <div className="mt-8 flex items-center justify-between">
          <span className="text-xs text-gray-500 tabular-nums">
            🤔 {item.hold_count} 人が考え中
          </span>
          <HoldButton questionId={item.id} count={item.hold_count} />
        </div>
      </article>
    </div>
  );
}

type Props = {
  items: QuestionTile[];
  /** Enable pan/zoom + click-to-expand + reactions. /board passes false. */
  interactive?: boolean;
};

export default function QuestionWall({ items, interactive = false }: Props) {
  const [selected, setSelected] = useState<QuestionTile | null>(null);

  const nodes: Node[] = useMemo(
    () =>
      items.map((item) => ({
        id: item.id,
        type: 'sticky',
        position: {
          x: item.position_x * X_SCALE,
          y: item.position_y * Y_SCALE,
        },
        data: { item, clickable: interactive },
        draggable: false,
        selectable: false,
      })),
    [items, interactive]
  );

  const onNodeClick = useCallback(
    (_e: React.MouseEvent, node: Node) => {
      if (!interactive) return;
      const item = items.find((i) => i.id === node.id);
      if (item) setSelected(item);
    },
    [interactive, items]
  );

  return (
    <>
      <div className="relative aspect-[16/9] w-full rounded-2xl overflow-hidden border border-black/10 bg-[#FFFCEC]">
        <ReactFlow
          nodes={nodes}
          nodeTypes={nodeTypes}
          nodeOrigin={nodeOrigin}
          fitView
          fitViewOptions={{ padding: 0.15 }}
          panOnDrag={interactive}
          panOnScroll={false}
          zoomOnScroll={interactive}
          zoomOnPinch={interactive}
          zoomOnDoubleClick={interactive}
          minZoom={0.4}
          maxZoom={3}
          nodesDraggable={false}
          nodesConnectable={false}
          elementsSelectable={false}
          preventScrolling={interactive}
          onNodeClick={onNodeClick}
          proOptions={proOptions}
        >
          <Background gap={28} size={1.5} color="rgba(0,0,0,0.12)" />
          {interactive && <Controls showInteractive={false} position="bottom-right" />}
        </ReactFlow>
      </div>
      {selected && <QuestionModal item={selected} onClose={() => setSelected(null)} />}
    </>
  );
}
