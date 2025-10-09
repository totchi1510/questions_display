import { cookies } from 'next/headers';
import { parseSessionToken } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export const dynamic = 'force-dynamic';

interface LogEntry {
  id: number;
  action: string;
  actor_role: string;
  question_id: string | null;
  details: Record<string, unknown> | null;
  created_at: string;
}

export default async function LogsPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = (await searchParams) ?? {};
  const cookieStore = await cookies();
  const token = cookieStore.get('qd_session')?.value;
  const session = parseSessionToken(token);
  const role = session?.role;

  if (!role || (role !== 'moderator' && role !== 'admin')) {
    return (
      <div className="p-6">
        <p>権限がありません（moderator / admin が必要です）</p>
      </div>
    );
  }

  const action = typeof params.action === 'string' ? params.action : undefined;
  const actorRole = typeof params.role === 'string' ? params.role : undefined;
  const afterParam = typeof params.after === 'string' ? params.after : undefined;

  let afterIso: string | undefined;
  if (afterParam) {
    const parsed = new Date(afterParam);
    if (!Number.isNaN(parsed.valueOf())) {
      afterIso = parsed.toISOString();
    }
  }

  let logs: LogEntry[] = [];
  let errorMsg: string | null = null;
  try {
    const query = supabaseAdmin
      .from('moderation_logs')
      .select('id, action, actor_role, question_id, details, created_at')
      .order('created_at', { ascending: false })
      .limit(100);

    if (action) query.eq('action', action);
    if (actorRole) query.eq('actor_role', actorRole);
    if (afterIso) query.gte('created_at', afterIso);

    const { data, error } = await query;
    if (error) throw error;
    logs = (data ?? []) as LogEntry[];
  } catch {
    errorMsg = 'ログ取得に失敗しました（admin 設定の確認が必要です）';
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-xl font-semibold mb-4">Moderation Logs</h1>
      <p className="text-sm text-gray-600 mb-4">
        クエリパラメータでフィルタ: `action=queue|approve|reject|delete|restore`、`role=moderator|admin`、`after=YYYY-MM-DD`
      </p>
      {errorMsg ? (
        <p className="text-amber-600">{errorMsg}</p>
      ) : (
        <ul className="space-y-2">
          {logs.map((log) => (
            <li key={log.id} className="border rounded p-3">
              <div className="flex flex-wrap justify-between gap-2 text-sm">
                <div>
                  <div className="text-xs text-gray-500">{new Date(log.created_at).toLocaleString()}</div>
                  <div>
                    action: <span className="font-semibold">{log.action}</span>
                  </div>
                  <div>actor_role: {log.actor_role}</div>
                  <div>question_id: {log.question_id ?? '—'}</div>
                </div>
                <div className="text-xs bg-gray-50 border rounded p-2 max-w-xl whitespace-pre-wrap break-all">
                  {JSON.stringify(log.details ?? {}, null, 2)}
                </div>
              </div>
            </li>
          ))}
          {logs.length === 0 && <li className="text-sm">ログがありません</li>}
        </ul>
      )}
    </div>
  );
}
