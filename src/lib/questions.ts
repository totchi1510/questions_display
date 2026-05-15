import { supabase } from '@/lib/supabase';

export type QuestionTile = {
  id: string;
  content: string;
  created_at: string;
  hold_count: number;
  position_x: number;
  position_y: number;
};

function jstMonthStartUtc(d: Date = new Date()): string {
  const jstNow = new Date(d.getTime() + 9 * 60 * 60 * 1000);
  const startJstMs = Date.UTC(jstNow.getUTCFullYear(), jstNow.getUTCMonth(), 1, 0, 0, 0);
  return new Date(startJstMs - 9 * 60 * 60 * 1000).toISOString();
}

export async function fetchCurrentMonthQuestions(limit = 24): Promise<{
  envReady: boolean;
  items: QuestionTile[];
  error?: string;
}> {
  const envReady = Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
  if (!envReady) return { envReady, items: [] };

  const startUtc = jstMonthStartUtc();
  try {
    const { data, error } = await supabase
      .from('questions')
      .select('id, content, created_at, published, archived, hold_count, position_x, position_y')
      .eq('published', true)
      .eq('archived', false)
      .gte('created_at', startUtc)
      .order('hold_count', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;

    const items: QuestionTile[] = (data ?? []).map((row) => ({
      id: String(row.id),
      content: String(row.content ?? ''),
      created_at: String(row.created_at),
      hold_count: Number(row.hold_count ?? 0),
      position_x: Number(row.position_x ?? 50),
      position_y: Number(row.position_y ?? 50),
    }));
    return { envReady, items };
  } catch (e) {
    return { envReady, items: [], error: e instanceof Error ? e.message : String(e) };
  }
}

export function currentMonthLabelJST(d: Date = new Date()): string {
  const jst = new Date(d.getTime() + 9 * 60 * 60 * 1000);
  return `${jst.getUTCFullYear()}年${jst.getUTCMonth() + 1}月`;
}
