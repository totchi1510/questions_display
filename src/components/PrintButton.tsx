'use client';

type Props = {
  className?: string;
};

export default function PrintButton({ className = '' }: Props) {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      aria-label="この掲示板を PDF として保存"
      title="PDF として保存(印刷ダイアログで「送信先: PDF に保存」「余白: なし」「背景のグラフィック: ON」を選ぶと端まで綺麗に出力されます)"
      className={`no-print inline-flex items-center gap-1.5 rounded-full border border-black/20 bg-white/80 hover:bg-white px-4 py-1.5 text-sm text-gray-700 shadow-sm transition ${className}`}
    >
      <span aria-hidden="true">📄</span>
      <span>PDFで保存</span>
    </button>
  );
}
