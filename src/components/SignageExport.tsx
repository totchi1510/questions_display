'use client';

import { useState } from 'react';

/** Output dimensions for the signage image. */
const OUT_WIDTH = 1920;

/**
 * Exports the board as an exact 1920×1080 PNG, independent of the browser's
 * print settings (which were producing wrong-aspect PDFs). It captures the
 * on-screen 16:9 `.board-stage` and scales it up to full-HD via pixelRatio.
 */
export default function SignageExport() {
  const [busy, setBusy] = useState(false);

  const onClick = async () => {
    const stage = document.querySelector<HTMLElement>('.board-stage');
    if (!stage || busy) return;
    setBusy(true);
    try {
      const { toPng } = await import('html-to-image');
      const rect = stage.getBoundingClientRect();
      // The stage is locked to 16:9, so scaling width to 1920 yields 1080 tall.
      const pixelRatio = OUT_WIDTH / rect.width;
      const dataUrl = await toPng(stage, {
        pixelRatio,
        cacheBust: true,
        backgroundColor: '#ffffff',
        // Drop on-screen-only chrome (zoom controls, this button, attribution).
        filter: (node) => {
          if (!(node instanceof HTMLElement)) return true;
          const cl = node.classList;
          return !(
            cl?.contains('no-print') ||
            cl?.contains('react-flow__controls') ||
            cl?.contains('react-flow__attribution')
          );
        },
      });
      const a = document.createElement('a');
      a.download = 'questions-signage-1920x1080.png';
      a.href = dataUrl;
      a.click();
    } catch (e) {
      console.error('signage export failed', e);
      alert('画像の書き出しに失敗しました。もう一度お試しください。');
    } finally {
      setBusy(false);
    }
  };

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={busy}
      aria-label="サイネージ用に 1920×1080 の画像として保存"
      title="ズーム/位置を整えてから、現在の表示そのままを 1920×1080 の PNG 画像として保存します"
      className="no-print inline-flex items-center gap-1.5 rounded-full border border-black/20 bg-white/80 hover:bg-white px-4 py-1.5 text-sm text-gray-700 shadow-sm transition disabled:opacity-50 disabled:cursor-wait"
    >
      <span aria-hidden="true">🖼️</span>
      <span>{busy ? '書き出し中…' : '画像で保存 (1920×1080)'}</span>
    </button>
  );
}
