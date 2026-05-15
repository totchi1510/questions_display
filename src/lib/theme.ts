import { supabase } from '@/lib/supabase';

export type Theme = {
  id: string;
  label: string;
  description: string | null;
  active: boolean;
};

/**
 * Returns the single active theme, or null if no theme is configured.
 * If multiple are marked active (shouldn't happen), the most recent wins.
 */
export async function fetchActiveTheme(): Promise<Theme | null> {
  const envReady = Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
  if (!envReady) return null;

  try {
    const { data, error } = await supabase
      .from('themes')
      .select('id, label, description, active')
      .eq('active', true)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error || !data) return null;
    return {
      id: String(data.id),
      label: String(data.label),
      description: data.description ? String(data.description) : null,
      active: Boolean(data.active),
    };
  } catch {
    return null;
  }
}
