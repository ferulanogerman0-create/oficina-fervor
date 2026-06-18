// Google Calendar lib — OAuth + create/update/delete events
// Single account (owner of oficina). Stored in google_calendar_creds.

import { db, schema } from '@/lib/db';
import { eq } from 'drizzle-orm';

const OAUTH = 'https://accounts.google.com/o/oauth2/v2/auth';
const TOKEN = 'https://oauth2.googleapis.com/token';
const API = 'https://www.googleapis.com/calendar/v3';

const SCOPES = [
  'https://www.googleapis.com/auth/calendar.events',
  'https://www.googleapis.com/auth/userinfo.email',
].join(' ');

export function getOAuthStartUrl(origin: string) {
  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID || '',
    redirect_uri: `${origin}/api/gcal/callback`,
    response_type: 'code',
    scope: SCOPES,
    access_type: 'offline',
    prompt: 'consent',
  });
  return `${OAUTH}?${params.toString()}`;
}

export async function exchangeCode(code: string, origin: string) {
  const body = new URLSearchParams({
    code,
    client_id: process.env.GOOGLE_CLIENT_ID || '',
    client_secret: process.env.GOOGLE_CLIENT_SECRET || '',
    redirect_uri: `${origin}/api/gcal/callback`,
    grant_type: 'authorization_code',
  });
  const r = await fetch(TOKEN, { method: 'POST', body });
  if (!r.ok) throw new Error('Token exchange failed: ' + (await r.text()));
  return (await r.json()) as {
    access_token: string;
    refresh_token: string;
    expires_in: number;
    scope: string;
    token_type: string;
  };
}

async function refreshToken(refresh_token: string) {
  const body = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID || '',
    client_secret: process.env.GOOGLE_CLIENT_SECRET || '',
    refresh_token,
    grant_type: 'refresh_token',
  });
  const r = await fetch(TOKEN, { method: 'POST', body });
  if (!r.ok) throw new Error('Refresh failed: ' + (await r.text()));
  return (await r.json()) as { access_token: string; expires_in: number };
}

export async function getActiveAccessToken(): Promise<string | null> {
  const rows = await db.select().from(schema.googleCalendarCreds).limit(1);
  const c = rows[0];
  if (!c) return null;
  const expiresAt = new Date(c.expiresAt as any).getTime();
  if (expiresAt - Date.now() > 60 * 1000) return c.accessToken;
  // refresh
  const fresh = await refreshToken(c.refreshToken);
  const newExp = new Date(Date.now() + fresh.expires_in * 1000);
  await db.update(schema.googleCalendarCreds)
    .set({ accessToken: fresh.access_token, expiresAt: newExp, updatedAt: new Date() as any })
    .where(eq(schema.googleCalendarCreds.id, c.id));
  return fresh.access_token;
}

export async function saveCreds(p: { access_token: string; refresh_token: string; expires_in: number; scope: string; email?: string }) {
  const expiresAt = new Date(Date.now() + p.expires_in * 1000);
  const existing = await db.select().from(schema.googleCalendarCreds).limit(1);
  if (existing[0]) {
    await db.update(schema.googleCalendarCreds)
      .set({
        accessToken: p.access_token,
        refreshToken: p.refresh_token,
        expiresAt,
        scope: p.scope,
        email: p.email,
        updatedAt: new Date() as any,
      })
      .where(eq(schema.googleCalendarCreds.id, existing[0].id));
  } else {
    await db.insert(schema.googleCalendarCreds).values({
      accessToken: p.access_token,
      refreshToken: p.refresh_token,
      expiresAt,
      scope: p.scope,
      email: p.email,
      calendarId: 'primary',
    });
  }
}

export async function getUserEmail(token: string) {
  const r = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!r.ok) return undefined;
  return ((await r.json()) as { email?: string }).email;
}

// =============== EVENTS ===============

interface CreateEventInput {
  summary: string;
  description?: string;
  start: string;   // YYYY-MM-DDTHH:MM:SS
  end: string;     // idem
  timeZone?: string;
  recurrence?: string[]; // ['RRULE:FREQ=DAILY;BYDAY=MO,TU,WE,TH,FR']
  colorId?: string;
}

export async function createEvent(input: CreateEventInput): Promise<{ id: string } | null> {
  const token = await getActiveAccessToken();
  if (!token) return null;
  const body = {
    summary: input.summary,
    description: input.description,
    start: { dateTime: input.start, timeZone: input.timeZone || 'America/Argentina/Buenos_Aires' },
    end: { dateTime: input.end, timeZone: input.timeZone || 'America/Argentina/Buenos_Aires' },
    recurrence: input.recurrence,
    colorId: input.colorId,
    reminders: { useDefault: false, overrides: [{ method: 'popup', minutes: 10 }] },
  };
  const r = await fetch(`${API}/calendars/primary/events`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!r.ok) {
    console.error('GCal create event failed:', await r.text());
    return null;
  }
  const j = (await r.json()) as { id: string };
  return { id: j.id };
}

export async function deleteEvent(eventId: string): Promise<boolean> {
  const token = await getActiveAccessToken();
  if (!token) return false;
  const r = await fetch(`${API}/calendars/primary/events/${eventId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });
  return r.ok || r.status === 410;
}

export async function updateEvent(eventId: string, patch: Partial<CreateEventInput>): Promise<boolean> {
  const token = await getActiveAccessToken();
  if (!token) return false;
  const body: any = {};
  if (patch.summary) body.summary = patch.summary;
  if (patch.description !== undefined) body.description = patch.description;
  if (patch.start) body.start = { dateTime: patch.start, timeZone: patch.timeZone || 'America/Argentina/Buenos_Aires' };
  if (patch.end) body.end = { dateTime: patch.end, timeZone: patch.timeZone || 'America/Argentina/Buenos_Aires' };
  if (patch.recurrence) body.recurrence = patch.recurrence;
  if (patch.colorId) body.colorId = patch.colorId;
  const r = await fetch(`${API}/calendars/primary/events/${eventId}`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  return r.ok;
}

// =============== HELPERS ===============

// Construye RRULE para hábitos recurrentes
export function habitToRRULE(frecuencia: string, diasSemana?: string | null, diaMes?: number | null): string[] | undefined {
  if (frecuencia === 'diaria') {
    if (diasSemana) {
      // Convertir "1,2,3,4,5" → BYDAY=MO,TU,WE,TH,FR
      const map: Record<string, string> = { '0': 'SU', '1': 'MO', '2': 'TU', '3': 'WE', '4': 'TH', '5': 'FR', '6': 'SA' };
      const byday = diasSemana.split(',').map((d) => map[d.trim()]).filter(Boolean).join(',');
      if (byday) return [`RRULE:FREQ=WEEKLY;BYDAY=${byday}`];
    }
    return ['RRULE:FREQ=DAILY'];
  }
  if (frecuencia === 'semanal' && diasSemana) {
    const map: Record<string, string> = { '0': 'SU', '1': 'MO', '2': 'TU', '3': 'WE', '4': 'TH', '5': 'FR', '6': 'SA' };
    const byday = map[diasSemana.trim()] || 'MO';
    return [`RRULE:FREQ=WEEKLY;BYDAY=${byday}`];
  }
  if (frecuencia === 'mensual' && diaMes) {
    return [`RRULE:FREQ=MONTHLY;BYMONTHDAY=${diaMes}`];
  }
  return undefined;
}

// Devuelve "YYYY-MM-DDTHH:MM:SS" combinando fecha (YYYY-MM-DD) + horaDefault (HH:MM)
export function buildEventTimes(fecha: string, horaDefault: string | null, durMin: number) {
  const hora = horaDefault || '09:00';
  const start = `${fecha}T${hora}:00`;
  // calcular end sumando minutos
  const [hh, mm] = hora.split(':').map(Number);
  const endMins = hh * 60 + mm + durMin;
  const eh = Math.floor(endMins / 60) % 24;
  const em = endMins % 60;
  const end = `${fecha}T${String(eh).padStart(2, '0')}:${String(em).padStart(2, '0')}:00`;
  return { start, end };
}
