import 'server-only';
import { getSupabaseServer } from './supabaseServer';

export type StaffRole = 'moderator' | 'admin';

export type Staff = {
  userId: string;
  email: string;
  role: StaffRole;
};

/**
 * Returns the current authenticated user's staff role, or null if the user
 * is unauthenticated or not in staff_roles.
 *
 * Resilient to auth errors (e.g. stale refresh tokens after a Supabase
 * project reset): on any auth failure we just treat the visitor as
 * anonymous rather than crashing the page.
 */
export async function getStaffRole(): Promise<Staff | null> {
  const supabase = await getSupabaseServer();

  let user: { id: string; email?: string | null } | null = null;
  try {
    const { data, error } = await supabase.auth.getUser();
    if (error) return null;
    user = data.user;
  } catch {
    return null;
  }
  if (!user) return null;

  const { data, error } = await supabase
    .from('staff_roles')
    .select('role')
    .eq('user_id', user.id)
    .maybeSingle();
  if (error || !data) return null;

  return {
    userId: user.id,
    email: user.email ?? '',
    role: data.role as StaffRole,
  };
}
