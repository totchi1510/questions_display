/**
 * JST month boundary utilities.
 * Months are represented as "YYYY-MM" strings (e.g., "2025-10").
 */

export function jstMonthLabel(d: Date = new Date()): string {
  const jst = new Date(d.getTime() + 9 * 60 * 60 * 1000);
  const y = jst.getUTCFullYear();
  const m = String(jst.getUTCMonth() + 1).padStart(2, '0');
  return `${y}-${m}`;
}

export function jstMonthDisplay(monthKey: string): string {
  const [y, m] = monthKey.split('-').map(Number);
  return `${y}年${m}月`;
}

export function jstMonthRangeUtc(monthKey: string): { startUtc: string; endUtc: string } {
  const [y, m] = monthKey.split('-').map(Number);
  // start = first day of month at 00:00 JST → UTC = previous day 15:00
  const startJstMs = Date.UTC(y, m - 1, 1, 0, 0, 0);
  const startUtc = new Date(startJstMs - 9 * 60 * 60 * 1000);
  const endJstMs = Date.UTC(y, m, 1, 0, 0, 0);
  const endUtc = new Date(endJstMs - 9 * 60 * 60 * 1000);
  return { startUtc: startUtc.toISOString(), endUtc: endUtc.toISOString() };
}

export function previousMonthKey(monthKey: string): string {
  const [y, m] = monthKey.split('-').map(Number);
  const prev = new Date(Date.UTC(y, m - 2, 1));
  return `${prev.getUTCFullYear()}-${String(prev.getUTCMonth() + 1).padStart(2, '0')}`;
}

export function isValidMonthKey(s: string): boolean {
  return /^\d{4}-\d{2}$/.test(s);
}
