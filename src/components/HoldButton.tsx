'use client';

import { useState } from 'react';

type Props = {
  questionId: string;
  count: number;
};

export default function HoldButton({ questionId, count: initialCount }: Props) {
  const [count, setCount] = useState(initialCount);
  const [held, setHeld] = useState(false);
  const [pending, setPending] = useState(false);

  async function onClick(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (held || pending) return;
    setPending(true);

    const optimistic = count + 1;
    setCount(optimistic);
    setHeld(true);

    try {
      const res = await fetch('/hold', {
        method: 'POST',
        body: new URLSearchParams({ question_id: questionId }),
        headers: { Accept: 'application/json' },
      });
      const json = (await res.json().catch(() => null)) as
        | { ok: true; status: 'held' | 'duplicate'; count: number }
        | { ok: false; error: string }
        | null;
      if (json && json.ok && typeof json.count === 'number') {
        setCount(json.count);
      } else if (!json || !json.ok) {
        setCount(initialCount);
        setHeld(false);
      }
    } catch {
      setCount(initialCount);
      setHeld(false);
    } finally {
      setPending(false);
    }
  }

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={pending || held}
      title={held ? 'リアクション済み' : 'この問いを考えている'}
      aria-label="この問いを考えている"
      aria-pressed={held}
      className={`inline-flex items-center gap-1.5 text-sm transition ${
        held ? 'text-[#3D4F6B]' : 'text-gray-600 hover:text-[#3D4F6B]'
      } disabled:cursor-default`}
    >
      <span
        aria-hidden="true"
        className={`text-base leading-none transition-transform ${
          pending ? 'animate-pulse' : held ? 'scale-110' : ''
        }`}
      >
        🤔
      </span>
      {count > 0 && <span className="text-xs tabular-nums">{count}</span>}
    </button>
  );
}
