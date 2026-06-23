'use server';
import { db, schema } from '@/lib/db';
import { and, eq, desc, gte } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { ctx } from './_ctx';
import { aiEnabled, tagTendencia } from '@/lib/ai';

// 12 fuentes (AI + marketing + nicho). RSS/Atom.
const SOURCES: { name: string; url: string }[] = [
  { name: 'OpenAI', url: 'https://openai.com/news/rss.xml' },
  { name: 'Google AI', url: 'https://blog.google/technology/ai/rss/' },
  { name: 'Hugging Face', url: 'https://huggingface.co/blog/feed.xml' },
  { name: 'Anthropic/Claude (HN)', url: 'https://hnrss.org/newest?q=Anthropic+OR+Claude&count=8' },
  { name: 'AI (HN)', url: 'https://hnrss.org/newest?q=AI+OR+LLM+OR+agents&points=80&count=12' },
  { name: 'TechCrunch AI', url: 'https://techcrunch.com/category/artificial-intelligence/feed/' },
  { name: 'The Verge AI', url: 'https://www.theverge.com/rss/ai-artificial-intelligence/index.xml' },
  { name: 'VentureBeat AI', url: 'https://venturebeat.com/category/ai/feed/' },
  { name: 'Ars Technica AI', url: 'https://arstechnica.com/ai/feed/' },
  { name: 'MIT Tech Review', url: 'https://www.technologyreview.com/feed/' },
  { name: 'Social Media Today', url: 'https://www.socialmediatoday.com/feeds/news/' },
  { name: 'HubSpot Marketing', url: 'https://blog.hubspot.com/marketing/rss.xml' },
];

type RawItem = { title: string; link: string; desc: string; pub?: string };

function decode(s: string) {
  return s
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'").replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ').trim();
}

function pick(block: string, tags: string[]): string {
  for (const t of tags) {
    const m = block.match(new RegExp(`<${t}[^>]*>([\\s\\S]*?)</${t}>`, 'i'));
    if (m) return m[1];
  }
  return '';
}

function pickLink(block: string): string {
  // RSS <link>url</link>
  const r = block.match(/<link[^>]*>([\s\S]*?)<\/link>/i);
  if (r && r[1].trim().startsWith('http')) return decode(r[1]);
  // Atom <link href="url"/>
  const a = block.match(/<link[^>]*href=["']([^"']+)["']/i);
  if (a) return a[1];
  return '';
}

function parseFeed(xml: string): RawItem[] {
  const out: RawItem[] = [];
  const blocks = xml.match(/<(item|entry)[\s\S]*?<\/(item|entry)>/gi) || [];
  for (const b of blocks.slice(0, 6)) {
    const title = decode(pick(b, ['title']));
    const link = pickLink(b);
    const desc = decode(pick(b, ['description', 'summary', 'content']));
    const pub = decode(pick(b, ['pubDate', 'published', 'updated']));
    if (title && link) out.push({ title, link, desc, pub });
  }
  return out;
}

async function fetchSource(s: { name: string; url: string }): Promise<RawItem[]> {
  try {
    const ctrl = new AbortController();
    const to = setTimeout(() => ctrl.abort(), 9000);
    const res = await fetch(s.url, {
      signal: ctrl.signal,
      headers: { 'user-agent': 'Mozilla/5.0 FervorBot/1.0', accept: 'application/rss+xml, application/xml, text/xml, */*' },
      cache: 'no-store',
    });
    clearTimeout(to);
    if (!res.ok) return [];
    return parseFeed(await res.text());
  } catch { return []; }
}

/** Trae las fuentes, taggea con IA las nuevas, guarda. Devuelve cuántas nuevas. Cap para limitar costo. */
export async function fetchTendencias(maxTag = 18): Promise<{ nuevas: number; fuentesOk: number }> {
  const results = await Promise.all(SOURCES.map(fetchSource));
  let fuentesOk = 0;
  // existentes p/ dedup
  const existing = new Set(
    (await db.select({ url: schema.tendencias.url }).from(schema.tendencias)).map((r) => r.url),
  );
  // armar candidatos nuevos (intercalado por fuente p/ diversidad)
  const candidates: { fuente: string; it: RawItem }[] = [];
  results.forEach((items, i) => {
    if (items.length) fuentesOk++;
    items.forEach((it) => { if (it.link && !existing.has(it.link)) candidates.push({ fuente: SOURCES[i].name, it }); });
  });

  let nuevas = 0;
  for (const c of candidates.slice(0, maxTag)) {
    let categoria: 'gancho' | 'explicativo' | 'ignorar' = 'ignorar';
    let potencial = 0;
    let resumen = c.it.desc.slice(0, 240) || null;
    if (aiEnabled()) {
      try {
        const ai = await tagTendencia(c.it.title, c.it.desc, c.fuente);
        categoria = ai.categoria; potencial = ai.potencial; resumen = ai.resumen;
      } catch { /* guarda igual sin tag */ }
    }
    try {
      await db.insert(schema.tendencias).values({
        fuente: c.fuente,
        titulo: c.it.title.slice(0, 500),
        url: c.it.link,
        resumen,
        categoria,
        potencial,
        publishedAt: c.it.pub ? new Date(c.it.pub) : null,
      }).onConflictDoNothing();
      nuevas++;
    } catch { /* dup */ }
  }
  revalidatePath('/tablero/tendencias');
  return { nuevas, fuentesOk };
}

export async function listTendencias(opts?: { soloUtiles?: boolean }) {
  await ctx();
  const conds = [eq(schema.tendencias.archivado, false)];
  if (opts?.soloUtiles) conds.push(gte(schema.tendencias.potencial, 50));
  return await db.select().from(schema.tendencias)
    .where(and(...conds))
    .orderBy(desc(schema.tendencias.potencial), desc(schema.tendencias.fetchedAt))
    .limit(60);
}

export async function archivarTendencia(id: number) {
  await ctx();
  await db.update(schema.tendencias).set({ archivado: true }).where(eq(schema.tendencias.id, id));
  revalidatePath('/tablero/tendencias');
}

/** Convierte una tendencia en gancho del Baúl. */
export async function tendenciaAGancho(id: number) {
  await ctx();
  const [t] = await db.select().from(schema.tendencias).where(eq(schema.tendencias.id, id)).limit(1);
  if (!t) return;
  await db.insert(schema.ganchos).values({
    texto: t.titulo,
    nicho: 'general',
    tipo: 'dato',
    fuenteUrl: t.url,
    plataforma: 'instagram',
  });
  await db.update(schema.tendencias).set({ archivado: true }).where(eq(schema.tendencias.id, id));
  revalidatePath('/tablero/tendencias');
  revalidatePath('/tablero/ganchos');
}

/** Disparo manual desde la UI (botón Actualizar). */
export async function actualizarTendencias() {
  await ctx();
  return await fetchTendencias();
}
