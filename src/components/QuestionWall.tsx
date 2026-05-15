'use client';

import {
  Fragment,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  Handle,
  Position,
  type Edge,
  type Node,
  type ProOptions,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import HoldButton from './HoldButton';
import {
  stickyWidthPx,
  type QuestionLink,
  type QuestionTile,
} from '@/lib/questions';

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
  /** Authored by the current visitor — show a movable affordance. */
  mine?: boolean;
};

/**
 * Hover state is broadcast via context instead of re-creating the React Flow
 * `nodes` array on every focus change. That keeps ReactFlow from rerendering
 * and re-measuring every node — which is what caused hover-flicker when the
 * cursor entered a note quickly.
 */
type HoverState = {
  ancestry: { nodes: Set<string>; edgeIds: Set<string> } | null;
};
const HoverContext = createContext<HoverState>({ ancestry: null });

const HIDDEN_HANDLE_STYLE: React.CSSProperties = {
  background: 'transparent',
  border: 'none',
  width: 1,
  height: 1,
  pointerEvents: 'none',
};

const HANDLE_SIDES: { key: Side; position: Position }[] = [
  { key: 'top', position: Position.Top },
  { key: 'right', position: Position.Right },
  { key: 'bottom', position: Position.Bottom },
  { key: 'left', position: Position.Left },
];

function StickyNode({ data }: { data: StickyData }) {
  const { item, clickable, mine } = data;
  const { ancestry } = useContext(HoverContext);
  const inAncestry = ancestry ? ancestry.nodes.has(item.id) : true;
  const dimmed = ancestry !== null && !inAncestry;
  const highlighted = ancestry !== null && inAncestry;
  const { rotation, color } = stickyStyle(item.id);
  const width = stickyWidthPx(item.width_px, item.hold_count);

  const stopBubble = (e: React.SyntheticEvent) => {
    e.stopPropagation();
  };

  const cursor = mine ? 'cursor-grab active:cursor-grabbing' : clickable ? 'cursor-pointer' : '';

  // Keep border-width and box dimensions stable across states; vary only
  // colors/shadow/opacity so hovering can't change the node's bounding box
  // (which would cause hover-flicker against React Flow's hit-testing).
  const borderClass = highlighted
    ? 'border-black/50'
    : mine
      ? 'border-dashed border-[#FAD55A]'
      : 'border-black/10';
  const shadowClass = highlighted
    ? 'shadow-[0_8px_24px_-4px_rgba(0,0,0,0.3)]'
    : 'shadow-[0_6px_16px_-6px_rgba(0,0,0,0.2)]';

  return (
    <div
      className={`relative rounded-2xl p-4 border-2 transition-[box-shadow,border-color,opacity] duration-200 ${borderClass} ${shadowClass} ${cursor} ${
        dimmed ? 'opacity-25' : 'opacity-100'
      }`}
      style={{
        width,
        backgroundColor: color,
        transform: `rotate(${rotation}deg)`,
      }}
    >
      {HANDLE_SIDES.map(({ key, position }) => (
        <Fragment key={key}>
          <Handle
            type="source"
            id={`s-${key}`}
            position={position}
            style={HIDDEN_HANDLE_STYLE}
            isConnectable={false}
          />
          <Handle
            type="target"
            id={`t-${key}`}
            position={position}
            style={HIDDEN_HANDLE_STYLE}
            isConnectable={false}
          />
        </Fragment>
      ))}
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

type Side = 'top' | 'right' | 'bottom' | 'left';

function sideToward(dx: number, dy: number): Side {
  if (Math.abs(dx) >= Math.abs(dy)) {
    return dx >= 0 ? 'right' : 'left';
  }
  return dy >= 0 ? 'bottom' : 'top';
}

const nodeTypes = { sticky: StickyNode };
const proOptions: ProOptions = { hideAttribution: false };
const nodeOrigin: [number, number] = [0.5, 0.5];

function QuestionModal({
  item,
  ancestors,
  onClose,
}: {
  item: QuestionTile;
  ancestors: QuestionTile[];
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
        {ancestors.length > 0 && (
          <div className="mt-6 pt-4 border-t border-black/10">
            <p className="text-xs text-gray-500 mb-2 tracking-wider">影響を受けた問い</p>
            <ul className="space-y-1.5">
              {ancestors.map((a) => (
                <li key={a.id} className="text-sm text-gray-700 leading-snug">
                  <span className="text-gray-400">↳</span> {a.content}
                </li>
              ))}
            </ul>
          </div>
        )}
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
  /** Inspiration edges between questions, drawn as bezier curves. */
  links?: QuestionLink[];
  /** Enable pan/zoom + click-to-expand + reactions. /board passes false. */
  interactive?: boolean;
  /** Question ids the current visitor authored. Those become draggable. */
  myIds?: string[];
};

export default function QuestionWall({
  items,
  links = [],
  interactive = false,
  myIds = [],
}: Props) {
  const [focused, setFocused] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<QuestionTile | null>(null);
  const [dragging, setDragging] = useState(false);
  const mySet = useMemo(() => new Set(myIds), [myIds]);
  // Keep an in-memory copy of position overrides so the dragged note stays in
  // its new spot after the API call resolves (no full page reload needed).
  const [localPositions, setLocalPositions] = useState<
    Record<string, { x: number; y: number }>
  >({});

  // Only the directly-specified inspirations (1 hop) — the chain past that
  // is intentionally NOT highlighted, so the focused note's own intent stays
  // legible.
  const ancestry = useMemo(() => {
    if (!focused) return null;
    const nodes = new Set<string>([focused]);
    const edgeIds = new Set<string>();
    for (const l of links) {
      if (l.from === focused) {
        nodes.add(l.to);
        edgeIds.add(`${l.from}->${l.to}`);
      }
    }
    return { nodes, edgeIds };
  }, [focused, links]);

  const nodes: Node[] = useMemo(
    () =>
      items.map((item) => {
        const override = localPositions[item.id];
        const px = override ? override.x : item.position_x;
        const py = override ? override.y : item.position_y;
        const mine = mySet.has(item.id);
        return {
          id: item.id,
          type: 'sticky',
          position: {
            x: px * X_SCALE,
            y: py * Y_SCALE,
          },
          data: { item, clickable: interactive, mine },
          draggable: interactive && mine,
          selectable: false,
        };
      }),
    [items, interactive, mySet, localPositions]
  );

  const edges: Edge[] = useMemo(() => {
    const byId = new Map(items.map((i) => [i.id, i]));
    const out: Edge[] = [];
    for (const l of links) {
      const src = byId.get(l.from);
      const tgt = byId.get(l.to);
      if (!src || !tgt) continue;
      const dx = tgt.position_x - src.position_x;
      const dy = tgt.position_y - src.position_y;
      const srcSide = sideToward(dx, dy);
      const tgtSide = sideToward(-dx, -dy);
      const edgeId = `${l.from}->${l.to}`;
      const highlighted = ancestry?.edgeIds.has(edgeId) ?? false;
      const dimmed = ancestry !== null && !highlighted;
      out.push({
        id: edgeId,
        source: l.from,
        target: l.to,
        sourceHandle: `s-${srcSide}`,
        targetHandle: `t-${tgtSide}`,
        type: 'default',
        animated: false,
        style: {
          stroke: highlighted
            ? 'rgba(0,0,0,0.9)'
            : dimmed
              ? 'rgba(0,0,0,0.08)'
              : 'rgba(0,0,0,0.5)',
          strokeWidth: highlighted ? 3 : 2,
          // Explicit '0' so that switching to highlighted clears the prior
          // dash pattern from the DOM (undefined leaves it stuck).
          strokeDasharray: highlighted ? '0' : '8 5',
        },
      });
    }
    return out;
  }, [links, items, ancestry]);

  const onNodeMouseEnter = useCallback(
    (_e: React.MouseEvent, node: Node) => {
      if (!interactive) return;
      if (expanded || dragging) return; // freeze highlight while modal or drag is active
      setFocused(node.id);
    },
    [interactive, expanded, dragging]
  );

  const onNodeMouseLeave = useCallback(() => {
    if (!interactive) return;
    if (expanded || dragging) return;
    setFocused(null);
  }, [interactive, expanded, dragging]);

  const onNodeClick = useCallback(
    (_e: React.MouseEvent, node: Node) => {
      if (!interactive) return;
      const item = items.find((i) => i.id === node.id);
      if (item) {
        setFocused(node.id);
        setExpanded(item);
      }
    },
    [interactive, items]
  );

  const onPaneClick = useCallback(() => {
    setFocused(null);
  }, []);

  const onNodeDragStart = useCallback(() => {
    // Clear hover noise while dragging — drag should feel as clean as /ask.
    setDragging(true);
    setFocused(null);
  }, []);

  const onNodeDragStop = useCallback(
    (_e: React.MouseEvent, node: Node) => {
      setDragging(false);
      if (!mySet.has(node.id)) return;
      const x = Math.max(0, Math.min(100, node.position.x / X_SCALE));
      const y = Math.max(0, Math.min(100, node.position.y / Y_SCALE));
      setLocalPositions((prev) => ({ ...prev, [node.id]: { x, y } }));
      fetch(`/api/questions/${node.id}/position`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ x, y }),
      }).catch(() => {
        // Best-effort; ignore network errors for now.
      });
    },
    [mySet]
  );

  const ancestorTiles = useMemo(() => {
    if (!expanded || !ancestry) return [];
    return items.filter((i) => i.id !== expanded.id && ancestry.nodes.has(i.id));
  }, [expanded, ancestry, items]);

  const hoverState = useMemo<HoverState>(() => ({ ancestry }), [ancestry]);

  return (
    <>
      <div className="relative aspect-[16/9] w-full rounded-2xl overflow-hidden border border-black/10 bg-[#FFFCEC]">
        <HoverContext.Provider value={hoverState}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
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
          edgesFocusable={false}
          preventScrolling={interactive}
          onNodeClick={onNodeClick}
          onNodeMouseEnter={onNodeMouseEnter}
          onNodeMouseLeave={onNodeMouseLeave}
          onPaneClick={onPaneClick}
          onNodeDragStart={onNodeDragStart}
          onNodeDragStop={onNodeDragStop}
          nodeExtent={[
            [5 * X_SCALE, 5 * Y_SCALE],
            [95 * X_SCALE, 95 * Y_SCALE],
          ]}
          proOptions={proOptions}
        >
          <Background gap={28} size={1.5} color="rgba(0,0,0,0.12)" />
          {interactive && <Controls showInteractive={false} position="bottom-right" />}
        </ReactFlow>
        </HoverContext.Provider>
      </div>
      {expanded && (
        <QuestionModal
          item={expanded}
          ancestors={ancestorTiles}
          onClose={() => setExpanded(null)}
        />
      )}
    </>
  );
}
