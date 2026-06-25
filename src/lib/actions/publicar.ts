'use server';
import { db, schema } from '@/lib/db';
import { and, eq, lte, isNotNull, isNull, or, inArray, ne } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { ctx } from './_ctx';
import { publishIdea } from '@/lib/meta/publish';

/** Guarda imagen + caption + auto-publish de una pieza del calendario. */
export async function guardarPublicacion(formData: FormData) {
  await ctx();
  const id = Number(formData.get('id'));
  if (!id) return;
  const set: Partial<typeof schema.contentIdeas.$inferInsert> = {
    caption: (formData.get('caption') as string) || null,
    autoPublish: formData.get('auto_publish') === 'on',
  };
  const file = formData.get('imagen') as File | null;
  if (file && file.size > 0) {
    const buf = Buffer.from(await file.arrayBuffer());
    set.imageData = buf.toString('base64');
    set.imageMime = file.type || 'image/jpeg';
  }
  await db.update(schema.contentIdeas).set(set).where(eq(schema.contentIdeas.id, id));
  revalidatePath('/tablero/calendario');
}

/** Publica una pieza ahora (manual). El estado/errores quedan en la idea. */
export async function publicarAhora(id: number) {
  await ctx();
  try {
    await publishIdea(id);
  } catch {
    // el error queda persistido en publishStatus/publishError de la idea
  }
  revalidatePath('/tablero/calendario');
}

/**
 * Cron: publica las piezas con auto_publish=true cuya fecha programada ya llegó.
 * No usa ctx() (se invoca desde /api/cron/publish con CRON_SECRET).
 */
export async function publicarPendientes() {
  const now = new Date();
  const due = await db
    .select({ id: schema.contentIdeas.id })
    .from(schema.contentIdeas)
    .where(
      and(
        eq(schema.contentIdeas.autoPublish, true),
        isNotNull(schema.contentIdeas.plannedFor),
        lte(schema.contentIdeas.plannedFor, now),
        ne(schema.contentIdeas.estado, 'posteado'),
        or(isNull(schema.contentIdeas.publishStatus), inArray(schema.contentIdeas.publishStatus, ['pendiente', 'error'])),
      ),
    );
  let publicados = 0;
  let fallidos = 0;
  for (const d of due) {
    try {
      await publishIdea(d.id);
      publicados += 1;
    } catch {
      fallidos += 1;
    }
  }
  return { intentados: due.length, publicados, fallidos };
}
