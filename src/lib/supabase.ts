import { createClient, type SupabaseClient } from '@supabase/supabase-js';

let client: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient {
  if (client) return client;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    // Defer failures until actual usage to allow builds without secrets
    return new Proxy({} as SupabaseClient, {
      get() {
        throw new Error(
          'Supabase is not configured: set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY'
        );
      },
    }) as SupabaseClient;
  }

  client = createClient(url, key, { auth: { persistSession: false } });
  return client;
}

// Provide a lazily-resolving client that only initializes on first property access.
// This keeps importing modules safe during builds (no secrets) while preserving API shape.
export const supabase: SupabaseClient = new Proxy({} as SupabaseClient, {
  get(_target, prop, receiver) {
    const real = getSupabase() as unknown as Record<string | symbol, unknown>;
    return Reflect.get(real, prop, receiver);
  },
}) as SupabaseClient;
