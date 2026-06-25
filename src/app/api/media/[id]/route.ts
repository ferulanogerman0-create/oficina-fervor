import { NextRequest } from 'next/server';
import { db, schema } from '@/lib/db';
import { eq } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

// Sirve la imagen de una pieza de contenido (base64 en DB) como bytes públicos,
// para que la Graph API de Meta pueda descargarla al publicar en Instagram.
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const n = Number(id);
  if (!n) return new Response('Bad id', { status: 400 });
  const [row] = await db
    .select({ d: schema.contentIdeas.imageData, m: schema.contentIdeas.imageMime })
    .from(schema.contentIdeas)
    .where(eq(schema.contentIdeas.id, n))
    .limit(1);
  if (!row?.d) return new Response('Not found', { status: 404 });
  const b64 = row.d.replace(/^data:[^;]+;base64,/, '');
  const buf = Buffer.from(b64, 'base64');
  return new Response(buf, {
    headers: {
      'Content-Type': row.m || 'image/jpeg',
      'Content-Length': String(buf.length),
      'Cache-Control': 'public, max-age=3600',
    },
  });
}
