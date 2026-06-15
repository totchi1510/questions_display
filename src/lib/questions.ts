import { supabase } from '@/lib/supabase';

export const MIN_WIDTH_PX = 140;
export const MAX_WIDTH_PX = 360;
export const DEFAULT_WIDTH_PX = 240;

export type QuestionTile = {
  id: string;
  content: string;
  created_at: string;
  hold_count: number;
  position_x: number;
  position_y: number;
  width_px: number;
  theme_id: string | null;
};

/** Theme filter: 'any' = no filter, 'free' = theme_id is null, string = specific theme id. */
export type ThemeFilter = 'any' | 'free' | string;

export function clampWidthPx(n: number): number {
  if (!Number.isFinite(n)) return DEFAULT_WIDTH_PX;
  return Math.max(MIN_WIDTH_PX, Math.min(MAX_WIDTH_PX, Math.round(n)));
}

/**
 * Final display width: poster-chosen baseline + a 🤔-reaction bonus
 * (capped so very popular notes don't dominate the wall).
 */
export function stickyWidthPx(widthPx: number, holdCount: number): number {
  const base = clampWidthPx(widthPx);
  const bonus = Math.min(60, holdCount * 6);
  return base + bonus;
}

function jstMonthStartUtc(d: Date = new Date()): string {
  const jstNow = new Date(d.getTime() + 9 * 60 * 60 * 1000);
  const startJstMs = Date.UTC(jstNow.getUTCFullYear(), jstNow.getUTCMonth(), 1, 0, 0, 0);
  return new Date(startJstMs - 9 * 60 * 60 * 1000).toISOString();
}

export async function fetchCurrentMonthQuestions(
  limit = 24,
  themeFilter: ThemeFilter = 'any'
): Promise<{
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
    let query = supabase
      .from('questions')
      .select(
        'id, content, created_at, published, archived, hold_count, position_x, position_y, width_px, theme_id'
      )
      .eq('published', true)
      .eq('archived', false)
      .gte('created_at', startUtc);
    if (themeFilter === 'free') {
      query = query.is('theme_id', null);
    } else if (themeFilter !== 'any') {
      query = query.eq('theme_id', themeFilter);
    }
    const { data, error } = await query
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
      width_px: clampWidthPx(Number(row.width_px ?? DEFAULT_WIDTH_PX)),
      theme_id: row.theme_id ? String(row.theme_id) : null,
    }));
    return { envReady, items };
  } catch (e) {
    return { envReady, items: [], error: formatError(e) };
  }
}

function formatError(e: unknown): string {
  if (e instanceof Error) return e.message;
  if (typeof e === 'object' && e !== null) {
    const obj = e as Record<string, unknown>;
    if (typeof obj.message === 'string') {
      const parts: string[] = [obj.message];
      if (typeof obj.code === 'string') parts.push(`(code: ${obj.code})`);
      if (typeof obj.hint === 'string') parts.push(`hint: ${obj.hint}`);
      return parts.join(' ');
    }
    try {
      return JSON.stringify(e);
    } catch {
      return '[unserializable error]';
    }
  }
  return String(e);
}

export function currentMonthLabelJST(d: Date = new Date()): string {
  const jst = new Date(d.getTime() + 9 * 60 * 60 * 1000);
  return `${jst.getUTCFullYear()}年${jst.getUTCMonth() + 1}月`;
}

export type QuestionLink = { from: string; to: string };

/**
 * Returns links where BOTH endpoints are in the given visible-id set.
 * Hidden / pending / archived questions effectively drop their edges.
 */
export async function fetchQuestionLinks(visibleIds: string[]): Promise<QuestionLink[]> {
  if (visibleIds.length === 0) return [];
  const envReady = Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
  if (!envReady) return [];

  try {
    const { data, error } = await supabase
      .from('question_links')
      .select('from_question_id, to_question_id')
      .in('from_question_id', visibleIds)
      .in('to_question_id', visibleIds);
    if (error) throw error;
    return (data ?? []).map((row) => ({
      from: String(row.from_question_id),
      to: String(row.to_question_id),
    }));
  } catch {
    return [];
  }
}
