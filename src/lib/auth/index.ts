import 'server-only';
import { cookies } from 'next/headers';
import { db, schema } from '@/lib/db';
import { and, eq, gt } from 'drizzle-orm';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

const COOKIE = 'oficina_session';
const DAYS = 30;

export type CurrentUser = { id: number; username: string; nombre: string; role: string };

export async function hashPassword(pw: string) {
  return bcrypt.hash(pw, 10);
}

export async function loginWithCredentials(username: string, password: string): Promise<CurrentUser | null> {
  const [u] = await db.select().from(schema.users).where(eq(schema.users.username, username)).limit(1);
  if (!u) return null;
  const ok = await bcrypt.compare(password, u.passwordHash);
  if (!ok) return null;
  await createSession(u.id);
  return { id: u.id, username: u.username, nombre: u.nombre, role: u.role };
}

export async function createSession(userId: number) {
  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + DAYS * 24 * 3600 * 1000);
  await db.insert(schema.sessions).values({ token, userId, expiresAt });
  const c = await cookies();
  c.set(COOKIE, token, {
    httpOnly: true, secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax', expires: expiresAt, path: '/',
  });
}

export async function destroySession() {
  const c = await cookies();
  const token = c.get(COOKIE)?.value;
  if (token) await db.delete(schema.sessions).where(eq(schema.sessions.token, token));
  c.delete(COOKIE);
}

export async function getSessionUser(): Promise<CurrentUser | null> {
  const c = await cookies();
  const token = c.get(COOKIE)?.value;
  if (!token) return null;
  const [row] = await db
    .select({
      id: schema.users.id, username: schema.users.username, nombre: schema.users.nombre, role: schema.users.role,
    })
    .from(schema.sessions)
    .innerJoin(schema.users, eq(schema.sessions.userId, schema.users.id))
    .where(and(eq(schema.sessions.token, token), gt(schema.sessions.expiresAt, new Date())))
    .limit(1);
  return row ?? null;
}
