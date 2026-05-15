import { supabase } from '@/lib/supabase';

export type QuestionTile = {
  id: string;
  content: string;
  created_at: string;
  think_count: number;
  talk_count: number;
  inspire_count: number;
};

function jstMonthStartUtc(d: Date = new Date()): string {
  const jstNow = new Date(d.getTime() + 9 * 60 * 60 * 1000);
  const startJstMs = Date.UTC(jstNow.getUTCFullYear(), jstNow.getUTCMonth(), 1, 0, 0, 0);
  return new Date(startJstMs - 9 * 60 * 60 * 1000).toISOString();
}

export async function fetchCurrentMonthQuestions(limit = 18): Promise<{
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
      .select(
        'id, content, created_at, published, archived, think_count, talk_count, inspire_count, total_reactions'
      )
      .eq('published', true)
      .eq('archived', false)
      .gte('created_at', startUtc)
      .order('total_reactions', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;

    const items: QuestionTile[] = (data ?? []).map((row) => ({
      id: String(row.id),
      content: String(row.content ?? ''),
      created_at: String(row.created_at),
      think_count: Number(row.think_count ?? 0),
      talk_count: Number(row.talk_count ?? 0),
      inspire_count: Number(row.inspire_count ?? 0),
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
