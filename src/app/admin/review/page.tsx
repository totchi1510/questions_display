import { cookies } from 'next/headers';
import { parseSessionToken } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export const dynamic = 'force-dynamic';

export default async function ReviewPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get('qd_session')?.value;
  const session = parseSessionToken(token);
  const role = session?.role;

  if (!role || (role !== 'moderator' && role !== 'admin')) {
    return (
      <div className="p-6">
        <p>権限がありません（moderator/admin が必要です）。</p>
      </div>
    );
  }

  let items: { id: string; question_id: string; reason: string; status: string; created_at: string }[] = [];
  let errorMsg: string | null = null;
  try {
    const { data, error } = await supabaseAdmin
      .from('pending_reviews')
      .select('id, question_id, reason, status, created_at')
      .order('created_at', { ascending: false })
      .limit(50);
    if (error) throw error;
    items = (data ?? []) as { id: string; question_id: string; reason: string; status: string; created_at: string }[];
  } catch {
    errorMsg = 'データ取得に失敗しました（admin設定未構成の可能性）。';
  }

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h1 className="text-xl font-semibold mb-4">Pending Reviews</h1>
      {errorMsg ? (
        <p className="text-amber-600">{errorMsg}</p>
      ) : (
        <ul className="space-y-2">
          {items.map((it) => (
            <li key={it.id} className="border rounded p-3">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <div className="text-xs text-gray-500">{new Date(it.created_at).toLocaleString()}</div>
                  <div className="text-sm">question_id: {it.question_id}</div>
                  <div className="text-sm">reason: {it.reason}</div>
                  <div className="text-sm">status: {it.status}</div>
                </div>
                <div className="flex items-center gap-2">
                  <form method="post" action="/admin/review/approve">
                    <input type="hidden" name="id" value={it.id} />
                    <button className="px-3 py-1 rounded bg-green-600 text-white text-sm" type="submit">Approve</button>
                  </form>
                  <form method="post" action="/admin/review/reject">
                    <input type="hidden" name="id" value={it.id} />
                    <button className="px-3 py-1 rounded bg-red-600 text-white text-sm" type="submit">Reject</button>
                  </form>
                </div>
              </div>
            </li>
          ))}
          {items.length === 0 && <li className="text-sm">レビュー待ちなし</li>}
        </ul>
      )}
    </div>
  );
}
