type Props = {
  questionId: string;
  count: number;
};

export default function HoldButton({ questionId, count }: Props) {
  return (
    <form method="post" action="/hold" className="inline-flex">
      <input type="hidden" name="question_id" value={questionId} />
      <button
        type="submit"
        title="この問いを考えている"
        aria-label="この問いを考えている"
        className="inline-flex items-center gap-1.5 text-sm text-gray-600 hover:text-[#3D4F6B] transition"
      >
        <span aria-hidden="true" className="text-base leading-none">🤔</span>
        {count > 0 && <span className="text-xs tabular-nums">{count}</span>}
      </button>
    </form>
  );
}
