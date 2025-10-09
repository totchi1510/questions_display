import Link from "next/link";

export const dynamic = "force-dynamic";

export default function AskPage() {
  return (
    <div className="min-h-screen border-4 border-purple-400 bg-white text-black flex flex-col items-center px-6 py-12">
      <h1 className="text-3xl sm:text-4xl font-bold tracking-wide mb-10">問いを投稿</h1>
      <form
        method="post"
        action="/ask/submit"
        className="w-full max-w-3xl flex flex-col gap-6"
      >
        <label htmlFor="content" className="text-sm font-medium text-gray-600">
          問いの内容
        </label>
        <div className="relative rounded-[32px] border border-black/60 bg-white shadow-sm">
          <span className="pointer-events-none absolute inset-0 flex items-center justify-center text-[140px] font-bold text-gray-200 select-none">
            Q
          </span>
          <textarea
            id="content"
            name="content"
            className="relative z-10 w-full h-72 sm:h-80 resize-none bg-transparent px-8 py-10 text-lg leading-relaxed focus:outline-none"
            placeholder="問いを書き込んでください"
            maxLength={2000}
            required
          />
        </div>
        <div className="flex items-center justify-between text-sm text-gray-500">
          <span>最大 2000 文字</span>
          <Link className="underline" href="/">
            一覧に戻る
          </Link>
        </div>
        <button
          type="submit"
          className="self-center px-12 py-3 bg-[#FAD55A] text-black font-semibold rounded-md shadow-sm hover:bg-[#f7c93a] transition"
        >
          投稿する
        </button>
      </form>
    </div>
  );
}
