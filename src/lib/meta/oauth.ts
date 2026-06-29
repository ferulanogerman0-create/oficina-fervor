import 'server-only';
import { db, schema } from '@/lib/db';
import { eq } from 'drizzle-orm';

/**
 * Meta OAuth server-side flow: redirect → callback → exchange code → long-lived
 * → /me/accounts → save Page+IG en meta_accounts del cliente FERVOR (esPropio=true).
 *
 * Env vars requeridas: META_APP_ID, META_APP_SECRET (cargar en EasyPanel).
 *
 * Redirect URI registrada en Meta App FB Login product:
 *   https://oficina.fervorar.com/api/meta/oauth/callback
 *
 * App Domain: oficina.fervorar.com (agregar a App Domains en Settings → Basic).
 */

const V = process.env.META_API_VERSION || 'v21.0';
const DIALOG = `https://www.facebook.com/${V}/dialog/oauth`;
const GRAPH = `https://graph.facebook.com/${V}`;

export const META_SCOPES = [
  'pages_show_list',
  'pages_read_engagement',
  'pages_manage_metadata',
  'instagram_basic',
  'instagram_manage_insights',
  'ads_read',
  'ads_management',
  'business_management',
];

export function publicOrigin(req: Request): string {
  const env = process.env.PUBLIC_URL;
  if (env) return env.replace(/\/$/, '');
  const host = req.headers.get('x-forwarded-host') || req.headers.get('host') || '';
  if (host && !/^0\.0\.0\.0|^127\.|^localhost/.test(host)) return `https://${host}`;
  const proto = (req.headers.get('x-forwarded-proto') || 'https').split(',')[0].trim();
  return host ? `${proto}://${host}` : '';
}

export function getOAuthStartUrl(origin: string, state: string) {
  const params = new URLSearchParams({
    client_id: process.env.META_APP_ID || '',
    redirect_uri: `${origin}/api/meta/oauth/callback`,
    response_type: 'code',
    scope: META_SCOPES.join(','),
    state,
  });
  return `${DIALOG}?${params.toString()}`;
}

export async function exchangeCode(code: string, origin: string): Promise<string> {
  const params = new URLSearchParams({
    client_id: process.env.META_APP_ID || '',
    client_secret: process.env.META_APP_SECRET || '',
    redirect_uri: `${origin}/api/meta/oauth/callback`,
    code,
  });
  const r = await fetch(`${GRAPH}/oauth/access_token?${params.toString()}`);
  if (!r.ok) throw new Error('exchangeCode failed: ' + (await r.text()));
  const j = (await r.json()) as { access_token: string };
  return j.access_token;
}

/** Trade short-lived (1h) for long-lived (60 days) user token. */
export async function toLongLived(shortToken: string): Promise<string> {
  const params = new URLSearchParams({
    grant_type: 'fb_exchange_token',
    client_id: process.env.META_APP_ID || '',
    client_secret: process.env.META_APP_SECRET || '',
    fb_exchange_token: shortToken,
  });
  const r = await fetch(`${GRAPH}/oauth/access_token?${params.toString()}`);
  if (!r.ok) throw new Error('toLongLived failed: ' + (await r.text()));
  const j = (await r.json()) as { access_token: string };
  return j.access_token;
}

interface PageInfo {
  id: string;
  name: string;
  access_token: string; // page access token (long-lived if user token is long-lived)
  instagram_business_account?: { id: string };
}

export async function getUserPages(userToken: string): Promise<PageInfo[]> {
  const r = await fetch(`${GRAPH}/me/accounts?fields=id,name,access_token,instagram_business_account&access_token=${userToken}`);
  if (!r.ok) throw new Error('getUserPages failed: ' + (await r.text()));
  const j = (await r.json()) as { data: PageInfo[] };
  return j.data || [];
}

export async function getAdAccounts(userToken: string): Promise<Array<{ id: string; name: string; account_id: string }>> {
  const r = await fetch(`${GRAPH}/me/adaccounts?fields=id,name,account_id&access_token=${userToken}`);
  if (!r.ok) throw new Error('getAdAccounts failed: ' + (await r.text()));
  const j = (await r.json()) as { data: Array<{ id: string; name: string; account_id: string }> };
  return j.data || [];
}

/**
 * Guarda el primer Page+IG+adAccount como cuenta del cliente FERVOR (esPropio=true).
 * Si hay múltiples páginas, prioriza German.Fervor (page_id conocido) o la primera.
 */
export async function saveOwnerMetaConnection(opts: {
  clientId: number; // cliente FERVOR esPropio
  pageId: string;
  pageAccessToken: string;
  igBusinessId?: string;
  adAccountId?: string; // formato "act_618315713691591"
}) {
  const existing = await db.select().from(schema.metaAccounts).where(eq(schema.metaAccounts.clientId, opts.clientId)).limit(1);
  if (existing[0]) {
    await db.update(schema.metaAccounts).set({
      fbPageId: opts.pageId,
      fbPageAccessToken: opts.pageAccessToken,
      igBusinessId: opts.igBusinessId,
      adAccountId: opts.adAccountId,
      lastSyncedAt: new Date() as any,
    }).where(eq(schema.metaAccounts.id, existing[0].id));
  } else {
    await db.insert(schema.metaAccounts).values({
      clientId: opts.clientId,
      fbPageId: opts.pageId,
      fbPageAccessToken: opts.pageAccessToken,
      igBusinessId: opts.igBusinessId,
      adAccountId: opts.adAccountId,
    });
  }
}

/** Lee el cliente FERVOR esPropio. */
export async function getOwnerClient(): Promise<{ id: number; nombre: string } | null> {
  const [row] = await db.select().from(schema.clients).where(eq(schema.clients.esPropio, true)).limit(1);
  return row ? { id: row.id, nombre: row.nombre } : null;
}
