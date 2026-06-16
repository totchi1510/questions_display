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
      title="PDF として保存(印刷ダイアログから「PDF として保存」を選んでください)"
      className={`no-print inline-flex items-center gap-1.5 rounded-full border border-black/20 bg-white/80 hover:bg-white px-4 py-1.5 text-sm text-gray-700 shadow-sm transition ${className}`}
    >
      <span aria-hidden="true">📄</span>
      <span>PDFで保存</span>
    </button>
  );
}
