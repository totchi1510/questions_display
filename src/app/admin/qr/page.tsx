import Link from 'next/link';
import { cookies } from 'next/headers';
import { parseSessionToken } from '@/lib/auth';
import { listTokens } from '@/lib/qrTokens';

export const dynamic = 'force-dynamic';

function siteUrl() {
  return (
    process.env.NEXT_PUBLIC_SITE_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000')
  );
}

export default async function AdminQrPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = (await searchParams) ?? {};
  const cookieStore = await cookies();
  const session = parseSessionToken(cookieStore.get('qd_session')?.value);
  const role = session?.role;
  if (role !== 'admin') {
    return (
      <div className="p-6">
        <p>権限がありません（admin が必要です）</p>
      </div>
    );
  }

  const issuedRaw = typeof params.raw === 'string' ? params.raw : undefined;
  const issuedRole = typeof params.issuedRole === 'string' ? params.issuedRole : undefined;
  const tokens = await listTokens();

  const newAccessUrl = issuedRaw ? `${siteUrl()}/auth/qr?token=${issuedRaw}` : null;
  const qrSrc = newAccessUrl
    ? `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(newAccessUrl)}`
    : null;

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h1 className="text-xl font-semibold mb-6">QR Tokens</h1>

      {newAccessUrl && (
        <div className="mb-8 p-5 border rounded-2xl bg-yellow-50 border-yellow-200">
          <p className="text-sm mb-2">
            新しい <strong>{issuedRole}</strong> トークンを発行しました。
            この URL／QR は一度しか表示されません。
          </p>
          <p className="text-xs break-all mb-3 font-mono bg-white p-2 rounded border">
            {newAccessUrl}
          </p>
          {qrSrc && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={qrSrc} alt="新規 QR" width={240} height={240} className="bg-white p-2 rounded" />
          )}
        </div>
      )}

      <section className="mb-10">
        <h2 className="text-sm font-semibold mb-2">新規発行</h2>
        <form method="post" action="/admin/qr/create" className="flex flex-wrap gap-3 items-end">
          <label className="text-sm">
            ロール
            <select name="role" className="block mt-1 border rounded px-2 py-1">
              <option value="viewer">viewer</option>
              <option value="moderator">moderator</option>
              <option value="admin">admin</option>
            </select>
          </label>
          <label className="text-sm">
            有効日数
            <input
              name="ttlDays"
              type="number"
              defaultValue={30}
              min={1}
              max={365}
              className="block mt-1 border rounded px-2 py-1 w-24"
            />
          </label>
          <button type="submit" className="px-4 py-2 rounded bg-slate-700 text-white text-sm">
            発行
          </button>
        </form>
      </section>

      <section>
        <h2 className="text-sm font-semibold mb-2">発行済みトークン</h2>
        {tokens.length === 0 ? (
          <p className="text-sm text-gray-500">まだ発行されていません</p>
        ) : (
          <ul className="space-y-2">
            {tokens.map((t) => {
              const isExpired = new Date(t.expires_at).getTime() <= Date.now();
              const isRevoked = !!t.revoked_at;
              const status = isRevoked ? 'revoked' : isExpired ? 'expired' : 'active';
              return (
                <li key={t.id} className="border rounded p-3 text-sm flex flex-wrap items-start gap-2">
                  <div className="flex-1 min-w-[200px]">
                    <div className="font-semibold">{t.role}</div>
                    <div className="text-xs text-gray-500">
                      hash: <span className="font-mono">{t.hash.slice(0, 12)}…</span>
                    </div>
                    <div className="text-xs text-gray-500">
                      expires: {new Date(t.expires_at).toLocaleString()}
                    </div>
                    {t.used_at && (
                      <div className="text-xs text-gray-500">
                        used: {new Date(t.used_at).toLocaleString()}
                      </div>
                    )}
                  </div>
                  <span
                    className={
                      'text-xs px-2 py-1 rounded ' +
                      (status === 'active'
                        ? 'bg-green-100 text-green-700'
                        : status === 'expired'
                        ? 'bg-gray-100 text-gray-600'
                        : 'bg-red-100 text-red-700')
                    }
                  >
                    {status}
                  </span>
                  {status === 'active' && (
                    <form method="post" action="/admin/qr/revoke">
                      <input type="hidden" name="id" value={t.id} />
                      <button type="submit" className="text-xs underline text-red-700">
                        失効
                      </button>
                    </form>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <div className="mt-10 text-sm">
        <Link href="/admin/review" className="underline text-gray-500">
          ← review に戻る
        </Link>
      </div>
    </div>
  );
}
