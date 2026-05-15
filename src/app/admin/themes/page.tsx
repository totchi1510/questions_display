import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getStaffRole } from '@/lib/staff';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export const dynamic = 'force-dynamic';

type ThemeRow = {
  id: string;
  label: string;
  description: string | null;
  active: boolean;
  created_at: string;
};

export default async function ThemesAdmin({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const staff = await getStaffRole();
  if (!staff) redirect('/login');

  const params = (await searchParams) ?? {};
  const flash = typeof params.flash === 'string' ? params.flash : null;

  let themes: ThemeRow[] = [];
  let errorMsg: string | null = null;
  try {
    const { data, error } = await supabaseAdmin
      .from('themes')
      .select('id, label, description, active, created_at')
      .order('created_at', { ascending: false });
    if (error) throw error;
    themes = (data ?? []) as ThemeRow[];
  } catch (e) {
    errorMsg = e instanceof Error ? e.message : '取得に失敗しました';
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-[#FFF7D6] to-white text-black px-6 py-12">
      <div className="max-w-3xl mx-auto">
        <header className="mb-8">
          <h1 className="text-2xl font-bold tracking-[0.3em]">テーマ管理</h1>
          <p className="mt-2 text-sm text-gray-600">
            掲示板の今月のテーマを切り替えます。アクティブなテーマは1つだけ。
          </p>
        </header>

        {flash === 'created' && (
          <p className="mb-6 text-sm text-green-700">新しいテーマを追加しました。</p>
        )}
        {flash === 'activated' && (
          <p className="mb-6 text-sm text-green-700">アクティブなテーマを変更しました。</p>
        )}
        {flash === 'err' && (
          <p className="mb-6 text-sm text-amber-700">操作に失敗しました。</p>
        )}
        {errorMsg && (
          <p className="mb-6 text-sm text-amber-700">エラー: {errorMsg}</p>
        )}

        <section className="mb-10">
          <h2 className="text-sm font-semibold tracking-wider mb-3">新しいテーマを追加</h2>
          <form
            action="/admin/themes/create"
            method="post"
            className="rounded-2xl border border-black/15 bg-white/80 p-5 space-y-3"
          >
            <div>
              <label className="text-xs text-gray-600 block mb-1">タイトル(必須)</label>
              <input
                type="text"
                name="label"
                required
                maxLength={120}
                className="w-full rounded-lg border border-black/20 px-3 py-2 text-sm focus:outline-none focus:border-black/60"
                placeholder="例: わたしと他者"
              />
            </div>
            <div>
              <label className="text-xs text-gray-600 block mb-1">説明(任意)</label>
              <textarea
                name="description"
                maxLength={400}
                rows={2}
                className="w-full rounded-lg border border-black/20 px-3 py-2 text-sm focus:outline-none focus:border-black/60 resize-none"
                placeholder="一文程度の補足"
              />
            </div>
            <div className="flex items-center gap-3 pt-1">
              <label className="text-xs inline-flex items-center gap-1.5">
                <input type="checkbox" name="activate" defaultChecked />
                追加と同時にアクティブにする
              </label>
              <button
                type="submit"
                className="ml-auto px-5 py-2 bg-[#FAD55A] text-black font-semibold rounded-md text-sm hover:bg-[#f7c93a] transition"
              >
                追加する
              </button>
            </div>
          </form>
        </section>

        <section>
          <h2 className="text-sm font-semibold tracking-wider mb-3">既存のテーマ</h2>
          {themes.length === 0 ? (
            <p className="text-sm text-gray-500">まだテーマが登録されていません。</p>
          ) : (
            <ul className="space-y-3">
              {themes.map((t) => (
                <li
                  key={t.id}
                  className={`rounded-2xl border p-4 ${
                    t.active ? 'border-[#FAD55A] bg-[#FFFAEA]' : 'border-black/15 bg-white/70'
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <p className="font-semibold">
                        {t.label}
                        {t.active && (
                          <span className="ml-2 inline-block px-2 py-0.5 rounded-full bg-[#FAD55A] text-[10px] tracking-wider align-middle">
                            ACTIVE
                          </span>
                        )}
                      </p>
                      {t.description && (
                        <p className="mt-1 text-sm text-gray-700">{t.description}</p>
                      )}
                      <p className="mt-2 text-[11px] text-gray-500">
                        作成: {new Date(t.created_at).toLocaleString('ja-JP')}
                      </p>
                    </div>
                    {!t.active && (
                      <form action="/admin/themes/activate" method="post">
                        <input type="hidden" name="id" value={t.id} />
                        <button
                          type="submit"
                          className="text-xs px-3 py-1.5 rounded-full border border-black/40 hover:bg-black hover:text-white transition"
                        >
                          アクティブにする
                        </button>
                      </form>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        <div className="mt-10 text-center text-sm space-x-6">
          <Link className="underline text-gray-500" href="/">
            ← 問い一覧に戻る
          </Link>
          <Link className="underline text-gray-500" href="/admin/review">
            review へ
          </Link>
        </div>
      </div>
    </div>
  );
}
