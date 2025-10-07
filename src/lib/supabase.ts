// supabase.ts
import { createClient } from '@supabase/supabase-js';

let client = null;

export function getSupabase() {
  if (client) return client; // 既に生成済みなら再利用

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) throw new Error("環境変数が未設定です");

  client = createClient(url, key);
  return client;
}
