'use client';

import { useCallback, useMemo, useState } from 'react';
import {
  ReactFlow,
  Background,
  Handle,
  Position,
  applyNodeChanges,
  type Edge,
  type Node,
  type NodeChange,
  type ProOptions,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import {
  DEFAULT_WIDTH_PX,
  stickyWidthPx,
  type QuestionTile,
} from '@/lib/questions';

const X_SCALE = 16;
const Y_SCALE = 9;
const NEW_NODE_ID = '__new__';
const MAX_INSPIRATIONS = 3;

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

type ExistingData = {
  item: QuestionTile;
  selected: boolean;
};

const HIDDEN_HANDLE_STYLE: React.CSSProperties = {
  background: 'transparent',
  border: 'none',
  width: 1,
  height: 1,
  pointerEvents: 'none',
};

type Side = 'top' | 'right' | 'bottom' | 'left';

const HANDLE_SIDES: { key: Side; position: Position }[] = [
  { key: 'top', position: Position.Top },
  { key: 'right', position: Position.Right },
  { key: 'bottom', position: Position.Bottom },
  { key: 'left', position: Position.Left },
];

function sideToward(dx: number, dy: number): Side {
  if (Math.abs(dx) >= Math.abs(dy)) {
    return dx >= 0 ? 'right' : 'left';
  }
  return dy >= 0 ? 'bottom' : 'top';
}

function ExistingStickyNode({ data }: { data: ExistingData }) {
  const { rotation, color } = stickyStyle(data.item.id);
  const width = stickyWidthPx(data.item.width_px, data.item.hold_count) * 0.65;
  return (
    <div
      className={`relative rounded-xl p-2 transition-shadow ${
        data.selected
          ? 'opacity-100 border-2 border-[#FAD55A] shadow-[0_0_0_3px_rgba(250,213,90,0.4)]'
          : 'opacity-55 border border-black/10 shadow-sm shadow-black/5'
      }`}
      style={{
        width,
        backgroundColor: color,
        transform: `rotate(${rotation}deg)`,
        cursor: 'pointer',
      }}
    >
      {HANDLE_SIDES.map(({ key, position }) => (
        <Handle
          key={key}
          type="target"
          id={`t-${key}`}
          position={position}
          style={HIDDEN_HANDLE_STYLE}
          isConnectable={false}
        />
      ))}
      <div className="text-[10px] leading-snug line-clamp-3 [word-break:auto-phrase] [line-break:strict]">
        {data.item.content}
      </div>
    </div>
  );
}

function NewStickyNode({ data }: { data: { content: string } }) {
  return (
    <div
      className="relative rounded-xl border-2 border-black/40 p-3 shadow-[0_8px_20px_-4px_rgba(0,0,0,0.25)] select-none"
      style={{
        width: DEFAULT_WIDTH_PX,
        backgroundColor: '#FAD55A',
        transform: 'rotate(-2deg)',
      }}
    >
      {HANDLE_SIDES.map(({ key, position }) => (
        <Handle
          key={key}
          type="source"
          id={`s-${key}`}
          position={position}
          style={HIDDEN_HANDLE_STYLE}
          isConnectable={false}
        />
      ))}
      <div className="text-xs sm:text-sm leading-snug whitespace-pre-wrap [word-break:auto-phrase] [line-break:strict] min-h-[2lh]">
        {data.content || 'ここに貼られます'}
      </div>
    </div>
  );
}

const nodeTypes = { existing: ExistingStickyNode, new: NewStickyNode };

const proOptions: ProOptions = { hideAttribution: false };
const nodeOrigin: [number, number] = [0.5, 0.5];

const BOARD_WIDTH = 100 * X_SCALE;
const BOARD_HEIGHT = 100 * Y_SCALE;

function clampPercent(n: number) {
  return Math.max(5, Math.min(95, n));
}

type Props = {
  existing: QuestionTile[];
  /** Active theme label, if any — used to render an opt-in checkbox. */
  themeLabel?: string | null;
};

export default function AskCanvas({ existing, themeLabel }: Props) {
  const [content, setContent] = useState('');
  const [inspirations, setInspirations] = useState<string[]>([]);
  const [withTheme, setWithTheme] = useState<boolean>(Boolean(themeLabel));

  const initialNodes: Node[] = useMemo(() => {
    const existingNodes: Node[] = existing.map((item) => ({
      id: item.id,
      type: 'existing',
      position: {
        x: item.position_x * X_SCALE,
        y: item.position_y * Y_SCALE,
      },
      data: { item, selected: false },
      draggable: false,
      selectable: false,
    }));
    const newNode: Node = {
      id: NEW_NODE_ID,
      type: 'new',
      position: { x: 50 * X_SCALE, y: 50 * Y_SCALE },
      data: { content: '' },
      draggable: true,
      selectable: false,
    };
    return [...existingNodes, newNode];
  }, [existing]);

  const [nodes, setNodes] = useState<Node[]>(initialNodes);

  const onNodesChange = useCallback((changes: NodeChange[]) => {
    setNodes((nds) => {
      const applied = applyNodeChanges(changes, nds);
      return applied.map((n) => {
        if (n.id !== NEW_NODE_ID) return n;
        const x = Math.max(5 * X_SCALE, Math.min(95 * X_SCALE, n.position.x));
        const y = Math.max(5 * Y_SCALE, Math.min(95 * Y_SCALE, n.position.y));
        return { ...n, position: { x, y } };
      });
    });
  }, []);

  const onNodeClick = useCallback(
    (_e: React.MouseEvent, node: Node) => {
      if (node.id === NEW_NODE_ID) return;
      setInspirations((prev) => {
        if (prev.includes(node.id)) {
          return prev.filter((id) => id !== node.id);
        }
        if (prev.length >= MAX_INSPIRATIONS) return prev;
        return [...prev, node.id];
      });
    },
    []
  );

  const newNode = nodes.find((n) => n.id === NEW_NODE_ID);
  const pos = {
    x: clampPercent((newNode?.position.x ?? 50 * X_SCALE) / X_SCALE),
    y: clampPercent((newNode?.position.y ?? 50 * Y_SCALE) / Y_SCALE),
  };

  const renderedNodes: Node[] = useMemo(
    () =>
      nodes.map((n) => {
        if (n.id === NEW_NODE_ID) {
          return { ...n, data: { content } };
        }
        return { ...n, data: { item: n.data.item, selected: inspirations.includes(n.id) } };
      }),
    [nodes, content, inspirations]
  );

  // Preview edges: dashed lines from the new note to each selected inspiration.
  // Pick closest sides so the line exits/enters the notes naturally.
  const previewEdges: Edge[] = useMemo(() => {
    const existingById = new Map(existing.map((e) => [e.id, e]));
    return inspirations
      .map((id) => {
        const target = existingById.get(id);
        if (!target) return null;
        const dx = target.position_x - pos.x;
        const dy = target.position_y - pos.y;
        const srcSide = sideToward(dx, dy);
        const tgtSide = sideToward(-dx, -dy);
        return {
          id: `__preview__-${id}`,
          source: NEW_NODE_ID,
          target: id,
          sourceHandle: `s-${srcSide}`,
          targetHandle: `t-${tgtSide}`,
          type: 'default',
          animated: true,
          style: {
            stroke: '#000',
            strokeWidth: 1.5,
            strokeDasharray: '5 4',
            opacity: 0.6,
          },
        } as Edge;
      })
      .filter((e): e is Edge => e !== null);
  }, [inspirations, existing, pos.x, pos.y]);

  return (
    <form method="post" action="/ask/submit" className="flex flex-col gap-6">
      {themeLabel && (
        <label className="inline-flex items-start gap-2 text-sm rounded-2xl border border-black/15 bg-white/70 px-4 py-3">
          <input
            type="checkbox"
            name="with_theme"
            checked={withTheme}
            onChange={(e) => setWithTheme(e.target.checked)}
            className="mt-0.5 accent-[#FAD55A]"
          />
          <span className="leading-snug">
            <span className="font-semibold">今月のテーマ「{themeLabel}」に関連した問い</span>
            <span className="block text-xs text-gray-500 mt-0.5">
              チェックを外すと「テーマ外の掲示板」に貼られます。
            </span>
          </span>
        </label>
      )}

      <label htmlFor="content" className="text-sm font-medium text-gray-600">
        問いの内容
      </label>
      <textarea
        id="content"
        name="content"
        value={content}
        onChange={(e) => setContent(e.target.value)}
        className="w-full h-32 resize-none rounded-2xl border border-black/30 bg-white px-5 py-4 text-base leading-relaxed focus:outline-none focus:border-black/60"
        placeholder="問いを書き込んでください"
        maxLength={2000}
        required
      />

      <p className="text-sm text-gray-500">
        黄色い付箋を<strong className="font-semibold">ドラッグ</strong>して場所を選択。
        既存の付箋を<strong className="font-semibold">タップ</strong>すると、
        その問いから影響を受けたことを示す線が引かれます (最大 {MAX_INSPIRATIONS} 個)。
      </p>
      {inspirations.length > 0 && (
        <p className="text-xs text-amber-700 -mt-2">
          選んだ付箋の近くに自分の付箋を置くと、つながりが見やすくなります。
        </p>
      )}

      <div className="aspect-[16/9] w-full rounded-2xl overflow-hidden border border-black/20 bg-[#FFFCEC]">
        <ReactFlow
          nodes={renderedNodes}
          edges={previewEdges}
          onNodesChange={onNodesChange}
          onNodeClick={onNodeClick}
          nodeTypes={nodeTypes}
          nodeOrigin={nodeOrigin}
          fitView
          fitViewOptions={{ padding: 0.1, minZoom: 0.4, maxZoom: 1.5 }}
          translateExtent={[
            [0, 0],
            [BOARD_WIDTH, BOARD_HEIGHT],
          ]}
          nodeExtent={[
            [0, 0],
            [BOARD_WIDTH, BOARD_HEIGHT],
          ]}
          panOnDrag={false}
          zoomOnScroll={false}
          zoomOnPinch
          zoomOnDoubleClick={false}
          minZoom={0.4}
          maxZoom={1.5}
          nodesConnectable={false}
          elementsSelectable={false}
          edgesFocusable={false}
          proOptions={proOptions}
        >
          <Background gap={24} size={1.5} color="rgba(0,0,0,0.1)" />
        </ReactFlow>
      </div>

      <input type="hidden" name="position_x" value={pos.x.toFixed(2)} />
      <input type="hidden" name="position_y" value={pos.y.toFixed(2)} />
      <input type="hidden" name="width_px" value={DEFAULT_WIDTH_PX} />
      <input type="hidden" name="inspired_by" value={inspirations.join(',')} />

      <div className="flex items-center justify-between text-sm text-gray-500">
        <span>最大 2000 文字 / 投稿は確認後に表示されます</span>
        <span className="tabular-nums text-xs">
          x: {pos.x.toFixed(0)}% / y: {pos.y.toFixed(0)}% / 影響: {inspirations.length}/
          {MAX_INSPIRATIONS}
        </span>
      </div>
      <p className="text-center text-xs text-gray-400">
        🤔 が増えると掲示板で大きく表示されます
      </p>
      <button
        type="submit"
        disabled={!content.trim()}
        className="self-center px-12 py-3 bg-[#FAD55A] text-black font-semibold rounded-md shadow-sm hover:bg-[#f7c93a] transition disabled:opacity-50 disabled:cursor-not-allowed"
      >
        この場所に投稿する
      </button>
    </form>
  );
}
