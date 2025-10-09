import Link from "next/link";
import { cookies } from "next/headers";
import { parseSessionToken } from "@/lib/auth";
import { supabase } from "@/lib/supabase";

interface QuestionCard {
  id: string;
  content: string;
  created_at: string;
}

async function fetchQuestions(): Promise<{
  envReady: boolean;
  items: QuestionCard[];
  error?: string;
}> {
  const envReady =
    !!process.env.NEXT_PUBLIC_SUPABASE_URL && !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!envReady) {
    return { envReady, items: [] };
  }

  try {
    const { data, error } = await supabase
      .from("questions")
      .select("id, content, created_at, archived")
      .eq("archived", false)
      .order("created_at", { ascending: false })
      .limit(8);
    if (error) throw error;
    return {
      envReady,
      items: (data ?? []).map((row) => ({
        id: row.id as string,
        content: (row.content as string) ?? "",
        created_at: row.created_at as string,
      })),
    };
  } catch (err) {
    return {
      envReady,
      items: [],
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

const MONTH_LINKS = ["2025/10", "2025/9", "2025/8", "2025/7", "2025/6"];

export default async function Home() {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get("qd_session")?.value;
  const session = parseSessionToken(sessionCookie);
  const { envReady, items, error } = await fetchQuestions();

  const placeholders = Array.from({ length: Math.max(8 - items.length, 0) });

  const supabaseStatus = envReady ? (error ? "error" : "ok") : "missing";
  const showDemoTokens =
    process.env.ENABLE_DEMO_TOKENS === "true" ||
    process.env.NEXT_PUBLIC_ENABLE_DEMO_TOKENS === "true" ||
    process.env.NODE_ENV !== "production";

  return (
    <div className="min-h-screen border-4 border-purple-400 bg-white text-black relative overflow-hidden">
      <header className="flex items-center justify-between px-6 py-5 border-b border-gray-200">
        <span className="text-lg font-semibold tracking-wide">Questions Display</span>
        <div className="flex flex-wrap items-center gap-3 text-sm">
          <span className="rounded-full border border-black px-3 py-1 bg-white/80">
            Role: {session?.role ?? "none"}
          </span>
          {showDemoTokens && !session ? (
            <>
              <Link className="underline" href="/auth/qr?token=demo-viewer">
                demo-viewer
              </Link>
              <Link className="underline" href="/auth/qr?token=demo-moderator">
                demo-moderator
              </Link>
              <Link className="underline" href="/auth/qr?token=demo-admin">
                demo-admin
              </Link>
            </>
          ) : null}
          {session ? (
            <Link className="underline" href="/logout">
              logout
            </Link>
          ) : !showDemoTokens ? (
            <span className="text-gray-500">QR でアクセスしてください</span>
          ) : null}
          <Link className="underline" href="/admin/review">
            review
          </Link>
          <Link className="underline" href="/admin/logs">
            logs
          </Link>
        </div>
      </header>

      <aside className="hidden md:flex flex-col gap-5 items-end text-right text-sm font-medium absolute top-28 right-6">
        {MONTH_LINKS.map((label) => (
          <span key={label} className="hover:underline cursor-default">
            {label}
          </span>
        ))}
      </aside>

      <main className="flex flex-col items-center px-6 pb-16">
        <section className="w-full flex flex-col items-center gap-10 py-16">
          <div className="text-[120px] sm:text-[160px] font-bold leading-none">Q</div>
          <Link
            href="/ask"
            className="px-10 py-3 bg-[#FAD55A] text-black font-semibold rounded-md shadow-sm hover:bg-[#f7c93a] transition"
          >
            Reach out!
          </Link>
          <div className="text-xs flex gap-3 text-gray-600">
            <span className="inline-flex items-center gap-1 rounded-full border border-gray-300 px-3 py-1">
              <span className="font-semibold">ENV</span>
              <span>{envReady ? "ok" : "missing"}</span>
            </span>
            <span className="inline-flex items-center gap-1 rounded-full border border-gray-300 px-3 py-1">
              <span className="font-semibold">Supabase</span>
              <span>{supabaseStatus}</span>
            </span>
          </div>
          <div className="w-11/12 max-w-4xl border-t border-gray-300" />
        </section>

        <section className="w-full max-w-5xl">
          <h2 className="text-3xl font-bold text-center mb-10 tracking-wide">Questions</h2>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {items.map((item) => (
              <article
                key={item.id}
                className="relative aspect-square rounded-[32px] border border-black/70 p-6 flex flex-col justify-between bg-white"
              >
                <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-2xl">?</div>
                <div className="text-sm leading-relaxed whitespace-pre-wrap break-words overflow-hidden">
                  {item.content}
                </div>
                <span className="text-xs text-gray-500 self-end">
                  {new Date(item.created_at).toLocaleDateString()}
                </span>
              </article>
            ))}
            {placeholders.map((_, idx) => (
              <div
                key={`placeholder-${idx}`}
                className="relative aspect-square rounded-[32px] border border-black/30 flex items-center justify-center text-2xl text-gray-300"
              >
                <span className="absolute -top-6 left-1/2 -translate-x-1/2 text-2xl text-gray-400">?</span>
              </div>
            ))}
          </div>
          {error ? (
            <p className="mt-6 text-sm text-center text-amber-700">
              Supabase の取得でエラーが発生しました: {error}
            </p>
          ) : null}
        </section>
      </main>
    </div>
  );
}
