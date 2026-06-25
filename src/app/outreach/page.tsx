import { PageShell } from '@/components/page-shell';
import { CopyButton } from '@/components/copy-button';
import { MessageSquare, Filter, Ban, ShieldAlert, CheckSquare, Target, Upload, SlidersHorizontal, Sparkles } from 'lucide-react';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

type Filtro = { campo: string; valor: string };
type Nicho = { key: string; label: string; emoji: string; nota: string };

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

// Notas de conexión por nicho. Elegí la que matchee el perfil que estás mirando.
const NICHOS: Nicho[] = [
  {
    key: 'inmobiliarias', label: 'Inmobiliarias', emoji: '🏠',
    nota: 'Hola [Nombre], vi tu inmobiliaria en [ciudad]. Ayudo a inmobiliarias a no perder consultas: CRM de interesados, respuesta automática por WhatsApp y seguimiento de cada lead hasta la visita. Si te suma ordenar esa parte, conectemos.',
  },
  {
    key: 'coaches', label: 'Coaches', emoji: '🎯',
    nota: 'Hola [Nombre], vi tu trabajo como coach. Ayudo a profesionales como vos a captar y dar seguimiento a clientes con un sistema: embudos, agendado automático y respuestas listas, para que no se te escape ningún interesado. Si te interesa, conectemos.',
  },
  {
    key: 'inversiones', label: 'Inversiones / Finanzas', emoji: '📈',
    nota: 'Hola [Nombre], vi tu trabajo en el área financiera. Ayudo a asesores e inversores a sistematizar la captación y el seguimiento de clientes: CRM, onboarding y recordatorios automáticos, para escalar sin que todo dependa de vos. ¿Conectamos?',
  },
  {
    key: 'seguros', label: 'Seguros (brokers)', emoji: '🛡️',
    nota: 'Hola [Nombre], vi que trabajás en seguros. Ayudo a productores y brokers a no perder renovaciones ni leads: CRM de clientes, recordatorios de vencimientos y seguimiento automático por WhatsApp. Si te suma, conectemos.',
  },
  {
    key: 'consultoras', label: 'Consultoras / Agencias', emoji: '🧭',
    nota: 'Hola [Nombre], vi tu trabajo. Ayudo a consultoras y agencias a sistematizar su operación: pipeline de clientes, onboarding y reporting automatizado, para entregar más sin sumar caos. Si te interesa ordenar esa parte, conectemos.',
  },
];

const MSG2 = 'Gracias por conectar, [Nombre]. Te leo y me da curiosidad: hoy en [empresa], ¿qué parte de la operación te come más tiempo o depende 100% de vos? (seguimiento de clientes, carga de datos, responder consultas…)';
const MSG3 = 'Te tiro un caso por si te sirve de referencia: a un cliente le armé el sistema completo (web + app de gestión + bot de WhatsApp con IA que carga datos por audio). Hoy opera con orden y no se le escapa ningún cliente. Lo dejé documentado acá → wolfdma.website/caso-fma\nSi querés, coordinamos una llamada corta y lo vemos para tu caso.';

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
  'Tono FORMAL LATAM. Sin che/dale/loco/manija. Máx 1 emoji. 6-10 líneas. "Coordinar llamada", no "agendemos call".',
  'Variá SIEMPRE: nombre + empresa + UN detalle del perfil. Nada de copy-paste idéntico.',
  'Hablás de SU negocio (ahorrarle tiempo/plata/dolores de cabeza), no de revender ni partnership.',
  'Si no acepta en 7 días → cancelar invite y buscar otro target.',
  'NO automatizar invites (Phantombuster / Dripify / LinkedHelper). LinkedIn flag = cuenta perdida. Invites a mano.',
  'Tope: 100 invites/semana (LinkedIn flag ~200/sem).',
];
const CHECKLIST = [
  'Responder DMs pendientes',
  'Abrir Sales Navigator → Búsqueda de posibles clientes (filtros B2B abajo, ya armados)',
  'Revisar el feed de resultados (excluir empleados / empresas grandes / open-to-work)',
  '10-15 invites con nota personalizada (elegí la nota del nicho que matchea)',
  'Cargar los que avancen en el CRM',
  'Mensaje 2 a los que conectaron hace 3 días',
  'Mensaje 3 a los que respondieron y matchean',
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

      {/* NOTAS POR NICHO */}
      <div className={`${card} mb-6`}>
        <div className={headRow}><Filter size={15} /> Notas de conexión por nicho (elegí la del perfil que mirás · reemplazá [ ])</div>
        <div className="grid md:grid-cols-2 gap-3">
          {NICHOS.map((n) => (
            <div key={n.key} className="bg-fervor-ink-3 rounded-lg px-4 py-3">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-sm text-fervor-paper font-semibold">{n.emoji} {n.label}</span>
                <CopyButton text={n.nota} label="Copiar nota" />
              </div>
              <p className="text-sm text-fervor-ash leading-relaxed">{n.nota}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Mensajes 2 y 3 */}
      <div className="grid md:grid-cols-2 gap-4 mb-6">
        <div className={card}>
          <div className={headRow}><MessageSquare size={15} /> Mensaje 2 · día 3 (sin link)</div>
          <p className="text-sm text-fervor-ash leading-relaxed mb-3">{MSG2}</p>
          <CopyButton text={MSG2} label="Copiar mensaje 2" />
        </div>
        <div className={card}>
          <div className={headRow}><MessageSquare size={15} /> Mensaje 3 · día 5-7 (si matchea)</div>
          <p className="text-sm text-fervor-ash leading-relaxed mb-3 whitespace-pre-line">{MSG3}</p>
          <CopyButton text={MSG3} label="Copiar mensaje 3" />
        </div>
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
