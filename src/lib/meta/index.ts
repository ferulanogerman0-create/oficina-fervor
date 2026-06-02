import 'server-only';
import { db, schema } from '@/lib/db';
import { eq } from 'drizzle-orm';

/**
 * Cliente Meta Graph API (Instagram Business + Facebook Ads).
 * Lee tokens por cliente de la tabla meta_accounts.
 * Si falta cuenta/token tira MetaNotConnected (los callers lo manejan).
 *
 * Setup por cliente (en /config): fbPageId, igBusinessId, adAccountId (act_xxx),
 * fbPageAccessToken (long-lived). App ID/Secret globales en env.
 */

const V = process.env.META_API_VERSION || 'v21.0';
const BASE = `https://graph.facebook.com/${V}`;

export class MetaNotConnected extends Error {
  constructor(clientId: number) {
    super(`Cliente ${clientId} sin cuenta Meta conectada`);
    this.name = 'MetaNotConnected';
  }
}

type MetaAccount = typeof schema.metaAccounts.$inferSelect;

export async function getMetaAccount(clientId: number): Promise<MetaAccount | null> {
  const [row] = await db.select().from(schema.metaAccounts)
    .where(eq(schema.metaAccounts.clientId, clientId)).limit(1);
  return row ?? null;
}

async function gget<T = any>(path: string, params: Record<string, string | number>, token: string): Promise<T> {
  const url = new URL(`${BASE}/${path}`);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, String(v));
  url.searchParams.set('access_token', token);
  const res = await fetch(url.toString(), { cache: 'no-store' });
  const json = await res.json();
  if (json?.error) throw new Error(`Meta API ${json.error.code}: ${json.error.message}`);
  return json as T;
}

const num = (v: unknown) => (v == null ? null : Number(v));
const str = (v: unknown) => (v == null ? null : String(v));

/* ── Insights helper: Meta devuelve [{name, values:[{value}]}] ── */
function pickInsight(insights: any, name: string): number {
  const row = insights?.data?.find((d: any) => d.name === name);
  const v = row?.values?.[0]?.value ?? row?.total_value?.value;
  return typeof v === 'number' ? v : Number(v) || 0;
}

/* ════════════ POSTS / REELS (Instagram) ════════════ */
export async function syncPosts(clientId: number): Promise<number> {
  const acc = await getMetaAccount(clientId);
  if (!acc?.igBusinessId || !acc.fbPageAccessToken) throw new MetaNotConnected(clientId);
  const token = acc.fbPageAccessToken;

  const media = await gget<{ data: any[] }>(`${acc.igBusinessId}/media`, {
    fields: 'id,caption,media_type,media_product_type,media_url,thumbnail_url,permalink,timestamp,like_count,comments_count',
    limit: 50,
  }, token);

  let n = 0;
  for (const m of media.data || []) {
    const isReel = m.media_product_type === 'REELS' || m.media_type === 'VIDEO';
    // insights por media (best-effort; algunos tipos no soportan ciertas métricas)
    let reach = 0, saved = 0, shares = 0, plays = 0, views = 0;
    try {
      const metric = isReel ? 'reach,saved,shares,plays,total_interactions' : 'reach,saved,shares';
      const ins = await gget(`${m.id}/insights`, { metric }, token);
      reach = pickInsight(ins, 'reach');
      saved = pickInsight(ins, 'saved');
      shares = pickInsight(ins, 'shares');
      plays = pickInsight(ins, 'plays');
      views = plays;
    } catch { /* media sin insights disponibles */ }

    const likes = Number(m.like_count) || 0;
    const comments = Number(m.comments_count) || 0;
    const engagementRate = reach > 0 ? (likes + comments + shares + saved) / reach : null;

    await db.insert(schema.posts).values({
      clientId,
      platform: 'instagram',
      type: isReel ? 'reel' : (m.media_type === 'CAROUSEL_ALBUM' ? 'carousel' : 'image'),
      igMediaId: m.id,
      permalink: str(m.permalink),
      mediaUrl: str(m.media_url),
      thumbnailUrl: str(m.thumbnail_url),
      caption: str(m.caption),
      postedAt: m.timestamp ? new Date(m.timestamp) : null,
      likes, comments, shares, saves: saved, reach,
      videoViews: views, plays,
      engagementRate: engagementRate != null ? String(engagementRate.toFixed(4)) : null,
      syncedAt: new Date(),
    }).onConflictDoUpdate({
      target: schema.posts.igMediaId,
      set: {
        likes, comments, shares, saves: saved, reach, videoViews: views, plays,
        engagementRate: engagementRate != null ? String(engagementRate.toFixed(4)) : null,
        caption: str(m.caption), thumbnailUrl: str(m.thumbnail_url), syncedAt: new Date(),
      },
    });
    n++;
  }
  await touchSync(clientId);
  return n;
}

/* ════════════ AD CAMPAIGNS (Facebook Ads) ════════════ */
export async function syncCampaigns(clientId: number): Promise<number> {
  const acc = await getMetaAccount(clientId);
  if (!acc?.adAccountId || !acc.fbPageAccessToken) throw new MetaNotConnected(clientId);
  const token = acc.fbPageAccessToken;
  const act = acc.adAccountId.startsWith('act_') ? acc.adAccountId : `act_${acc.adAccountId}`;

  const camps = await gget<{ data: any[] }>(`${act}/campaigns`, {
    fields: 'id,name,objective,status,daily_budget,start_time',
    limit: 50,
  }, token);

  let n = 0;
  for (const c of camps.data || []) {
    let spend = 0, impressions = 0, clicks = 0, ctr = 0, results = 0;
    try {
      const ins = await gget<{ data: any[] }>(`${c.id}/insights`, {
        fields: 'spend,impressions,clicks,ctr,actions', date_preset: 'last_30d',
      }, token);
      const row = ins.data?.[0];
      if (row) {
        spend = Number(row.spend) || 0;
        impressions = Number(row.impressions) || 0;
        clicks = Number(row.clicks) || 0;
        ctr = Number(row.ctr) || 0;
        const lead = row.actions?.find((a: any) => a.action_type === 'lead' || a.action_type === 'onsite_conversion.lead_grouped');
        results = lead ? Number(lead.value) : 0;
      }
    } catch { /* sin insights */ }
    const costPerResult = results > 0 ? spend / results : null;

    await db.insert(schema.adCampaigns).values({
      clientId, metaId: c.id, name: str(c.name), objective: str(c.objective), status: str(c.status),
      dailyBudget: c.daily_budget ? String(Number(c.daily_budget) / 100) : null,
      spend: String(spend), impressions, clicks, ctr: String(ctr), results,
      costPerResult: costPerResult != null ? String(costPerResult.toFixed(2)) : null,
      startTime: c.start_time ? new Date(c.start_time) : null,
      syncedAt: new Date(),
    }).onConflictDoUpdate({
      target: schema.adCampaigns.metaId,
      set: {
        name: str(c.name), status: str(c.status),
        dailyBudget: c.daily_budget ? String(Number(c.daily_budget) / 100) : null,
        spend: String(spend), impressions, clicks, ctr: String(ctr), results,
        costPerResult: costPerResult != null ? String(costPerResult.toFixed(2)) : null,
        syncedAt: new Date(),
      },
    });
    n++;
  }
  await touchSync(clientId);
  return n;
}

/* ════════════ SNAPSHOT diario (account insights → metric_snapshots) ════════════ */
export async function snapshotClient(clientId: number, date: string): Promise<void> {
  const acc = await getMetaAccount(clientId);
  if (!acc?.igBusinessId || !acc.fbPageAccessToken) throw new MetaNotConnected(clientId);
  const token = acc.fbPageAccessToken;

  let followers: number | null = null, reach: number | null = null,
    impressions: number | null = null, profileVisits: number | null = null,
    websiteClicks: number | null = null;
  let raw: any = {};
  try {
    const ins = await gget(`${acc.igBusinessId}/insights`, {
      metric: 'reach,impressions,profile_views,website_clicks', period: 'day',
    }, token);
    raw = ins;
    reach = pickInsight(ins, 'reach');
    impressions = pickInsight(ins, 'impressions');
    profileVisits = pickInsight(ins, 'profile_views');
    websiteClicks = pickInsight(ins, 'website_clicks');
  } catch { /* algunas cuentas restringen insights */ }
  try {
    const acct = await gget<{ followers_count?: number }>(`${acc.igBusinessId}`, { fields: 'followers_count' }, token);
    followers = num(acct.followers_count);
  } catch { /* */ }

  await db.insert(schema.metricSnapshots).values({
    clientId, date, followers, reach, impressions, profileVisits, websiteClicks, raw,
  }).onConflictDoUpdate({
    target: [schema.metricSnapshots.clientId, schema.metricSnapshots.date],
    set: { followers, reach, impressions, profileVisits, websiteClicks, raw },
  });
}

async function touchSync(clientId: number) {
  await db.update(schema.metaAccounts).set({ lastSyncedAt: new Date() })
    .where(eq(schema.metaAccounts.clientId, clientId));
}
