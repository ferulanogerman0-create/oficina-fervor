import 'server-only';
import { db, schema } from '@/lib/db';
import { eq } from 'drizzle-orm';
import { getMetaAccount, MetaNotConnected } from './index';

/**
 * Sync detallado a nivel ad (no solo campaign).
 *
 * Llama /act_X/ads?fields=...,insights{...} y popula ad_ads para que el dashboard
 * pueda comparar A vs B copy variants, ver impressions/clicks/CTR/CPC por anuncio.
 *
 * Requiere ads_read scope (Marketing API use case).
 */

const V = process.env.META_API_VERSION || 'v21.0';
const BASE = `https://graph.facebook.com/${V}`;

async function gget<T = any>(path: string, params: Record<string, string | number>, token: string): Promise<T> {
  const url = new URL(`${BASE}/${path}`);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, String(v));
  url.searchParams.set('access_token', token);
  const res = await fetch(url.toString(), { cache: 'no-store' });
  const json = await res.json();
  if (json?.error) throw new Error(`Meta API ${json.error.code}: ${json.error.message}`);
  return json as T;
}

export type SyncAdsDetailResult = { ads: number; errors: string[] };

export async function syncAdsDetail(
  clientId: number,
  opts: { datePreset?: string; limit?: number } = {},
): Promise<SyncAdsDetailResult> {
  const acc = await getMetaAccount(clientId);
  if (!acc?.adAccountId || !acc.fbPageAccessToken) throw new MetaNotConnected(clientId);
  const token = acc.fbPageAccessToken;
  const act = acc.adAccountId.startsWith('act_') ? acc.adAccountId : `act_${acc.adAccountId}`;
  const datePreset = opts.datePreset || 'last_30d';

  const res: SyncAdsDetailResult = { ads: 0, errors: [] };

  const ads = await gget<{ data: any[] }>(`${act}/ads`, {
    fields: 'id,name,campaign_id,adset_id,creative,status,effective_status',
    limit: opts.limit ?? 100,
  }, token);

  for (const ad of ads.data || []) {
    let spend = 0, impressions = 0, reach = 0, clicks = 0, ctr = 0, cpc = 0, cpm = 0, frequency = 0, conversations = 0, leadResults = 0;
    try {
      const ins = await gget<{ data: any[] }>(`${ad.id}/insights`, {
        fields: 'spend,impressions,reach,clicks,ctr,cpc,cpm,frequency,actions',
        date_preset: datePreset,
      }, token);
      const row = ins.data?.[0];
      if (row) {
        spend = Number(row.spend) || 0;
        impressions = Number(row.impressions) || 0;
        reach = Number(row.reach) || 0;
        clicks = Number(row.clicks) || 0;
        ctr = Number(row.ctr) || 0;
        cpc = Number(row.cpc) || 0;
        cpm = Number(row.cpm) || 0;
        frequency = Number(row.frequency) || 0;
        for (const a of (row.actions || [])) {
          if (a.action_type === 'onsite_conversion.messaging_conversation_started_7d') conversations = Number(a.value) || 0;
          if (a.action_type === 'lead' || a.action_type === 'onsite_conversion.lead_grouped') leadResults = Number(a.value) || 0;
        }
      }
    } catch (e: any) {
      res.errors.push(`ad ${ad.id}: ${e.message}`);
    }

    await db.insert(schema.adAds).values({
      clientId,
      campaignMetaId: String(ad.campaign_id),
      adSetMetaId: String(ad.adset_id),
      adMetaId: String(ad.id),
      name: ad.name ?? null,
      status: ad.status ?? null,
      effectiveStatus: ad.effective_status ?? null,
      creativeId: ad.creative?.id ?? null,
      spend: String(spend), impressions, reach, clicks,
      ctr: String(ctr), cpc: String(cpc), cpm: String(cpm),
      frequency: String(frequency),
      conversations, leadResults,
      syncedAt: new Date(),
    }).onConflictDoUpdate({
      target: schema.adAds.adMetaId,
      set: {
        name: ad.name ?? null,
        status: ad.status ?? null,
        effectiveStatus: ad.effective_status ?? null,
        spend: String(spend), impressions, reach, clicks,
        ctr: String(ctr), cpc: String(cpc), cpm: String(cpm),
        frequency: String(frequency),
        conversations, leadResults,
        syncedAt: new Date(),
      },
    });
    res.ads++;
  }

  return res;
}
