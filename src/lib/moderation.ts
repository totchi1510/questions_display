import type { SessionPayload } from '@/lib/auth';

/**
 * Evaluate content and decide whether to publish immediately or queue for review.
 * Returns an action and reasons (for queue decisions).
 */
export function evaluateContent(content: string): {
  action: 'publish' | 'queue';
  reasons: string[];
} {
  const reasons: string[] = [];
  const lower = content.toLowerCase();
  const banned = ['spam', 'abuse'];

  if (content.length > 280) reasons.push('len>280');
  if (banned.some((w) => lower.includes(w))) reasons.push('banned_word');

  const action = reasons.length > 0 ? 'queue' : 'publish';
  return { action, reasons };
}

/**
 * JST day window in UTC for counting (e.g., rate limits).
 */
export function jstDayRangeUtc() {
  const now = new Date();
  const jstNow = new Date(now.getTime() + 9 * 60 * 60 * 1000);
  const startJst = new Date(
    Date.UTC(jstNow.getUTCFullYear(), jstNow.getUTCMonth(), jstNow.getUTCDate(), 0, 0, 0)
  );
  const startUtc = new Date(startJst.getTime() - 9 * 60 * 60 * 1000);
  const endUtc = new Date(startUtc.getTime() + 24 * 60 * 60 * 1000);
  return { startUtc: startUtc.toISOString(), endUtc: endUtc.toISOString() };
}

export interface ModerationContext {
  role: SessionPayload['role'] | 'viewer';
  jti: string | null;
}

