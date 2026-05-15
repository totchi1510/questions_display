import { redirect } from 'next/navigation';
import { getStaffRole } from '@/lib/staff';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export const dynamic = 'force-dynamic';

interface PendingItem {
  id: string;
  question_id: string;
  reason: string;
  status: string;
  created_at: string;
}

interface QuestionSnapshot {
  content: string;
  archived: boolean;
  archived_at: string | null;
}

export default async function ReviewPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = (await searchParams) ?? {};
  const staff = await getStaffRole();

  if (!staff) {
    redirect('/login');
  }

  let items: PendingItem[] = [];
  const questions = new Map<string, QuestionSnapshot>();
  let errorMsg: string | null = null;

  try {
    const stale = (typeof params.stale === 'string' ? params.stale : undefined) === '1';
    const query = supabaseAdmin
      .from('pending_reviews')
      .select('id, question_id, reason, status, created_at')
      .eq('status', 'pending')
      .order('created_at', { ascending: false });

    if (stale) {
      const threshold = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString();
      query.lt('created_at', threshold);
    }

    const { data, error } = await query.limit(50);
    if (error) throw error;
    items = (data ?? []) as PendingItem[];

    const qids = items.map((it) => it.question_id).filter(Boolean);
    if (qids.length > 0) {
      const { data: qrows, error: qerr } = await supabaseAdmin
        .from('questions')
        .select('id, content, archived, archived_at')
        .in('id', qids);
      if (qerr) throw qerr;
      for (const row of qrows ?? []) {
        questions.set(row.id as string, {
          content: (row.content as string) ?? '',
          archived: !!row.archived,
          archived_at: (row.archived_at as string | null) ?? null,
        });
      }
    }
  } catch {
    errorMsg = 'データ取得に失敗しました（admin 設定の確認が必要です）';
  }

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h1 className="text-xl font-semibold mb-2">Pending Reviews</h1>
      <div className="mb-4 text-sm flex gap-3 items-center">
        <a className="underline" href="/admin/review">
          全件（pending 最新順）
        </a>
        <a className="underline" href="/admin/review?stale=1">
          48h 超のみ
        </a>
        {staff.role === 'admin' && (
          <form method="post" action="/admin/rollover" className="ml-auto">
            <button
              type="submit"
              className="px-3 py-1 rounded bg-slate-700 text-white text-xs"
              title="前月分を archive_questions にスナップショット"
            >
              前月をアーカイブに退避
            </button>
          </form>
        )}
      </div>
      {errorMsg ? (
        <p className="text-amber-600">{errorMsg}</p>
      ) : (
        <ul className="space-y-2">
          {items.map((it) => {
            const question = questions.get(it.question_id);
            const content = question?.content ?? '';
            const preview = content ? content.slice(0, 160) : '（質問本文が見つかりません）';

            return (
              <li key={it.id} className="border rounded p-3">
                <div className="flex flex-col gap-2">
                  <div className="flex flex-wrap justify-between gap-2">
                    <div>
                      <div className="text-xs text-gray-500">{new Date(it.created_at).toLocaleString()}</div>
                      <div className="text-sm">question_id: {it.question_id}</div>
                      <div className="text-sm">reason: {it.reason}</div>
                      <div className="text-sm">status: {it.status}</div>
                      {question?.archived && (
                        <div className="text-xs text-amber-600">
                          archived: {question.archived_at ? new Date(question.archived_at).toLocaleString() : 'true'}
                        </div>
                      )}
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <form method="post" action="/admin/review/approve">
                        <input type="hidden" name="id" value={it.id} />
                        <button className="px-3 py-1 rounded bg-green-600 text-white text-sm" type="submit">
                          Approve
                        </button>
                      </form>
                      <form method="post" action="/admin/review/reject">
                        <input type="hidden" name="id" value={it.id} />
                        <button className="px-3 py-1 rounded bg-red-600 text-white text-sm" type="submit">
                          Reject
                        </button>
                      </form>
                      <form method="post" action="/admin/review/delete">
                        <input type="hidden" name="question_id" value={it.question_id} />
                        <button className="px-3 py-1 rounded bg-gray-800 text-white text-sm" type="submit">
                          Delete
                        </button>
                      </form>
                      {question?.archived && (
                        <form method="post" action="/admin/review/restore">
                          <input type="hidden" name="question_id" value={it.question_id} />
                          <button className="px-3 py-1 rounded bg-blue-600 text-white text-sm" type="submit">
                            Restore
                          </button>
                        </form>
                      )}
                    </div>
                  </div>
                  <div className="text-sm whitespace-pre-wrap border rounded bg-gray-50 p-2">
                    {preview}
                    {content.length > 160 ? '…' : ''}
                  </div>
                </div>
              </li>
            );
          })}
          {items.length === 0 && <li className="text-sm">レビュー対象がありません</li>}
        </ul>
      )}
    </div>
  );
}
