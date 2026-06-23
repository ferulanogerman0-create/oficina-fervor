'use server';
import { db, schema } from '@/lib/db';
import { eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { ctx } from './_ctx';
import { getSelfClient } from './clientes';

/** Parser CSV mínimo: respeta comillas dobles y "" escapadas. */
function parseLine(line: string): string[] {
  const out: string[] = [];
  let cur = '', q = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (q) {
      if (c === '"') { if (line[i + 1] === '"') { cur += '"'; i++; } else q = false; }
      else cur += c;
    } else {
      if (c === ',') { out.push(cur); cur = ''; }
      else if (c === '"') q = true;
      else cur += c;
    }
  }
  out.push(cur);
  return out;
}

/**
 * Importa el Connections.csv de la export de datos de LinkedIn a /crm.
 * Carga cada contacto como lead bajo la cuenta propia (FERVOR), fuente=linkedin.
 * Deduplica por email y por nombre. Idempotente: re-subir el mismo CSV no duplica.
 */
export async function importLinkedinCsv(formData: FormData) {
  await ctx();
  const file = formData.get('file') as File | null;
  if (!file || file.size === 0) redirect('/crm/importar?error=nofile');

  const self = await getSelfClient();
  if (!self) redirect('/crm/importar?error=noself');

  const text = await file.text();
  const lines = text.split(/\r?\n/);

  // LinkedIn antepone líneas de "Notes:" antes del header real → buscar header.
  let h = -1;
  for (let i = 0; i < lines.length; i++) {
    if (parseLine(lines[i])[0].trim().toLowerCase() === 'first name') { h = i; break; }
  }
  if (h === -1) redirect('/crm/importar?error=format');

  const cols = parseLine(lines[h]).map((c) => c.trim().toLowerCase());
  const ix = (name: string) => cols.indexOf(name);
  const iFirst = ix('first name'), iLast = ix('last name'), iEmail = ix('email address');
  const iCompany = ix('company'), iPos = ix('position'), iUrl = ix('url'), iConn = ix('connected on');

  // Dedupe contra lo ya cargado.
  const existing = await db.select({ email: schema.leads.email, nombre: schema.leads.nombre })
    .from(schema.leads).where(eq(schema.leads.clientId, self.id));
  const emailSet = new Set(existing.map((e) => (e.email || '').toLowerCase()).filter(Boolean));
  const nameSet = new Set(existing.map((e) => (e.nombre || '').toLowerCase().trim()).filter(Boolean));

  const rows: typeof schema.leads.$inferInsert[] = [];
  let skipped = 0;
  for (let i = h + 1; i < lines.length; i++) {
    if (!lines[i].trim()) continue;
    const f = parseLine(lines[i]);
    const nombre = `${(f[iFirst] || '').trim()} ${(f[iLast] || '').trim()}`.trim();
    if (!nombre) continue;
    const email = iEmail >= 0 ? (f[iEmail] || '').trim() : '';
    const company = iCompany >= 0 ? (f[iCompany] || '').trim() : '';
    const pos = iPos >= 0 ? (f[iPos] || '').trim() : '';
    const url = iUrl >= 0 ? (f[iUrl] || '').trim() : '';
    const conn = iConn >= 0 ? (f[iConn] || '').trim() : '';

    const key = email.toLowerCase();
    if ((key && emailSet.has(key)) || nameSet.has(nombre.toLowerCase())) { skipped++; continue; }
    if (key) emailSet.add(key);
    nameSet.add(nombre.toLowerCase());

    const notasParts = [
      [pos, company].filter(Boolean).join(' @ '),
      url || null,
      conn ? `Conectado: ${conn}` : null,
    ].filter(Boolean);

    rows.push({
      clientId: self.id,
      nombre: nombre.slice(0, 128),
      email: email ? email.slice(0, 128) : null,
      fuente: 'linkedin',
      estado: 'nuevo',
      notas: notasParts.join(' · ') || null,
    });
  }

  // Insert en lotes (evita límite de parámetros de Postgres).
  for (let i = 0; i < rows.length; i += 200) {
    const batch = rows.slice(i, i + 200);
    if (batch.length) await db.insert(schema.leads).values(batch);
  }

  revalidatePath('/crm');
  redirect(`/crm/importar?imported=${rows.length}&skipped=${skipped}`);
}
