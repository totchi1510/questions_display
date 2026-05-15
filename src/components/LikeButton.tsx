type Props = {
  questionId: string;
  count: number;
};

export default function LikeButton({ questionId, count }: Props) {
  return (
    <form method="post" action="/like" className="inline-flex">
      <input type="hidden" name="question_id" value={questionId} />
      <button
        type="submit"
        className="inline-flex items-center gap-1 text-sm text-gray-600 hover:text-rose-500 transition"
        aria-label="この問いに共感する"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          className="h-4 w-4"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 21s-7-4.35-9.5-9.05A5.5 5.5 0 0 1 12 5.5a5.5 5.5 0 0 1 9.5 6.45C19 16.65 12 21 12 21z"
          />
        </svg>
        {count > 0 && <span>{count}</span>}
      </button>
    </form>
  );
}
