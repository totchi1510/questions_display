export const dynamic = 'force-dynamic';

export default function AskPage() {
  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="text-xl font-semibold mb-4">質問を投稿</h1>
      <form method="post" action="/ask/submit" className="flex flex-col gap-3">
        <textarea
          name="content"
          className="w-full min-h-32 p-2 border rounded"
          placeholder="質問内容を入力してください"
          maxLength={2000}
          required
        />
        <button
          type="submit"
          className="inline-flex items-center justify-center px-4 py-2 rounded bg-black text-white dark:bg-white dark:text-black"
        >
          送信
        </button>
      </form>
    </div>
  );
}
