// Datos demo para validar/mostrar la Oficina sin Meta real.
// Re-ejecutable: limpia y recarga posts/campaigns/snapshots/leads/tasks/ideas/meta_accounts.
import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import { eq, inArray } from 'drizzle-orm';
import * as schema from '../src/lib/db/schema';

const url = process.env.DATABASE_URL || 'postgres://oficina:oficina@localhost:5432/oficina';
const client = postgres(url, { max: 1 });
const db = drizzle(client, { schema });

const rnd = (a: number, b: number) => Math.floor(a + Math.random() * (b - a));
const dayStr = (d: number) => new Date(Date.now() - d * 86400_000).toISOString().slice(0, 10);
const dateBack = (d: number) => new Date(Date.now() - d * 86400_000);

const HOOKS = [
  '3 señales de que tu auto necesita service ya',
  'Cómo elegimos cada unidad de nuestro stock',
  'Antes y después: detailing completo',
  'El error que todos cometen al financiar',
  'Tour por la agencia 🔥',
  'Permuta: cómo tasamos tu usado',
  'Caso real: entrega en 48hs',
  'Lo que nadie te dice de los 0km',
  'Tip de mantenimiento que ahorra plata',
  'Reseña de cliente feliz',
  'Detrás de escena del taller',
  'Promo del mes: cuotas sin interés',
];

async function main() {
  const clients = await db.select().from(schema.clients);
  if (clients.length === 0) { console.error('No hay clientes — corré seed primero'); process.exit(1); }
  const ids = clients.map((c) => c.id);

  // limpiar
  await db.delete(schema.posts).where(inArray(schema.posts.clientId, ids));
  await db.delete(schema.adCampaigns).where(inArray(schema.adCampaigns.clientId, ids));
  await db.delete(schema.metricSnapshots).where(inArray(schema.metricSnapshots.clientId, ids));
  await db.delete(schema.leads).where(inArray(schema.leads.clientId, ids));
  await db.delete(schema.tasks).where(inArray(schema.tasks.clientId, ids));
  await db.delete(schema.contentIdeas).where(inArray(schema.contentIdeas.clientId, ids));
  await db.delete(schema.metaAccounts).where(inArray(schema.metaAccounts.clientId, ids));

  for (const c of clients) {
    // meta account (marca "conectada" en /config; token placeholder)
    await db.insert(schema.metaAccounts).values({
      clientId: c.id,
      fbPageId: String(rnd(1e9, 9e9)),
      igBusinessId: '178414' + String(rnd(1e10, 9e10)),
      adAccountId: 'act_' + String(rnd(1e9, 9e9)),
      fbPageAccessToken: 'DEMO_TOKEN_no_real',
      lastSyncedAt: dateBack(0),
    });

    // posts / reels (12)
    for (let i = 0; i < 12; i++) {
      const reach = rnd(800, 25000);
      const plays = Math.round(reach * (1 + Math.random()));
      const likes = rnd(40, Math.max(60, reach / 12));
      const comments = rnd(2, 120);
      const shares = rnd(1, 90);
      const saves = rnd(5, 300);
      const eng = (likes + comments + shares + saves) / reach;
      await db.insert(schema.posts).values({
        clientId: c.id, platform: 'instagram', type: 'reel',
        igMediaId: `demo_${c.id}_${i}`,
        permalink: 'https://instagram.com',
        thumbnailUrl: `https://picsum.photos/seed/of${c.id}_${i}/400/500`,
        caption: HOOKS[i % HOOKS.length],
        postedAt: dateBack(rnd(0, 30)),
        likes, comments, shares, saves, reach,
        videoViews: plays, plays,
        engagementRate: eng.toFixed(4),
        syncedAt: dateBack(0),
      });
    }

    // ad campaigns (4)
    const objetivos = ['OUTCOME_LEADS', 'OUTCOME_TRAFFIC', 'OUTCOME_ENGAGEMENT', 'OUTCOME_SALES'];
    const estados = ['ACTIVE', 'ACTIVE', 'PAUSED', 'ACTIVE'];
    for (let i = 0; i < 4; i++) {
      const spend = rnd(15000, 220000);
      const impressions = rnd(20000, 600000);
      const clicks = rnd(300, 9000);
      const results = rnd(8, 180);
      await db.insert(schema.adCampaigns).values({
        clientId: c.id, metaId: `demo_camp_${c.id}_${i}`,
        name: `${c.nombre} · ${['Performance', 'Reconocimiento', 'Remarketing', 'Lanzamiento'][i]}`,
        objective: objetivos[i], status: estados[i],
        dailyBudget: String(rnd(3000, 15000)),
        spend: String(spend), impressions, clicks,
        ctr: ((clicks / impressions) * 100).toFixed(4),
        results, costPerResult: (spend / results).toFixed(2),
        startTime: dateBack(rnd(10, 60)), syncedAt: dateBack(0),
      });
    }

    // metric snapshots (30 días, followers creciente)
    let followers = rnd(1500, 9000);
    for (let d = 29; d >= 0; d--) {
      followers += rnd(-5, 45);
      await db.insert(schema.metricSnapshots).values({
        clientId: c.id, date: dayStr(d),
        followers,
        reach: rnd(2000, 40000),
        impressions: rnd(4000, 90000),
        profileVisits: rnd(80, 1500),
        websiteClicks: rnd(10, 400),
        adSpend: String(rnd(2000, 18000)),
        adResults: rnd(1, 25),
        newLeads: rnd(0, 8),
      });
    }

    // leads (10, repartidos)
    const etapas = ['nuevo', 'nuevo', 'contactado', 'contactado', 'calificado', 'propuesta', 'propuesta', 'cerrado', 'cerrado', 'perdido'];
    const fuentes = ['ads', 'organico', 'referido', 'dm', 'wa'];
    const nombres = ['Juan Pérez', 'Marta Gómez', 'Carlos Ruiz', 'Lucía Díaz', 'Pedro Sosa', 'Ana Torres', 'Diego Mol', 'Sofía Vera', 'Luis Paz', 'Nora Gil'];
    for (let i = 0; i < 10; i++) {
      await db.insert(schema.leads).values({
        clientId: c.id, nombre: nombres[i],
        telefono: '+54 9 348 ' + rnd(1000000, 9999999),
        fuente: fuentes[i % fuentes.length],
        estado: etapas[i],
        motivo: ['Consulta financiación', 'Interés Hilux', 'Permuta', 'Turno service', 'Cotización'][i % 5],
        createdAt: dateBack(rnd(0, 25)),
      });
    }

    // tasks (6)
    const tareas = [
      { t: 'Editar reel del mes', cat: 'contenido' },
      { t: 'Revisar campaña Performance', cat: 'ads' },
      { t: 'Responder leads del día', cat: 'crm' },
      { t: 'Subir fotos de stock nuevo', cat: 'contenido' },
      { t: 'Reporte mensual al cliente', cat: 'admin' },
      { t: 'Programar posteos semana', cat: 'contenido' },
    ];
    for (let i = 0; i < tareas.length; i++) {
      await db.insert(schema.tasks).values({
        clientId: c.id, titulo: tareas[i].t, categoria: tareas[i].cat,
        prioridad: ['alta', 'media', 'baja'][i % 3],
        done: i >= 4, dueAt: dateBack(rnd(-5, 3)),
      });
    }

    // content ideas (6)
    const estIdea = ['idea', 'idea', 'produccion', 'aprobado', 'posteado', 'posteado'];
    const formatos = ['reel', 'carrusel', 'post', 'story'];
    for (let i = 0; i < 6; i++) {
      await db.insert(schema.contentIdeas).values({
        clientId: c.id, titulo: HOOKS[(i + 3) % HOOKS.length],
        formato: formatos[i % formatos.length],
        hook: HOOKS[i % HOOKS.length],
        estado: estIdea[i],
        postedAt: estIdea[i] === 'posteado' ? dateBack(rnd(1, 10)) : null,
      });
    }

    console.log(`✓ demo ${c.nombre}`);
  }
  await client.end();
  console.log('Demo listo.');
}
main().catch((e) => { console.error(e); process.exit(1); });
