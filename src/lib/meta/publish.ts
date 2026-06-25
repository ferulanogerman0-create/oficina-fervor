import 'server-only';
import { db, schema } from '@/lib/db';
import { eq } from 'drizzle-orm';
import { getMetaAccount } from './index';

/**
 * Publicación a Instagram + Facebook Page vía Graph API.
 * Usa el token de meta_accounts del cliente (fbPageAccessToken).
 * Instagram exige image_url PÚBLICA → la servimos en /api/media/[id].
 */

const V = process.env.META_API_VERSION || 'v21.0';
const BASE = `https://graph.facebook.com/${V}`;
const PUBLIC_URL = (process.env.PUBLIC_URL || 'https://oficina.wolfdma.website').replace(/\/$/, '');

async function gpost(path: string, params: Record<string, string>, token: string): Promise<any> {
  const body = new URLSearchParams({ ...params, access_token: token });
  const res = await fetch(`${BASE}/${path}`, { method: 'POST', body, cache: 'no-store' });
  const json = await res.json();
  if (json?.error) throw new Error(`Meta ${json.error.code}: ${json.error.message}`);
  return json;
}

async function gget(path: string, params: Record<string, string>, token: string): Promise<any> {
  const url = new URL(`${BASE}/${path}`);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  url.searchParams.set('access_token', token);
  const res = await fetch(url.toString(), { cache: 'no-store' });
  const json = await res.json();
  if (json?.error) throw new Error(`Meta ${json.error.code}: ${json.error.message}`);
  return json;
}

/** Publica una imagen en Instagram (contenedor → publish). Devuelve el media id. */
export async function publishToInstagram(igUserId: string, token: string, imageUrl: string, caption: string): Promise<string> {
  const container = await gpost(`${igUserId}/media`, { image_url: imageUrl, caption: caption || '' }, token);
  // Esperar a que el contenedor termine de procesar (hasta ~25s).
  for (let i = 0; i < 10; i++) {
    const st = await gget(`${container.id}`, { fields: 'status_code' }, token);
    if (st.status_code === 'FINISHED') break;
    if (st.status_code === 'ERROR') throw new Error('Instagram: el procesamiento de la imagen falló');
    await new Promise((r) => setTimeout(r, 2500));
  }
  const pub = await gpost(`${igUserId}/media_publish`, { creation_id: String(container.id) }, token);
  return String(pub.id);
}

/** Publica una foto en la Página de Facebook. Devuelve el post id. */
export async function publishToFacebookPage(pageId: string, token: string, imageUrl: string, caption: string): Promise<string> {
  const r = await gpost(`${pageId}/photos`, { url: imageUrl, caption: caption || '', published: 'true' }, token);
  return String(r.post_id || r.id);
}

/**
 * Publica una idea del calendario según su plataforma.
 * Marca el estado en content_ideas (publicando/publicado/error).
 */
export async function publishIdea(ideaId: number): Promise<{ igMediaId: string | null; fbPostId: string | null }> {
  const [idea] = await db.select().from(schema.contentIdeas).where(eq(schema.contentIdeas.id, ideaId)).limit(1);
  if (!idea) throw new Error('Idea no encontrada');
  if (!idea.imageData) throw new Error('Falta la imagen para publicar');

  const acct = await getMetaAccount(idea.clientId);
  if (!acct?.fbPageAccessToken) throw new Error('Cuenta Meta no conectada (cargá el token en /config)');
  const token = acct.fbPageAccessToken;
  const imageUrl = `${PUBLIC_URL}/api/media/${ideaId}`;
  const caption = idea.caption || idea.guion || idea.titulo || '';
  const plat = (idea.plataforma || 'instagram').toLowerCase();

  await db.update(schema.contentIdeas).set({ publishStatus: 'publicando', publishError: null }).where(eq(schema.contentIdeas.id, ideaId));

  let igMediaId: string | null = null;
  let fbPostId: string | null = null;
  try {
    // Instagram (default / cuando la plataforma es instagram)
    if (acct.igBusinessId && (plat.includes('instagram') || plat === 'ig' || plat === '' )) {
      igMediaId = await publishToInstagram(acct.igBusinessId, token, imageUrl, caption);
    }
    // Facebook Page (cuando la plataforma es facebook explícita)
    if (acct.fbPageId && plat.includes('facebook')) {
      fbPostId = await publishToFacebookPage(acct.fbPageId, token, imageUrl, caption);
    }
    if (!igMediaId && !fbPostId) {
      // fallback: si no matcheó nada pero hay IG, publicar en IG
      if (acct.igBusinessId) igMediaId = await publishToInstagram(acct.igBusinessId, token, imageUrl, caption);
      else throw new Error(`Plataforma "${plat}" no publicable (falta IG/FB en la cuenta Meta)`);
    }
    await db.update(schema.contentIdeas).set({
      publishStatus: 'publicado', estado: 'posteado', postedAt: new Date(),
      igPublishedMediaId: igMediaId, fbPostId, publishError: null,
    }).where(eq(schema.contentIdeas.id, ideaId));
    return { igMediaId, fbPostId };
  } catch (e: any) {
    await db.update(schema.contentIdeas).set({ publishStatus: 'error', publishError: String(e?.message || e) }).where(eq(schema.contentIdeas.id, ideaId));
    throw e;
  }
}
