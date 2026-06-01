import 'server-only';
import { getSessionUser, type CurrentUser } from '@/lib/auth';

export async function ctx(): Promise<CurrentUser> {
  const u = await getSessionUser();
  if (!u) throw new Error('not authenticated');
  return u;
}
