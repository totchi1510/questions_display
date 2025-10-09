import Link from "next/link";
import { cookies } from "next/headers";
import { parseSessionToken } from "@/lib/auth";
import { supabase } from "@/lib/supabase";

/* =========================
 * Types
 * =======================*/
type QuestionCard = {
  id: string;
  content: string;
  created_at: string;
};

/* =========================
 * Constants (UI保持)
 * =======================*/
const MONTH_LINKS = ["2025/10", "2025/9", "2025/8", "2025/7", "2025/6"] as const;

/* =========================
 * Helpers (UI保持のまま整理)
 * =======================*/
function QuestionTile({ item }: { item: QuestionCard }) {
  return (
    <article className="relative aspect-square rounded-[32px] border border-black/70 p-6 flex flex-col justify-between bg-white shadow-sm shadow-yellow-200/30">
      <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-2xl">?</div>
      <div className="text-sm leading-relaxed whitespace-pre-wrap break-words overflow-hidden">
        {item.content}
      </div>
      <span className="text-xs text-gray-500 self-end">
        {new Date(item.created_at).toLocaleDateString()}
      </span>
    </article>
  );
}

function PlaceholderTile({ idx }: { idx: number }) {
  return (
    <div
      key={`placeholder-${idx}`}
      className="relative aspect-square rounded-[32px] border border-black/30 flex items-center justify-center text-2xl text-gray-300 bg-white/60"
    >
      <span className="absolute -top-6 left-1/2 -translate-x-1/2 text-2xl text-gray-400">?</span>
    </div>
  );
}

function QuestionLetter({ className = "" }: { className?: string }) {
  return (
    <div className={`relative inline-block leading-none ${className}`} aria-hidden="true">
      {/* ごく控えめな黄色オフセット */}
      <span
        className="absolute inset-0 -translate-x-[5.0px] translate-y-[5.0px] text-[#FAD55A] opacity-80 blur-[0.2px] select-none"
        aria-hidden="true"
      >
        Q
      </span>
      {/* 本体（黒） */}
      <span
        className="relative text-black drop-shadow-[0_3px_8px_rgba(0,0,0,0.18)] select-none"
      >
        Q
      </span>
    </div>
  );
}



/* =========================
 * Data fetching
 * =======================*/
async function fetchQuestions(): Promise<{
  envReady: boolean;
  items: QuestionCard[];
  error?: string;
}> {
  const envReady = Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
  if (!envReady) return { envReady, items: [] };

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
      items:
        (data ?? []).map((row) => ({
          id: String(row.id),
          content: String(row.content ?? ""),
          created_at: String(row.created_at),
        })) ?? [],
    };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return { envReady, items: [], error: msg };
  }
}

/* =========================
 * Page
 * =======================*/
export default async function Home() {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get("qd_session")?.value;
  const session = parseSessionToken(sessionCookie);

  const { items, error } = await fetchQuestions();
  const placeholdersCount = Math.max(8 - items.length, 0);
    const showDemoTokens = process.env.ENABLE_DEMO_TOKENS === "true" || process.env.NEXT_PUBLIC_ENABLE_DEMO_TOKENS === "true";

  return (
    <div className="min-h-screen border-4 border-purple-400 bg-gradient-to-b from-white via-[#FFF7D6] to-white text-black relative overflow-hidden">
      {/* Header（色・配置を維持） */}
      <header className="flex items-center justify-between px-6 py-5 border-b border-gray-200 backdrop-blur-sm bg-white/70">
        <span className="text-lg font-semibold tracking-wide">Questions Display</span>
        <div className="flex flex-wrap items-center gap-3 text-sm">
          <span className="rounded-full border border-black px-3 py-1 bg-white/90 shadow-sm">
            Role: {session?.role ?? "none"}
          </span>

          {!session && showDemoTokens && (
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
          )}

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

      {/* Right month list（配置/色そのまま） */}
      <aside className="hidden md:flex flex-col gap-5 items-end text-right text-sm font-medium absolute top-28 right-6 text-gray-600">
        {MONTH_LINKS.map((label) => (
          <span key={label} className="hover:underline cursor-default">
            {label}
          </span>
        ))}
      </aside>

      <main className="flex flex-col items-center px-6 pb-24">
        {/* Hero（配置・色は維持、「Q」をSVGに変更／人型なし） */}
        <section className="w-full max-w-5xl flex flex-col items-center gap-8 py-16 text-center">
          <div className="space-y-4">
            <h1 className="text-4xl sm:text-5xl font-extrabold tracking-wide">問いのディスプレイ</h1>
            <p className="max-w-2xl mx-auto text-sm sm:text-base text-gray-600">
              AI時代、問いを囲む対話から私たちは何に気づけるのか。
            </p>
          </div>

          <div className="relative flex items-center justify-center h-52 w-52 sm:h-64 sm:w-64">
            <QuestionLetter className="text-[108px] sm:text-[140px] font-extrabold tracking-tight" />
          </div>


          <Link
            href="/ask"
            className="px-12 py-3 bg-[#FAD55A] text-black font-semibold rounded-full shadow-md hover:shadow-lg hover:bg-[#f7c93a] transition"
          >
            問いを投稿する
          </Link>

          <div className="w-full max-w-3xl border-b border-dashed border-gray-400" />
        </section>

        {/* Questions（UI据え置き） */}
        <section className="w-full max-w-5xl">
          <h2 className="text-3xl font-bold text-center mb-10 tracking-wide">問い</h2>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {items.map((item) => (
              <QuestionTile key={item.id} item={item} />
            ))}
            {Array.from({ length: placeholdersCount }).map((_, idx) => (
              <PlaceholderTile key={idx} idx={idx} />
            ))}
          </div>

          {error && (
            <p className="mt-6 text-sm text-center text-amber-700">
              Supabase の取得でエラーが発生しました: {error}
            </p>
          )}
        </section>

        {/* 制作の背景（文章ベースに簡潔化。色・配置は前と同等） */}
        <section className="w-full max-w-4xl mt-20 text-center space-y-6">
          <h3 className="text-2xl sm:text-3xl font-bold tracking-wide">制作の背景</h3>

          <h4 className="text-lg sm:text-xl font-semibold">きっかけ</h4>
          <p className="text-sm sm:text-base leading-relaxed text-gray-700 text-left">
            私たちはとある交流会にて「問い」壁一面に掲げる場を訪れました。そこで問いから人々が自然に対話を始める光景を目の当たりにしました。
            また、北欧の教育・研究者の方々との対話を通じて、分野横断・低ヒエラルキー・透明性を重んじる創造の姿勢に触れることもできました。
            さらに、学生が課題を自分ごととして捉え、主体的に行動する姿に強い刺激を受けました。
            これらの体験を通じて、当サイトを「問い」を起点に対話と実験を重ねる場として立ち上げたいと考えるに至りました。
          </p>

          <h4 className="text-lg sm:text-xl font-semibold mt-4">コンセプト</h4>
          <div className="grid sm:grid-cols-2 gap-6 text-left text-sm text-gray-700">
            <div className="rounded-2xl border border-black/20 bg-white/85 p-5 shadow-sm">
              <p>
                <span className="font-semibold">問いは場をつくる：</span>
                掲げられた問いが、即興の対話と着想を生みます。
              </p>
            </div>
            <div className="rounded-2xl border border-black/20 bg-white/85 p-5 shadow-sm">
              <p>
                <span className="font-semibold">主体性は問いから育つ：</span>
                自分の言葉で問うことが、新しい挑戦を引き出します。
              </p>
            </div>
          </div>

          <h4 className="text-lg sm:text-xl font-semibold mt-4">このサイトでやること</h4>
          <div className="grid sm:grid-cols-2 gap-6 text-left text-sm text-gray-700">
            <div className="rounded-2xl border border-black/20 bg-white/85 p-5 shadow-sm">
              <p>
                <span className="font-semibold">問いを可視化：</span>
                誰もが考え・語れる起点をつくります。
              </p>
            </div>
            <div className="rounded-2xl border border-black/20 bg-white/85 p-5 shadow-sm">
              <p>
                <span className="font-semibold">不確実性を歓迎：</span>
                偶然の出会い、対話から次の一歩を生みます。
              </p>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
