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
const PERSON_POSITIONS = [
  "-top-4 left-1/2 -translate-x-1/2",
  "top-6 -left-6",
  "top-6 -right-6",
  "-bottom-4 left-6",
  "-bottom-4 right-6",
];

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
    <div className="min-h-screen border-4 border-purple-400 bg-gradient-to-b from-white via-[#FFF7D6] to-white text-black relative overflow-hidden">
      <header className="flex items-center justify-between px-6 py-5 border-b border-gray-200 backdrop-blur-sm bg-white/70">
        <span className="text-lg font-semibold tracking-wide">Questions Display</span>
        <div className="flex flex-wrap items-center gap-3 text-sm">
          <span className="rounded-full border border-black px-3 py-1 bg-white/90 shadow-sm">
            Role: {session?.role ?? "none"}
          </span>
          {!session && showDemoTokens ? (
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

      <aside className="hidden md:flex flex-col gap-5 items-end text-right text-sm font-medium absolute top-28 right-6 text-gray-600">
        {MONTH_LINKS.map((label) => (
          <span key={label} className="hover:underline cursor-default">
            {label}
          </span>
        ))}
      </aside>

      <main className="flex flex-col items-center px-6 pb-24">
        <section className="w-full max-w-5xl flex flex-col items-center gap-8 py-16 text-center">
          <div className="space-y-4">

            <h1 className="text-4xl sm:text-5xl font-extrabold tracking-wide">
              問いのディスプレイ
            </h1>
            <p className="max-w-2xl mx-auto text-sm sm:text-base text-gray-600">
              AI時代、問いを囲む人間同士の対話は私たちに何を気づかせる？
            </p>
          </div>

          <div className="relative flex items-center justify-center h-52 w-52 sm:h-64 sm:w-64">
            <div className="flex h-40 w-40 sm:h-48 sm:w-48 items-center justify-center rounded-full bg-[#FAD55A] text-black border-4 border-black shadow-[0_12px_30px_rgba(250,213,90,0.45)]">
              <span className="text-[90px] sm:text-[120px] font-extrabold leading-none">Q</span>
            </div>
            {PERSON_POSITIONS.map((pos) => (
              <div
                key={pos}
                className={`absolute ${pos} flex flex-col items-center gap-1 text-[10px] sm:text-xs text-gray-700`}
              >
                <span className="flex items-center justify-center h-6 w-6 sm:h-7 sm:w-7 rounded-full bg-white border-2 border-black shadow-sm">
                  💬
                </span>
                <span className="h-6 w-[2px] bg-black" />
                <span className="h-2 w-3 rounded-t-full border-t-2 border-black" />
              </div>
            ))}
          </div>

          <Link
            href="/ask"
            className="px-12 py-3 bg-[#FAD55A] text-black font-semibold rounded-full shadow-md hover:shadow-lg hover:bg-[#f7c93a] transition"
          >
            Reach out!
          </Link>

          <div className="text-xs flex gap-3 text-gray-600">
            <span className="inline-flex items-center gap-1 rounded-full border border-gray-300 px-3 py-1 bg-white/70">
              <span className="font-semibold">ENV</span>
              <span>{envReady ? "ok" : "missing"}</span>
            </span>
            <span className="inline-flex items-center gap-1 rounded-full border border-gray-300 px-3 py-1 bg-white/70">
              <span className="font-semibold">Supabase</span>
              <span>{supabaseStatus}</span>
            </span>
          </div>

          <div className="w-full max-w-3xl border-b border-dashed border-gray-400" />
        </section>

        <section className="w-full max-w-5xl">
          <h2 className="text-3xl font-bold text-center mb-10 tracking-wide">Questions</h2>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {items.map((item) => (
              <article
                key={item.id}
                className="relative aspect-square rounded-[32px] border border-black/70 p-6 flex flex-col justify-between bg-white shadow-sm shadow-yellow-200/30"
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
                className="relative aspect-square rounded-[32px] border border-black/30 flex items-center justify-center text-2xl text-gray-300 bg-white/60"
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

        <section className="w-full max-w-4xl mt-20 text-center space-y-6">
          <h3 className="text-2xl sm:text-3xl font-bold tracking-wide">Why Q Exists</h3>
          <p className="text-sm sm:text-base leading-relaxed text-gray-700">
            ある日、教室のすみっこで出会った小さな「?」が、誰にも拾われないまま置き去りに
            なっていました。<br className="hidden sm:block" />
            それを拾い上げた仲間たちが「問いこそ次の創造を呼び込む火種だ」と信じ、
            ひとりの声がみんなの対話につながる場所をつくろう──そんな想いで Q は生まれました。
          </p>
          <div className="grid sm:grid-cols-3 gap-6 text-left text-sm text-gray-600">
            <div className="rounded-2xl border border-black/20 bg-white/85 p-5 shadow-sm">
              <h4 className="text-lg font-semibold mb-2 text-black">Spark</h4>
              <p>思いついた瞬間の“なんでだろう？”を逃さず灯に変える。</p>
            </div>
            <div className="rounded-2xl border border-black/20 bg-white/85 p-5 shadow-sm">
              <h4 className="text-lg font-semibold mb-2 text-black">Circle</h4>
              <p>問いを囲んで語り合うことで、孤独な疑問が共同の冒険になる。</p>
            </div>
            <div className="rounded-2xl border border-black/20 bg-white/85 p-5 shadow-sm">
              <h4 className="text-lg font-semibold mb-2 text-black">Momentum</h4>
              <p>集まった答えがまた次の問いを呼び、学びのサイクルが続いていく。</p>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
