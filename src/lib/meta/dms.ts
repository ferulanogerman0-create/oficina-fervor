import 'server-only';
import { db, schema } from '@/lib/db';
import { eq, and } from 'drizzle-orm';
import { getMetaAccount, MetaNotConnected } from './index';

/**
 * Sync de DMs Instagram + Messenger.
 *
 * Endpoints Graph API usados:
 *   GET /<PAGE_ID>/conversations?platform=instagram&fields=id,participants,updated_time,message_count,unread_count
 *   GET /<CONV_ID>/messages?fields=id,from,to,message,attachments,created_time
 *
 * Permissions necesarias:
 *   - pages_messaging (Messenger)
 *   - instagram_manage_messages (IG Direct)
 *   - pages_read_engagement
 *
 * Estas requieren BM Verified + use case "Mensajes comerciales" en la app.
 * Sin ellas, syncDMs lanza MetaNotConnected o el endpoint devuelve error 200.
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

export type SyncDMsOptions = {
  /** instagram | messenger | both — default 'both' */
  platform?: 'instagram' | 'messenger' | 'both';
  /** max conversaciones a procesar */
  limit?: number;
  /** max messages por conversación (los más recientes) */
  messagesPerConv?: number;
};

export type SyncDMsResult = {
  conversations: number;
  messages: number;
  errors: string[];
};

export async function syncDMs(clientId: number, opts: SyncDMsOptions = {}): Promise<SyncDMsResult> {
  const acc = await getMetaAccount(clientId);
  if (!acc?.fbPageId || !acc.fbPageAccessToken) throw new MetaNotConnected(clientId);
  const token = acc.fbPageAccessToken;
  const platforms = opts.platform === 'both' || !opts.platform
    ? (['instagram', 'messenger'] as const)
    : [opts.platform];

  const result: SyncDMsResult = { conversations: 0, messages: 0, errors: [] };

  for (const platform of platforms) {
    try {
      const convsRes = await gget<{ data: any[] }>(`${acc.fbPageId}/conversations`, {
        platform,
        fields: 'id,participants,updated_time,message_count,unread_count,snippet',
        limit: opts.limit ?? 25,
      }, token);

      for (const c of convsRes.data || []) {
        // Extraer participantes (excluir la página propia)
        const others = (c.participants?.data || []).filter((p: any) => p.id !== acc.fbPageId);
        const other = others[0] || {};

        const [savedConv] = await db.insert(schema.dmConversations).values({
          clientId,
          platform,
          metaConvId: c.id,
          participantId: other.id ? String(other.id) : null,
          participantName: other.name || null,
          participantHandle: other.username || null,
          lastMessageAt: c.updated_time ? new Date(c.updated_time) : null,
          lastMessagePreview: c.snippet ?? null,
          unread: Number(c.unread_count) || 0,
          msgCount: Number(c.message_count) || 0,
          syncedAt: new Date(),
        }).onConflictDoUpdate({
          target: schema.dmConversations.metaConvId,
          set: {
            participantName: other.name || null,
            participantHandle: other.username || null,
            lastMessageAt: c.updated_time ? new Date(c.updated_time) : null,
            lastMessagePreview: c.snippet ?? null,
            unread: Number(c.unread_count) || 0,
            msgCount: Number(c.message_count) || 0,
            syncedAt: new Date(),
          },
        }).returning();

        result.conversations++;

        // Pull mensajes
        try {
          const msgsRes = await gget<{ data: any[] }>(`${c.id}/messages`, {
            fields: 'id,from,to,message,attachments,created_time',
            limit: opts.messagesPerConv ?? 25,
          }, token);

          for (const m of msgsRes.data || []) {
            const fromMe = m.from?.id === acc.fbPageId;
            const att = m.attachments?.data?.[0];
            await db.insert(schema.dmMessages).values({
              conversationId: savedConv.id,
              metaMsgId: m.id,
              fromMe,
              body: m.message ?? null,
              attachmentType: att?.type ?? null,
              attachmentUrl: att?.image_data?.url || att?.video_data?.url || null,
              createdAt: m.created_time ? new Date(m.created_time) : new Date(),
            }).onConflictDoNothing({ target: schema.dmMessages.metaMsgId });
            result.messages++;
          }
        } catch (e: any) {
          result.errors.push(`msgs ${c.id}: ${e.message}`);
        }
      }
    } catch (e: any) {
      result.errors.push(`${platform}: ${e.message}`);
    }
  }

  await db.update(schema.metaAccounts).set({ lastSyncedAt: new Date() })
    .where(eq(schema.metaAccounts.clientId, clientId));

  return result;
}

/**
 * Marca una conversación como "lead" — opcionalmente crea/vincula registro en leads.
 * Para uso desde UI: botón "convertir a lead" en cada conversación.
 */
export async function tagConversationAsLead(
  conversationId: number,
  data: { nombre?: string; telefono?: string; email?: string; motivo?: string },
): Promise<{ leadId: number }> {
  const [conv] = await db.select().from(schema.dmConversations)
    .where(eq(schema.dmConversations.id, conversationId)).limit(1);
  if (!conv) throw new Error('Conversación no encontrada');

  const [lead] = await db.insert(schema.leads).values({
    clientId: conv.clientId,
    nombre: data.nombre || conv.participantName || conv.participantHandle || 'Lead sin nombre',
    telefono: data.telefono || null,
    email: data.email || null,
    fuente: 'dm',
    estado: 'nuevo',
    motivo: data.motivo || null,
    ultimoContacto: conv.lastMessageAt,
  }).returning();

  await db.update(schema.dmConversations)
    .set({ tagLead: true, leadId: lead.id })
    .where(eq(schema.dmConversations.id, conversationId));

  return { leadId: lead.id };
}
