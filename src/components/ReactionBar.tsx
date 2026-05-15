type ReactionType = 'think' | 'talk' | 'inspire';

const REACTIONS: { type: ReactionType; emoji: string; label: string }[] = [
  { type: 'think', emoji: '💭', label: '考えさせられた' },
  { type: 'talk', emoji: '🗣', label: '誰かと話した' },
  { type: 'inspire', emoji: '✨', label: '自分の問いの種' },
];

type Props = {
  questionId: string;
  counts: { think: number; talk: number; inspire: number };
};

export default function ReactionBar({ questionId, counts }: Props) {
  return (
    <div className="flex gap-3 text-sm text-gray-500">
      {REACTIONS.map(({ type, emoji, label }) => (
        <form key={type} method="post" action="/react" className="inline-flex">
          <input type="hidden" name="question_id" value={questionId} />
          <input type="hidden" name="type" value={type} />
          <button
            type="submit"
            title={label}
            aria-label={label}
            className="inline-flex items-center gap-1 hover:text-black transition"
          >
            <span aria-hidden="true">{emoji}</span>
            {counts[type] > 0 && <span className="text-xs tabular-nums">{counts[type]}</span>}
          </button>
        </form>
      ))}
    </div>
  );
}
