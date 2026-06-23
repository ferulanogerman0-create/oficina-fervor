'use server';
import { db, schema } from '@/lib/db';
import { and, eq, desc, ilike, or, sql } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { ctx } from './_ctx';
import { aiEnabled, ganchoToPlantilla, generarGuion } from '@/lib/ai';
import { getSelfClient } from './clientes';

export async function listGanchos(opts?: { q?: string; nicho?: string; tipo?: string; soloFav?: boolean }) {
  await ctx();
  const conds = [];
  if (opts?.q) conds.push(or(ilike(schema.ganchos.texto, `%${opts.q}%`), ilike(schema.ganchos.plantilla, `%${opts.q}%`))!);
  if (opts?.nicho) conds.push(eq(schema.ganchos.nicho, opts.nicho));
  if (opts?.tipo) conds.push(eq(schema.ganchos.tipo, opts.tipo));
  if (opts?.soloFav) conds.push(eq(schema.ganchos.favorito, true));
  return await db.select().from(schema.ganchos)
    .where(conds.length ? and(...conds) : undefined)
    .orderBy(desc(schema.ganchos.favorito), desc(schema.ganchos.vistas), desc(schema.ganchos.createdAt));
}

export async function ganchosStats() {
  await ctx();
  const [row] = await db.select({
    total: sql<number>`count(*)::int`,
    favoritos: sql<number>`count(*) filter (where ${schema.ganchos.favorito})::int`,
    usados: sql<number>`count(*) filter (where ${schema.ganchos.usado})::int`,
  }).from(schema.ganchos);
  return row ?? { total: 0, favoritos: 0, usados: 0 };
}

export async function crearGancho(formData: FormData) {
  await ctx();
  const texto = String(formData.get('texto') || '').trim();
  if (!texto) return;

  const base = {
    texto,
    autorHandle: (formData.get('autor_handle') as string)?.trim() || null,
    autorSeguidores: formData.get('autor_seguidores') ? Number(formData.get('autor_seguidores')) : null,
    fuenteUrl: (formData.get('fuente_url') as string)?.trim() || null,
    vistas: formData.get('vistas') ? Number(formData.get('vistas')) : null,
    plataforma: (formData.get('plataforma') as string) || null,
    nicho: (formData.get('nicho') as string)?.trim() || null,
    tipo: (formData.get('tipo') as string)?.trim() || null,
  };

  let plantilla: string | null = null;
  let angulos: string[] | null = null;
  // si IA disponible y no cargó nicho/tipo manual → generar plantilla
  if (aiEnabled()) {
    try {
      const ai = await ganchoToPlantilla(texto, base.nicho || undefined);
      plantilla = ai.plantilla;
      angulos = ai.angulos;
      if (!base.nicho) base.nicho = ai.nicho;
      if (!base.tipo) base.tipo = ai.tipo;
    } catch { /* sigue sin plantilla IA */ }
  }

  await db.insert(schema.ganchos).values({ ...base, plantilla, angulos });
  revalidatePath('/tablero/ganchos');
}

export async function toggleFavGancho(id: number) {
  await ctx();
  await db.update(schema.ganchos)
    .set({ favorito: sql`not ${schema.ganchos.favorito}` })
    .where(eq(schema.ganchos.id, id));
  revalidatePath('/tablero/ganchos');
}

export async function deleteGancho(id: number) {
  await ctx();
  await db.delete(schema.ganchos).where(eq(schema.ganchos.id, id));
  revalidatePath('/tablero/ganchos');
}

/** "Usar éste" → genera guion con IA y crea una idea en el calendario (estado producción). */
export async function usarGancho(id: number, formato = 'reel', plataforma = 'instagram') {
  await ctx();
  const [g] = await db.select().from(schema.ganchos).where(eq(schema.ganchos.id, id)).limit(1);
  if (!g) return { ok: false, error: 'Gancho no encontrado' };
  const self = await getSelfClient();
  if (!self) return { ok: false, error: 'No hay cuenta propia FERVOR (creá un cliente con esPropio)' };

  let titulo = (g.plantilla || g.texto).slice(0, 120);
  let guion: string | null = null;
  if (aiEnabled()) {
    try {
      const r = await generarGuion(g.plantilla || g.texto, formato, plataforma);
      titulo = r.titulo?.slice(0, 250) || titulo;
      guion = r.guion;
    } catch { /* sin guion IA */ }
  }

  await db.insert(schema.contentIdeas).values({
    clientId: self.id, titulo,
    formato, plataforma, hook: g.texto, guion,
    ganchoId: g.id, estado: 'produccion',
  });
  await db.update(schema.ganchos).set({ usado: true }).where(eq(schema.ganchos.id, id));
  revalidatePath('/tablero/ganchos');
  revalidatePath('/tablero/calendario');
  return { ok: true };
}

export async function usarGanchoForm(formData: FormData) {
  await ctx();
  const id = Number(formData.get('id'));
  const formato = (formData.get('formato') as string) || 'reel';
  const plataforma = (formData.get('plataforma') as string) || 'instagram';
  if (id) await usarGancho(id, formato, plataforma);
}
