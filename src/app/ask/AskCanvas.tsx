'use client';

import { useCallback, useMemo, useState } from 'react';
import {
  ReactFlow,
  Background,
  applyNodeChanges,
  type Node,
  type NodeChange,
  type ProOptions,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import type { QuestionTile } from '@/lib/questions';

const X_SCALE = 16;
const Y_SCALE = 9;
const NEW_NODE_ID = '__new__';

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

function ExistingStickyNode({ data }: { data: { item: QuestionTile } }) {
  const { rotation, color } = stickyStyle(data.item.id);
  return (
    <div
      className="rounded-xl border border-black/10 p-2 shadow-sm shadow-black/5 opacity-55 pointer-events-none"
      style={{
        width: 150,
        backgroundColor: color,
        transform: `rotate(${rotation}deg)`,
      }}
    >
      <div className="text-[10px] leading-snug line-clamp-3 [word-break:auto-phrase] [line-break:strict]">
        {data.item.content}
      </div>
    </div>
  );
}

function NewStickyNode({ data }: { data: { content: string } }) {
  return (
    <div
      className="rounded-xl border-2 border-black/40 p-3 shadow-[0_8px_20px_-4px_rgba(0,0,0,0.25)] select-none"
      style={{
        width: 200,
        backgroundColor: '#FAD55A',
        transform: 'rotate(-2deg)',
      }}
    >
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
};

export default function AskCanvas({ existing }: Props) {
  const [content, setContent] = useState('');

  const initialNodes: Node[] = useMemo(() => {
    const existingNodes: Node[] = existing.map((item) => ({
      id: item.id,
      type: 'existing',
      position: {
        x: item.position_x * X_SCALE,
        y: item.position_y * Y_SCALE,
      },
      data: { item },
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

  const onNodesChange = useCallback(
    (changes: NodeChange[]) => {
      setNodes((nds) => {
        const applied = applyNodeChanges(changes, nds);
        return applied.map((n) => {
          if (n.id !== NEW_NODE_ID) return n;
          const x = Math.max(
            5 * X_SCALE,
            Math.min(95 * X_SCALE, n.position.x)
          );
          const y = Math.max(
            5 * Y_SCALE,
            Math.min(95 * Y_SCALE, n.position.y)
          );
          return { ...n, position: { x, y } };
        });
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
      nodes.map((n) =>
        n.id === NEW_NODE_ID ? { ...n, data: { content } } : n
      ),
    [nodes, content]
  );

  return (
    <form method="post" action="/ask/submit" className="flex flex-col gap-6">
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
        黄色い付箋を<strong className="font-semibold">ドラッグ</strong>して、貼る場所を選んでください。
      </p>

      <div className="aspect-[16/9] w-full rounded-2xl overflow-hidden border border-black/20 bg-[#FFFCEC]">
        <ReactFlow
          nodes={renderedNodes}
          onNodesChange={onNodesChange}
          nodeTypes={nodeTypes}
          nodeOrigin={nodeOrigin}
          fitView
          fitViewOptions={{
            padding: 0.1,
            minZoom: 0.4,
            maxZoom: 1.5,
          }}
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
          proOptions={proOptions}
        >
          <Background gap={24} size={1.5} color="rgba(0,0,0,0.1)" />
        </ReactFlow>
      </div>

      <input type="hidden" name="position_x" value={pos.x.toFixed(2)} />
      <input type="hidden" name="position_y" value={pos.y.toFixed(2)} />

      <div className="flex items-center justify-between text-sm text-gray-500">
        <span>最大 2000 文字 / 投稿は確認後に表示されます</span>
        <span className="tabular-nums text-xs">
          x: {pos.x.toFixed(0)}% / y: {pos.y.toFixed(0)}%
        </span>
      </div>
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
