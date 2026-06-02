'use server';
import { db, schema } from '@/lib/db';
import { eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { ctx } from './_ctx';
import { syncPosts, syncCampaigns, snapshotClient, MetaNotConnected } from '@/lib/meta';

export async function listMetaAccounts() {
  await ctx();
  return await db.select().from(schema.metaAccounts);
}

/** Guarda/actualiza la conexión Meta de un cliente. Token solo se pisa si viene no-vacío. */
export async function upsertMetaAccount(formData: FormData) {
  await ctx();
  const clientId = Number(formData.get('client_id'));
  if (!clientId) return;
  const fbPageId = (formData.get('fb_page_id') as string)?.trim() || null;
  const igBusinessId = (formData.get('ig_business_id') as string)?.trim() || null;
  const adAccountId = (formData.get('ad_account_id') as string)?.trim() || null;
  const tokenRaw = (formData.get('fb_page_access_token') as string)?.trim();

  const [exists] = await db.select().from(schema.metaAccounts)
    .where(eq(schema.metaAccounts.clientId, clientId)).limit(1);

  if (exists) {
    await db.update(schema.metaAccounts).set({
      fbPageId, igBusinessId, adAccountId,
      ...(tokenRaw ? { fbPageAccessToken: tokenRaw } : {}),
    }).where(eq(schema.metaAccounts.clientId, clientId));
  } else {
    await db.insert(schema.metaAccounts).values({
      clientId, fbPageId, igBusinessId, adAccountId,
      fbPageAccessToken: tokenRaw || null,
    });
  }
  revalidatePath('/config');
}

export async function disconnectMetaAccount(clientId: number) {
  await ctx();
  await db.delete(schema.metaAccounts).where(eq(schema.metaAccounts.clientId, clientId));
  revalidatePath('/config');
}

/** Sync de TODOS los clientes con cuenta conectada (botón del dashboard). */
export async function syncAllClientes() {
  await ctx();
  const accounts = await db.select({ clientId: schema.metaAccounts.clientId })
    .from(schema.metaAccounts);
  let ok = 0, fail = 0;
  for (const a of accounts) {
    try {
      await syncCampaigns(a.clientId);
      await syncPosts(a.clientId);
      await snapshotClient(a.clientId, new Date().toISOString().slice(0, 10));
      ok++;
    } catch { fail++; }
  }
  revalidatePath('/');
  return { ok, fail, total: accounts.length };
}

/** Sync completo de un cliente: campañas + reels + snapshot del día. */
export async function syncClienteAll(clientId: number) {
  await ctx();
  const today = new Date().toISOString().slice(0, 10);
  const out = { campaigns: 0, posts: 0, snapshot: false, error: null as string | null };
  try {
    out.campaigns = await syncCampaigns(clientId);
    out.posts = await syncPosts(clientId);
    await snapshotClient(clientId, today);
    out.snapshot = true;
  } catch (e) {
    out.error = e instanceof MetaNotConnected ? 'no_meta' : (e instanceof Error ? e.message : 'error');
  }
  revalidatePath('/config');
  revalidatePath('/');
  return out;
}
