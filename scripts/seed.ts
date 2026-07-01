import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';
import * as schema from '../src/lib/db/schema';

const url = process.env.DATABASE_URL;
if (!url) { console.error('DATABASE_URL required'); process.exit(1); }
const client = postgres(url, { max: 1 });
const db = drizzle(client, { schema });

async function main() {
  const username = process.env.SEED_USER || 'german';
  const password = process.env.SEED_PASS || 'changeme';
  const nombre = process.env.SEED_NOMBRE || 'Germán Ferulano';

  const [existsUser] = await db.select().from(schema.users).where(eq(schema.users.username, username)).limit(1);
  if (!existsUser) {
    await db.insert(schema.users).values({
      username, nombre,
      passwordHash: await bcrypt.hash(password, 10),
      role: 'owner',
    });
    console.log('✓ Usuario', username, 'creado');
  } else {
    // Resetear hash al SEED_PASS actual (idempotente) para no quedar trabado
    // con la pass de un seed previo.
    await db.update(schema.users)
      .set({ passwordHash: await bcrypt.hash(password, 10), nombre })
      .where(eq(schema.users.id, existsUser.id));
    console.log('· Usuario', username, 'existía → password reseteada a SEED_PASS');
  }

  const seedClients = [
    { slug: 'fervor', nombre: 'FERVOR', rubro: 'Agencia (cuenta propia)', color: '#FF5A1F',
      igHandle: '@wolfdmagency', estado: 'activo', prioridad: 'alta', esPropio: true },
    { slug: 'fma', nombre: 'FMA Mecatrónica', rubro: 'Taller', color: '#00B4D8',
      igHandle: '@fma_mecatronica', whatsapp: '+5493489681980', estado: 'activo', prioridad: 'alta' },
    { slug: 'victoria', nombre: 'Victoria Carbone', rubro: 'Psicología', color: '#A08880',
      igHandle: '@victoriacarbone.psi', whatsapp: '+5493489324935', estado: 'activo', prioridad: 'media' },
    { slug: 'jasdeep', nombre: 'Jasdeep · AFA Capital', rubro: 'Asesoría financiera / CFO', color: '#1EA84F',
      igHandle: '@jasdeep', whatsapp: '+5491127729013', estado: 'activo', prioridad: 'alta',
      notes: 'Asesor financiero/CFO B2B+B2C. LinkedIn=empresas/fondos, IG=emprendedores/comercios. Producto: IA aplicada a finanzas + mentoría. Oferta gancho: diagnóstico gratis 30min.' },
  ];
  for (const c of seedClients) {
    const [exists] = await db.select().from(schema.clients).where(eq(schema.clients.slug, c.slug)).limit(1);
    if (!exists) {
      await db.insert(schema.clients).values(c as typeof schema.clients.$inferInsert);
      console.log('✓ Cliente', c.slug, 'creado');
    } else console.log('· Cliente', c.slug, 'ya existe');
  }

  // ===== BAÚL DE CONTENIDO — Jasdeep (mes 1) =====
  const [jd] = await db.select().from(schema.clients).where(eq(schema.clients.slug, 'jasdeep')).limit(1);
  if (jd) {
    const yaTiene = await db.select({ id: schema.contentIdeas.id }).from(schema.contentIdeas)
      .where(eq(schema.contentIdeas.clientId, jd.id)).limit(1);
    if (yaTiene.length === 0) {
      const R = 'reel', C = 'carrusel', N = 'newsletter';
      const IG = 'instagram', LI = 'linkedin';
      const contenido: { titulo: string; formato: string; plataforma: string; hook: string; guion: string }[] = [
        // ---- Semana 1 ----
        { titulo: 'S1 · Reel LinkedIn — 70% no sabe si creció', formato: R, plataforma: LI, hook: 'El 70% de las empresas no sabe si su patrimonio creció el último año.', guion: 'Facturación ≠ valor. Un CFO mira si la empresa CREA patrimonio: rentabilidad real, capital de trabajo, deuda neta. CTA: diagnóstico 30 min.' },
        { titulo: 'S1 · Reel IG — Facturás bien, ¿ganás?', formato: R, plataforma: IG, hook: 'Tu negocio factura bien… ¿pero estás ganando de verdad?', guion: 'Confundir "entra plata" con "gano plata". Separar finanzas + medir margen. 3 números: entra, sale, queda real. CTA: DM FINANZAS.' },
        { titulo: 'S1 · Reel IG — 3 números por mes', formato: R, plataforma: IG, hook: '3 números que todo dueño debería mirar cada mes.', guion: '1) Margen 2) Caja (meses que aguantás) 3) Deuda (cuánto es tuyo). Si no los sabés, empezá hoy. CTA: DM FINANZAS.' },
        { titulo: 'S1 · Reel IG — No te queda un peso', formato: R, plataforma: IG, hook: 'Facturás un montón y no te queda un peso. ¿Por qué?', guion: 'Precios mal, gastos que no ves, o deuda que come el margen. La plata se escapa por un agujero que no medís. CTA: DM FINANZAS.' },
        { titulo: 'S1 · Carrusel — Patrimonio vs Caja', formato: C, plataforma: IG, hook: 'Tenés plata en la cuenta. ¿Eso significa que ganás?', guion: '5 slides: Caja=hoy / Patrimonio=si valés más / ejemplo entra 10 debés 12 = perdés / los 3 números / CTA diagnóstico.' },
        // ---- Semana 2 ----
        { titulo: 'S2 · Reel LinkedIn — Deuda que quiebra', formato: R, plataforma: LI, hook: 'Este error de deuda quiebra empresas rentables.', guion: 'Deuda corta para algo largo (máquina a 5 años con crédito a 12 meses). Se ahoga en el calce. Reestructurar el perfil. CTA: diagnóstico.' },
        { titulo: 'S2 · Reel IG — El pozo de mezclar', formato: R, plataforma: IG, hook: 'El pozo que hunde a los emprendedores sin que lo vean.', guion: 'Mezclar plata personal y del negocio. Regla 1: cuenta separada. Regla 2: sueldo fijo. CTA: DM FINANZAS.' },
        { titulo: 'S2 · Reel IG — Precio mal puesto', formato: R, plataforma: IG, hook: 'Ponés mal el precio y no lo sabés.', guion: '"Costo + un poco" te funde. Precio real = costo + TODOS los gastos + tu ganancia. CTA: DM FINANZAS.' },
        { titulo: 'S2 · Reel IG — Colchón financiero', formato: R, plataforma: IG, hook: '¿Cuántos meses malos aguanta tu negocio?', guion: 'Colchón = 2-3 meses de gastos fijos guardados. Si no lo tenés, primera meta. CTA: DM FINANZAS.' },
        { titulo: 'S2 · Carrusel — 5 errores financieros PyME', formato: C, plataforma: IG, hook: '5 errores que te cuestan plata (y ni los ves).', guion: '1 no medir · 2 mezclar finanzas · 3 deuda mal calzada · 4 mal pricing · 5 sin colchón. CTA diagnóstico.' },
        { titulo: 'S2 · Newsletter — Crea o destruye valor', formato: N, plataforma: LI, hook: 'Cómo saber, en 15 minutos, si tu empresa crea o destruye valor.', guion: 'Mini-tablero de 3 números (rentabilidad, capital de trabajo, deuda neta). Cómo leerlos + 1 acción c/u. CTA diagnóstico.' },
        // ---- Semana 3 ----
        { titulo: 'S3 · Reel LinkedIn — Lo que ve un CFO', formato: R, plataforma: LI, hook: 'Lo que un CFO ve en tu balance y vos no.', guion: 'No mira la ganancia, mira su calidad: ¿caja o papel? ¿sostenible o a costa de deuda? CTA: diagnóstico.' },
        { titulo: 'S3 · Reel IG — 3 preguntas', formato: R, plataforma: IG, hook: '3 preguntas que te hago apenas nos sentamos.', guion: '1) ¿Cuánto te queda real? 2) ¿Bancás 2 meses malos? 3) ¿Qué producto te deja plata? CTA: DM FINANZAS.' },
        { titulo: 'S3 · Reel IG — De ahogado a respirar', formato: R, plataforma: IG, hook: 'De ahogado a respirar: una historia real (sin nombre).', guion: 'Comercio ganaba pero corría a cubrir cheques. No era ventas: deuda mal ordenada. Reordenamos vencimientos → 60 días. CTA.' },
        { titulo: 'S3 · Reel IG — Qué producto te funde', formato: R, plataforma: IG, hook: '¿Qué producto te hace ganar y cuál te funde?', guion: 'No todos rinden igual. Medí ganancia POR producto: a veces vender menos de lo malo = ganar más. CTA: DM FINANZAS.' },
        { titulo: 'S3 · Carrusel — El tablero financiero', formato: C, plataforma: IG, hook: 'El tablero de 1 hoja que te dice cómo va tu negocio.', guion: 'Indicadores: ventas, margen, caja disponible, deuda, punto de equilibrio. Qué mirar cada semana. CTA.' },
        // ---- Semana 4 ----
        { titulo: 'S4 · Reel LinkedIn — Mejor financiamiento', formato: R, plataforma: LI, hook: 'Cómo conseguir mejor financiamiento (lo que el banco no te explica).', guion: 'El banco presta por cómo se VE tu info. Balances ordenados + flujo proyectado + calce = mejor tasa y límite. CTA diagnóstico.' },
        { titulo: 'S4 · Reel IG — Si no sabés si crecés', formato: R, plataforma: IG, hook: 'Si no sabés si crecés, tenés un problema. Y tiene solución.', guion: 'Sistema simple: medir 3 números, separar la plata, revisar 1×/semana. Eso solo te cambia el negocio. CTA: DM FINANZAS.' },
        { titulo: 'S4 · Reel IG — Temporada y capital de trabajo', formato: R, plataforma: IG, hook: 'Vendés más en temporada y llegás justo igual. ¿Por qué?', guion: 'Sin planificar capital de trabajo, la plata de la buena época se va antes de la mala. Guardar antes. CTA: DM FINANZAS.' },
        { titulo: 'S4 · Reel IG — Antes/Después', formato: R, plataforma: IG, hook: 'Antes / después de ordenar las finanzas (esto cambia todo).', guion: 'Antes: no sabés cuánto ganás, apagás incendios. Después: números, decisiones con datos, dormís tranquilo. CTA: DM FINANZAS.' },
        { titulo: 'S4 · Carrusel — Antes / Después', formato: C, plataforma: IG, hook: 'Antes / Después (lo que cambia de verdad).', guion: '5 slides antes→después: saber cuánto ganás, decisiones, deuda, dormir tranquilo. CTA diagnóstico.' },
        { titulo: 'S4 · Newsletter — Reestructurar deuda', formato: N, plataforma: LI, hook: 'Reestructurar deuda sin frenar el crecimiento.', guion: 'El problema del calce. 4 pasos: mapear vencimientos, agrupar/extender, negociar tasa, dejar aire de caja. Caso. CTA.' },
      ];
      await db.insert(schema.contentIdeas).values(
        contenido.map((x) => ({ clientId: jd.id, titulo: x.titulo, formato: x.formato, plataforma: x.plataforma, hook: x.hook, guion: x.guion, estado: 'idea' })) as typeof schema.contentIdeas.$inferInsert[]
      );
      console.log('✓ Baúl de contenido Jasdeep sembrado:', contenido.length, 'ideas');
    } else console.log('· Baúl Jasdeep ya tiene contenido');
  }

  // ===== OBJETIVOS estrategia 90d (2026-06-18 → 2026-09-16) =====
  const hoy = new Date('2026-06-18');
  const tresMeses = new Date('2026-09-16');
  const fmt = (d: Date) => d.toISOString().slice(0, 10);

  const seedObjetivos = [
    { titulo: 'MRR FERVOR +$1.500 USD/mes', tipo: '90d', categoria: 'ingresos',
      fechaInicio: fmt(hoy), fechaFin: fmt(tresMeses),
      kpiUnidad: 'USD', kpiTarget: '1500', color: '#FF5A1F',
      descripcion: '3-4 clientes nuevos recurrentes a $300-1000 USD/mes promedio.' },
    { titulo: 'Cerrar 3 clientes recurrentes nuevos', tipo: '90d', categoria: 'captacion',
      fechaInicio: fmt(hoy), fechaFin: fmt(tresMeses),
      kpiUnidad: 'clientes', kpiTarget: '3', color: '#FFA53C',
      descripcion: 'Pipeline LinkedIn outreach + IG inbound.' },
    { titulo: '90 conexiones LinkedIn calificadas', tipo: '90d', categoria: 'captacion',
      fechaInicio: fmt(hoy), fechaFin: fmt(tresMeses),
      kpiUnidad: 'conexiones', kpiTarget: '90', color: '#FF7A3C',
      descripcion: '10-15 connection requests/día manual, target agencias chicas LATAM.' },
    { titulo: '24 posts LinkedIn publicados', tipo: '90d', categoria: 'contenido',
      fechaInicio: fmt(hoy), fechaFin: fmt(tresMeses),
      kpiUnidad: 'posts', kpiTarget: '24', color: '#E0240A',
      descripcion: '2 posts/semana: casos + lecciones + decisiones contrarias.' },
    { titulo: '90 posts IG feed publicados', tipo: '90d', categoria: 'contenido',
      fechaInicio: fmt(hoy), fechaFin: fmt(tresMeses),
      kpiUnidad: 'posts', kpiTarget: '90', color: '#FF5A1F',
      descripcion: '1 post diario IG. Mix carruseles + reels + posts caso.' },
    { titulo: '9 discovery calls realizadas', tipo: '90d', categoria: 'captacion',
      fechaInicio: fmt(hoy), fechaFin: fmt(tresMeses),
      kpiUnidad: 'calls', kpiTarget: '9', color: '#FFA53C',
      descripcion: '3 calls/mes. SPIN simplificado.' },
  ];
  const objetivoIds: Record<string, number> = {};
  for (const o of seedObjetivos) {
    const [exists] = await db.select().from(schema.objetivos).where(eq(schema.objetivos.titulo, o.titulo)).limit(1);
    if (!exists) {
      const [created] = await db.insert(schema.objetivos).values(o as typeof schema.objetivos.$inferInsert).returning();
      objetivoIds[o.titulo] = created.id;
      console.log('✓ Objetivo', o.titulo);
    } else {
      objetivoIds[o.titulo] = exists.id;
      console.log('· Objetivo', o.titulo, 'ya existe');
    }
  }

  // ===== HABITOS DIARIOS (Lun-Vie ventana real: 9:30-12 + 13-18) =====
  const seedHabitos = [
    // ----- MAÑANA 9:30-12 -----
    { titulo: '10 connection requests LinkedIn', categoria: 'captacion',
      frecuencia: 'diaria', diasSemana: '1,2,3,4,5', horaDefault: '09:30',
      tiempoEstimadoMin: 45, emoji: '🔗',
      descripcion: 'Manual. SIN mensaje en la request. Target: founders agencias chicas LATAM.',
      objetivoTitulo: '90 conexiones LinkedIn calificadas' },
    { titulo: 'Responder DMs IG + LinkedIn', categoria: 'captacion',
      frecuencia: 'diaria', diasSemana: '1,2,3,4,5', horaDefault: '10:15',
      tiempoEstimadoMin: 45, emoji: '💬',
      descripcion: 'Inbox 0 antes de seguir. Responder personalmente, sin templates rígidos.',
      objetivoTitulo: 'Cerrar 3 clientes recurrentes nuevos' },
    { titulo: '1 post IG feed publicado', categoria: 'contenido',
      frecuencia: 'diaria', diasSemana: '1,2,3,4,5,6', horaDefault: '11:00',
      tiempoEstimadoMin: 45, emoji: '📸',
      descripcion: 'Carrusel, reel o post single. Brand FERVOR. Caso o lección con número.',
      objetivoTitulo: '90 posts IG feed publicados' },
    { titulo: '3-5 stories IG', categoria: 'contenido',
      frecuencia: 'diaria', diasSemana: '1,2,3,4,5,6', horaDefault: '11:45',
      tiempoEstimadoMin: 15, emoji: '📲',
      descripcion: 'Behind-the-scenes, work-in-progress, snippets de cliente, polls.' },

    // ----- TARDE 13-18 -----
    { titulo: 'Check métricas oficina', categoria: 'admin',
      frecuencia: 'diaria', diasSemana: '1,2,3,4,5', horaDefault: '13:00',
      tiempoEstimadoMin: 15, emoji: '📊',
      descripcion: 'Ads spend, leads nuevos, web visits, DMs pendientes.' },
    { titulo: 'Delivery cliente activo', categoria: 'delivery',
      frecuencia: 'diaria', diasSemana: '1,2,3,4,5', horaDefault: '13:15',
      tiempoEstimadoMin: 240, emoji: '⚙️',
      descripcion: 'Bloque profundo 4h: dev, debugging, calls cliente.' },
    { titulo: 'Review pipeline + 2do round DMs', categoria: 'admin',
      frecuencia: 'diaria', diasSemana: '1,2,3,4,5', horaDefault: '17:30',
      tiempoEstimadoMin: 30, emoji: '🎯',
      descripcion: 'Qué hay mañana: calls, deadlines, posts. Segundo round responder DMs.' },

    // ----- SEMANALES (movidos a banda real) -----
    { titulo: 'Planning semana + revisión KPIs', categoria: 'admin',
      frecuencia: 'semanal', diasSemana: '1', horaDefault: '13:00',
      tiempoEstimadoMin: 30, emoji: '🗓️',
      descripcion: 'Lunes 13:00. Revisión KPIs semana anterior + qué armar esta semana.' },
    { titulo: 'Programar 2 posts LinkedIn semana', categoria: 'contenido',
      frecuencia: 'semanal', diasSemana: '1', horaDefault: '15:00',
      tiempoEstimadoMin: 60, emoji: '💼',
      descripcion: 'Lunes. Redactar + programar 2 posts. Casos técnicos + lecciones.',
      objetivoTitulo: '24 posts LinkedIn publicados' },
    { titulo: 'Revisión pipeline ventas', categoria: 'captacion',
      frecuencia: 'semanal', diasSemana: '3', horaDefault: '11:00',
      tiempoEstimadoMin: 30, emoji: '📋',
      descripcion: 'Miércoles. Mover prospects en CRM. Follow-ups pendientes.' },
    { titulo: 'Cierre semana + reporte personal', categoria: 'admin',
      frecuencia: 'semanal', diasSemana: '5', horaDefault: '17:00',
      tiempoEstimadoMin: 30, emoji: '🏁',
      descripcion: 'Viernes. KPIs: connection requests, calls, propuestas, MRR.' },
    { titulo: 'Crear contenido nuevo (caso/lección)', categoria: 'contenido',
      frecuencia: 'semanal', diasSemana: '6', horaDefault: '10:00',
      tiempoEstimadoMin: 120, emoji: '✍️',
      descripcion: 'Sábado. Producción profunda: bloque para próxima semana.' },

    // ----- MENSUALES (movidos a 13:00 si caían fuera) -----
    { titulo: 'Review mes + planning mes siguiente', categoria: 'admin',
      frecuencia: 'mensual', diaMes: 1, horaDefault: '13:00',
      tiempoEstimadoMin: 90, emoji: '📅',
      descripcion: 'Día 1 13:00. KPIs mes anterior, ajustes estrategia, foco mes nuevo.' },
    { titulo: 'Mid-month adjust', categoria: 'admin',
      frecuencia: 'mensual', diaMes: 15, horaDefault: '13:00',
      tiempoEstimadoMin: 30, emoji: '⚖️',
      descripcion: 'Día 15 13:00. Tracking estoy on/off pace para KPIs del mes?' },
    { titulo: 'Reportings clientes + cobranza check', categoria: 'delivery',
      frecuencia: 'mensual', diaMes: 28, horaDefault: '15:00',
      tiempoEstimadoMin: 90, emoji: '💰',
      descripcion: 'Fin de mes. Generar PDF reportings + verificar pagos recurrentes.' },
  ];

  // Mapeo legacy → nuevo título (por si user había hábito viejo)
  const renames: Record<string, string> = {
    'Review pipeline tomorrow': 'Review pipeline + 2do round DMs',
  };
  for (const h of seedHabitos) {
    const objId = (h as any).objetivoTitulo ? objetivoIds[(h as any).objetivoTitulo] : undefined;
    const { objetivoTitulo, ...rest } = h as any;
    // Renombrá el viejo (si existe) al nuevo título antes del lookup
    for (const [oldT, newT] of Object.entries(renames)) {
      if (newT === h.titulo) {
        const [old] = await db.select().from(schema.habitos).where(eq(schema.habitos.titulo, oldT)).limit(1);
        if (old) {
          await db.update(schema.habitos).set({ titulo: newT }).where(eq(schema.habitos.id, old.id));
          console.log('↻ Hábito renombrado', oldT, '→', newT);
        }
      }
    }
    const [exists] = await db.select().from(schema.habitos).where(eq(schema.habitos.titulo, h.titulo)).limit(1);
    if (!exists) {
      await db.insert(schema.habitos).values({
        ...rest,
        objetivoId: objId ?? null,
        color: '#FF5A1F',
      } as typeof schema.habitos.$inferInsert);
      console.log('✓ Hábito', h.titulo);
    } else {
      // Update horarios/duración/descripción si cambiaron en el seed
      await db.update(schema.habitos).set({
        descripcion: rest.descripcion,
        categoria: rest.categoria,
        frecuencia: rest.frecuencia,
        diasSemana: rest.diasSemana ?? null,
        diaMes: rest.diaMes ?? null,
        horaDefault: rest.horaDefault,
        tiempoEstimadoMin: rest.tiempoEstimadoMin,
        emoji: rest.emoji ?? null,
        objetivoId: objId ?? null,
      }).where(eq(schema.habitos.id, exists.id));
      console.log('↻ Hábito actualizado', h.titulo);
    }
  }

  await client.end();
  console.log('Seed listo.');
}
main().catch((e) => { console.error(e); process.exit(1); });
