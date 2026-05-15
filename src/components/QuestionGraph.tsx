'use client';

import dynamic from 'next/dynamic';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import HoldButton from './HoldButton';
import type { QuestionLink, QuestionTile } from '@/lib/questions';

// react-force-graph-2d uses canvas + window, so it must be client-only.
const ForceGraph2D = dynamic(() => import('react-force-graph-2d'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center w-full h-full text-sm text-gray-500">
      グラフを準備中…
    </div>
  ),
});

type GraphNode = {
  id: string;
  content: string;
  hold_count: number;
  mine: boolean;
  // populated by the force simulation
  x?: number;
  y?: number;
};

type GraphLink = {
  source: string | GraphNode;
  target: string | GraphNode;
};

function nodeId(end: string | GraphNode): string {
  return typeof end === 'string' ? end : end.id;
}

type Props = {
  items: QuestionTile[];
  links: QuestionLink[];
  myIds: string[];
  /** CSS height value for the canvas wrapper. Defaults to 80vh capped at 720px. */
  height?: string;
};

export default function QuestionGraph({ items, links, myIds, height }: Props) {
  const containerHeight = height ?? 'min(80vh, 720px)';
  const mySet = useMemo(() => new Set(myIds), [myIds]);
  const [hovered, setHovered] = useState<GraphNode | null>(null);
  const [selected, setSelected] = useState<GraphNode | null>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const [dims, setDims] = useState<{ width: number; height: number } | null>(null);

  useEffect(() => {
    if (!wrapRef.current) return;
    const ro = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) return;
      const { width, height } = entry.contentRect;
      setDims({ width, height });
    });
    ro.observe(wrapRef.current);
    return () => ro.disconnect();
  }, []);

  const graphData = useMemo(
    () => ({
      nodes: items.map<GraphNode>((i) => ({
        id: i.id,
        content: i.content,
        hold_count: i.hold_count,
        mine: mySet.has(i.id),
      })),
      links: links.map<GraphLink>((l) => ({ source: l.from, target: l.to })),
    }),
    [items, links, mySet]
  );

  // Map id -> set of connected ids for hover-time highlighting.
  const neighborMap = useMemo(() => {
    const m = new Map<string, Set<string>>();
    for (const l of links) {
      if (!m.has(l.from)) m.set(l.from, new Set());
      if (!m.has(l.to)) m.set(l.to, new Set());
      m.get(l.from)!.add(l.to);
      m.get(l.to)!.add(l.from);
    }
    return m;
  }, [links]);

  const isConnected = useCallback(
    (a: string, b: string) => {
      if (a === b) return true;
      const set = neighborMap.get(a);
      return set ? set.has(b) : false;
    },
    [neighborMap]
  );

  const drawNode = useCallback(
    (rawNode: GraphNode, ctx: CanvasRenderingContext2D, globalScale: number) => {
      const node = rawNode;
      if (node.x == null || node.y == null) return;
      const baseR = 3 + Math.log2(1 + node.hold_count) * 1.8;
      const radius = hovered && hovered.id === node.id ? baseR + 2 : baseR;

      const dim = hovered ? !isConnected(hovered.id, node.id) : false;
      let fill: string;
      if (dim) fill = 'rgba(0,0,0,0.18)';
      else if (node.mine) fill = '#f5cf4d';
      else if (hovered && hovered.id === node.id) fill = '#000';
      else fill = 'rgba(0,0,0,0.7)';

      ctx.beginPath();
      ctx.arc(node.x, node.y, radius, 0, 2 * Math.PI);
      ctx.fillStyle = fill;
      ctx.fill();
      if (!dim) {
        ctx.lineWidth = 0.6;
        ctx.strokeStyle = 'rgba(0,0,0,0.4)';
        ctx.stroke();
      }

      // Short label below the dot. Font sized in screen pixels (divide by
      // globalScale because canvas units are world units).
      const isFocus = hovered && hovered.id === node.id;
      if (dim && !isFocus) return;
      const screenPx = isFocus ? 13 : 10;
      const fontSize = screenPx / globalScale;
      const padding = 4 / globalScale;
      const maxLen = isFocus ? 28 : 14;
      const raw = node.content.replace(/\s+/g, ' ').trim();
      const label = raw.length > maxLen ? raw.slice(0, maxLen - 1) + '…' : raw;
      ctx.font = `${fontSize}px "Hiragino Sans", "Yu Gothic", system-ui, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      // Soft white halo so text stays legible over edges and dots.
      ctx.lineWidth = Math.max(2 / globalScale, 0.6);
      ctx.strokeStyle = 'rgba(255,253,238,0.85)';
      ctx.strokeText(label, node.x, node.y + radius + padding);
      ctx.fillStyle = isFocus ? '#000' : 'rgba(0,0,0,0.75)';
      ctx.fillText(label, node.x, node.y + radius + padding);
    },
    [hovered, isConnected]
  );

  // The library types its node objects loosely (Record-like). Cast at the
  // boundary so our strongly-typed handlers stay clean.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const Graph = ForceGraph2D as unknown as React.ComponentType<any>;

  return (
    <div className="relative w-full" style={{ height: containerHeight }}>
      <div
        ref={wrapRef}
        className="w-full h-full rounded-2xl overflow-hidden border border-black/10 bg-[#FFFCEC]"
        style={{
          backgroundImage: 'radial-gradient(rgba(0,0,0,0.06) 1px, transparent 1px)',
          backgroundSize: '28px 28px',
        }}
      >
        {dims && (
          <Graph
            graphData={graphData}
            width={dims.width}
            height={dims.height}
            backgroundColor="rgba(0,0,0,0)"
            nodeRelSize={4}
            nodeLabel={(n: GraphNode) =>
              n.content.length > 80 ? n.content.slice(0, 80) + '…' : n.content
            }
            nodeCanvasObject={drawNode}
            nodePointerAreaPaint={(n: GraphNode, color: string, ctx: CanvasRenderingContext2D) => {
              if (n.x == null || n.y == null) return;
              ctx.beginPath();
              const r = 3 + Math.log2(1 + n.hold_count) * 1.8 + 4;
              ctx.arc(n.x, n.y, r, 0, 2 * Math.PI);
              ctx.fillStyle = color;
              ctx.fill();
            }}
            linkColor={(l: GraphLink) => {
              if (!hovered) return 'rgba(0,0,0,0.25)';
              const s = nodeId(l.source);
              const t = nodeId(l.target);
              const touchesHover = s === hovered.id || t === hovered.id;
              return touchesHover ? 'rgba(0,0,0,0.85)' : 'rgba(0,0,0,0.06)';
            }}
            linkWidth={(l: GraphLink) => {
              if (!hovered) return 1;
              const s = nodeId(l.source);
              const t = nodeId(l.target);
              return s === hovered.id || t === hovered.id ? 2 : 0.7;
            }}
            cooldownTicks={120}
            d3VelocityDecay={0.3}
            onNodeHover={(n: GraphNode | null) => setHovered(n)}
            onNodeClick={(n: GraphNode) => setSelected(n)}
            onBackgroundClick={() => setSelected(null)}
          />
        )}
      </div>

      <div className="mt-3 flex items-center justify-between text-xs text-gray-500">
        <span>
          ノード数: {items.length} / つながり: {links.length}
        </span>
        <span className="space-x-3">
          <span>
            <span className="inline-block w-2.5 h-2.5 rounded-full align-middle bg-[#f5cf4d] mr-1" />
            あなたの問い
          </span>
          <span>
            <span className="inline-block w-2.5 h-2.5 rounded-full align-middle bg-black/70 mr-1" />
            その他
          </span>
        </span>
      </div>

      {selected && (
        <QuestionDetail
          item={items.find((i) => i.id === selected.id) ?? null}
          onClose={() => setSelected(null)}
        />
      )}
    </div>
  );
}

function QuestionDetail({
  item,
  onClose,
}: {
  item: QuestionTile | null;
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

  if (!item) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      onClick={onClose}
      className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-6"
    >
      <article
        onClick={(e) => e.stopPropagation()}
        className="relative max-w-2xl w-full rounded-3xl bg-[#FFFAEA] border border-black/10 shadow-2xl p-10 sm:p-14"
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
