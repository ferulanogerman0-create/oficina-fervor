'use server';
import { db, schema } from '@/lib/db';
import { and, eq, desc, sql, inArray } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { ctx } from './_ctx';
import { syncPosts, MetaNotConnected } from '@/lib/meta';

type SortKey = 'reach' | 'plays' | 'engagementRate' | 'saves' | 'shares' | 'postedAt';

export async function listTopPosts(opts?: { clientId?: number; sort?: SortKey; onlyReels?: boolean; limit?: number }) {
  await ctx();
  const conds = [];
  if (opts?.clientId) conds.push(eq(schema.posts.clientId, opts.clientId));
  if (opts?.onlyReels) conds.push(inArray(schema.posts.type, ['reel', 'video']));

  const sortCol = {
    reach: schema.posts.reach, plays: schema.posts.plays, engagementRate: schema.posts.engagementRate,
    saves: schema.posts.saves, shares: schema.posts.shares, postedAt: schema.posts.postedAt,
  }[opts?.sort ?? 'reach'];

  return await db.select({
    id: schema.posts.id, platform: schema.posts.platform, type: schema.posts.type,
    permalink: schema.posts.permalink, thumbnailUrl: schema.posts.thumbnailUrl, caption: schema.posts.caption,
    postedAt: schema.posts.postedAt, likes: schema.posts.likes, comments: schema.posts.comments,
    shares: schema.posts.shares, saves: schema.posts.saves, reach: schema.posts.reach,
    plays: schema.posts.plays, videoViews: schema.posts.videoViews, engagementRate: schema.posts.engagementRate,
    clientId: schema.posts.clientId, cliente: schema.clients.nombre, color: schema.clients.color,
  }).from(schema.posts)
    .leftJoin(schema.clients, eq(schema.posts.clientId, schema.clients.id))
    .where(and(...conds))
    .orderBy(desc(sortCol))
    .limit(opts?.limit ?? 24);
}

export async function videosKpis(opts?: { clientId?: number }) {
  await ctx();
  const conds = opts?.clientId ? [eq(schema.posts.clientId, opts.clientId)] : [];
  const [row] = await db.select({
    posts: sql<number>`count(*)`,
    reach: sql<number>`coalesce(sum(${schema.posts.reach}),0)`,
    plays: sql<number>`coalesce(sum(${schema.posts.plays}),0)`,
    saves: sql<number>`coalesce(sum(${schema.posts.saves}),0)`,
    avgEng: sql<number>`coalesce(avg(${schema.posts.engagementRate}),0)`,
  }).from(schema.posts).where(and(...conds));
  return row;
}

export async function syncVideos(clientId: number) {
  await ctx();
  try {
    const n = await syncPosts(clientId);
    revalidatePath('/videos');
    return { ok: true as const, count: n };
  } catch (e) {
    if (e instanceof MetaNotConnected) return { ok: false as const, error: 'no_meta' };
    return { ok: false as const, error: e instanceof Error ? e.message : 'sync_failed' };
  }
}
