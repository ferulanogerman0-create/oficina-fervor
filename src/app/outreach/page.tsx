import { PageShell } from '@/components/page-shell';
import { CopyButton } from '@/components/copy-button';
import { MessageSquare, Ban, ShieldAlert, CheckSquare, Target, Upload, SlidersHorizontal, Sparkles } from 'lucide-react';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

type Filtro = { campo: string; valor: string };
type Paso = { key: string; titulo: string; cuando: string; texto: string };

// ICP (2026-06-25): DUEÑOS de negocios que SEGURO viven en LinkedIn y necesitan
// CRM / automatización de procesos. B2B / profesional / financiero. FERVOR ofrece
// diagnóstico de optimización + automatización (ahorrar tiempo, plata, dolores de
// cabeza) = caso FMA replicado. NO rubros de consumo local (veterinarias, belleza,
// gastronomía, autos): no están en LinkedIn.

// Búsqueda ÚNICA en Sales Navigator (lead search). Los mismos campos que aplica
// Claude por automatización. Nivel = Propietario/socio (el dueño que siente el
// dolor y decide); el "tiene atención al cliente / procesos" se da por Industria.
const BUSQUEDA: Filtro[] = [
  { campo: 'Nivel de responsabilidad', valor: 'Propietario/socio' },
  { campo: 'Empleados en la empresa', valor: 'Autónomo · 1-10 · 11-50 · 51-200' },
  { campo: 'Ubicación', valor: 'Argentina · México · Chile · Uruguay · Colombia · Perú · España' },
  { campo: 'Idioma del perfil', valor: 'Español' },
  {
    campo: 'Industria (9)',
    valor: 'Bienes inmuebles · Formación profesional y coaching · Gestión de inversiones · Asesoría de inversión · Servicios financieros · Agencias de seguros y corretaje · Consultoría y servicios a empresas · Servicios de marketing · Servicios de publicidad',
  },
];

// Secuencia DIRECTA (2026-06-26). Mensaje 1 corto p/ generar curiosidad → la
// consulta sobre su negocio → el pitch backend + ejemplo/llamada. Sin vueltas.
const SECUENCIA: Paso[] = [
  {
    key: 'nota', titulo: 'Nota de conexión', cuando: 'con la invitación · opcional, corta',
    texto: 'Hola [Nombre], me crucé con tu perfil y me gustó lo que hacés en [empresa]. Te dejo la invitación para conectar.',
  },
  {
    key: 'm1', titulo: 'Mensaje 1 · gancho', cuando: 'apenas acepta',
    texto: 'Gracias por conectar, [Nombre]. ¿Te puedo hacer una consulta?',
  },
  {
    key: 'm2', titulo: 'Mensaje 2 · la consulta', cuando: 'cuando responde',
    texto: 'Vi tu trabajo en [empresa] y te quería consultar: ¿cómo vienen manejando hoy las redes y las consultas de clientes?',
  },
  {
    key: 'm3', titulo: 'Mensaje 3 · el pitch', cuando: 'cuando responde',
    texto: 'Te cuento por qué pregunto: trabajo en el backend de los negocios, buscando puntos de automatización para optimizar el tiempo y maximizar las ganancias. Me meto en todas las áreas — marketing, ventas, operaciones, entrega del servicio y administración. Si te interesa, te paso un ejemplo de alguien con quien trabajé y me decís si te suma, o coordinamos una llamada corta.',
  },
];

const SPOTLIGHTS = [
  'Ha publicado en LinkedIn (Actualizaciones recientes) → más activos = más responden',
  'Cambios de empleo (Actualizaciones recientes) → buen momento para hablar',
  'Contacto: 2º grado + Experiencias en común → mencionarlo sube la aceptación',
];
const EXCLUIR = [
  'Empleados en relación de dependencia (querés DUEÑOS/SOCIOS que deciden, no Jefe de RRHH / gerente empleado)',
  'Ejecutivos de empresas grandes que figuran "Propietario/socio" por otra entidad → mirá que el negocio actual sea chico',
  'Recruiter / Headhunter / RRHH in-house',
  'Estudiante · perfiles con badge "Open to work" prominente',
];
const REGLAS = [
  'Tono DIRECTO y profesional, sin vueltas ni relleno. Frases cortas. Sin che/dale/loco. Máx 1 emoji.',
  'No vendas en el Mensaje 1 — curiosidad primero. El pitch recién va en el 3.',
  'Adaptá la consulta del Mensaje 2 a lo que hace el perfil (redes / consultas / seguimiento / turnos / cobranzas).',
  'Variá: nombre + empresa + UN detalle del perfil. Nada de copy-paste idéntico.',
  'Si no acepta en 7 días → cancelar invite y buscar otro target.',
  'NO automatizar invites (Phantombuster / Dripify / LinkedHelper). LinkedIn flag = cuenta perdida. Invites a mano.',
  'Tope: 100 invites/semana (LinkedIn flag ~200/sem).',
];
const CHECKLIST = [
  'Responder DMs pendientes',
  'Abrir Sales Navigator → Búsqueda de posibles clientes (filtros B2B abajo, ya armados)',
  'Revisar el feed de resultados (excluir empleados / empresas grandes / open-to-work)',
  '10-15 invites (con nota corta opcional)',
  'Mensaje 1 apenas aceptan ("¿te puedo hacer una consulta?")',
  'Mensaje 2 (la consulta) cuando responden',
  'Mensaje 3 (el pitch + ejemplo/llamada) cuando enganchan',
  'Cargar los que avancen en el CRM',
];

const card = 'rounded-xl border border-fervor-border bg-fervor-ink-2 p-5';
const headRow = 'flex items-center gap-2 text-fervor-flame mb-3 font-mono text-xs uppercase tracking-wider';

function FiltroRow({ f }: { f: Filtro }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-baseline gap-0.5 sm:gap-3 py-1.5 border-b border-fervor-border/50 last:border-0">
      <span className="text-xs font-mono uppercase tracking-wider text-fervor-smoke sm:w-44 shrink-0">{f.campo}</span>
      <span className="text-sm text-fervor-ash">{f.valor}</span>
    </div>
  );
}

export default function OutreachPage() {
  return (
    <PageShell
      kicker="Sales Navigator · dueños B2B LATAM · 10-15 invites/día · 10:15"
      title="Outreach"
      actions={
        <div className="flex items-center gap-2">
          <Link href="/crm/importar" className="px-3 py-1.5 rounded-lg text-sm border border-fervor-border text-fervor-smoke hover:text-fervor-flame hover:border-fervor-flame transition-colors flex items-center gap-1.5"><Upload size={14} /> Importar contactos</Link>
          <Link href="/crm" className="btn-primary text-sm shadow-flame flex items-center gap-1.5"><Target size={14} /> Ir al CRM</Link>
        </div>
      }
    >
      <div className="mb-5 text-sm text-fervor-smoke">
        <b className="text-fervor-ash">Dueños de negocios B2B que viven en LinkedIn</b> y necesitan CRM / automatizar procesos — inmobiliarias, coaches, inversiones y finanzas, seguros, consultoras y agencias. Les ofrecés un <b className="text-fervor-ash">diagnóstico de optimización + automatización</b> (ahorrarles tiempo, plata y dolores de cabeza) = el caso FMA replicado. <b className="text-fervor-ash">NO</b> rubros de consumo local (veterinarias, belleza, gastronomía, autos): no están en LinkedIn.
      </div>

      {/* BÚSQUEDA ÚNICA */}
      <div className="mb-6 rounded-xl border border-fervor-flame/40 bg-fervor-flame/5 p-5">
        <div className="flex items-center gap-2 text-fervor-flame mb-1 font-mono text-xs uppercase tracking-wider">
          <SlidersHorizontal size={15} /> Búsqueda B2B · filtros a seleccionar
        </div>
        <div className="text-sm text-fervor-smoke mb-3">Sales Navigator → <b className="text-fervor-ash">Búsqueda de posibles clientes</b>. Una sola búsqueda para todos los nichos.</div>
        <div className="bg-fervor-ink-3 rounded-lg px-4 py-2">
          {BUSQUEDA.map((f, i) => <FiltroRow key={i} f={f} />)}
        </div>
        <div className="mt-3 flex items-start gap-2 text-xs text-fervor-smoke">
          <Sparkles size={13} className="text-fervor-flame mt-0.5 shrink-0" />
          <span>Spotlights opcionales (tildar para priorizar): {SPOTLIGHTS.join(' · ')}</span>
        </div>
      </div>

      {/* SECUENCIA DE MENSAJES */}
      <div className={`${card} mb-6`}>
        <div className={headRow}><MessageSquare size={15} /> Secuencia de mensajes · directa (reemplazá [ ])</div>
        <div className="flex flex-col gap-3">
          {SECUENCIA.map((p, i) => (
            <div key={p.key} className="bg-fervor-ink-3 rounded-lg px-4 py-3">
              <div className="flex items-center justify-between mb-1.5 gap-3">
                <div className="flex items-baseline gap-2 min-w-0">
                  <span className="text-fervor-flame font-mono text-xs shrink-0">{i === 0 ? '·' : i}</span>
                  <span className="text-sm text-fervor-paper font-semibold">{p.titulo}</span>
                  <span className="text-[11px] font-mono uppercase tracking-wider text-fervor-smoke truncate">{p.cuando}</span>
                </div>
                <CopyButton text={p.texto} label="Copiar" />
              </div>
              <p className="text-sm text-fervor-ash leading-relaxed">{p.texto}</p>
            </div>
          ))}
        </div>
        <p className="text-xs text-fervor-smoke mt-3">Curiosidad → consulta sobre SU negocio → pitch. El caso/link y la llamada recién en el Mensaje 3.</p>
      </div>

      {/* Excluir + Reglas */}
      <div className="grid md:grid-cols-2 gap-4 mb-6">
        <div className={card}>
          <div className={headRow}><Ban size={15} /> Excluir siempre</div>
          <ul className="space-y-1.5 text-sm text-fervor-ash">
            {EXCLUIR.map((f, i) => <li key={i} className="flex gap-2"><span className="text-alert">✕</span>{f}</li>)}
          </ul>
        </div>
        <div className={card}>
          <div className={headRow}><ShieldAlert size={15} /> Reglas duras</div>
          <ul className="space-y-2 text-sm text-fervor-ash">
            {REGLAS.map((r, i) => <li key={i} className="flex gap-2"><span className="text-fervor-flame font-mono text-xs mt-0.5">{i + 1}</span>{r}</li>)}
          </ul>
        </div>
      </div>

      {/* Checklist */}
      <div className={card}>
        <div className={headRow}><CheckSquare size={15} /> Checklist diario (10:15)</div>
        <ul className="grid md:grid-cols-2 gap-x-8 gap-y-2 text-sm text-fervor-ash">
          {CHECKLIST.map((c, i) => <li key={i} className="flex gap-2 items-start"><span className="mt-1 w-3.5 h-3.5 rounded border border-fervor-smoke shrink-0" />{c}</li>)}
        </ul>
      </div>

      <div className="mt-6 text-center text-xs text-fervor-smoke font-mono">
        Apuntá a dueños · ahorrales tiempo, plata y dolores de cabeza · diagnóstico primero, venta después
      </div>
    </PageShell>
  );
}
