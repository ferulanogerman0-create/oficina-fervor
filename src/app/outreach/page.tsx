import { PageShell } from '@/components/page-shell';
import { CopyButton } from '@/components/copy-button';
import { MessageSquare, Filter, Ban, ShieldAlert, CheckSquare, Target, Upload, CalendarClock, SlidersHorizontal, Sparkles } from 'lucide-react';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

type Filtro = { campo: string; valor: string };
type Tanda = {
  key: string; dia: number; label: string; emoji: string;
  filtros: Filtro[];   // selecciones en los desplegables de Sales Navigator
  cargo: string;       // campo "Cargo actual" (se escribe)
  keywords: string;    // campo "Palabras clave" (se pega, booleano)
  nota: string;
};

// ICP: clientes FINALES — negocios tradicionales con operación compleja
// (clientes, datos, CRM, flujo de conversaciones, inventario) que SÍ viven
// en LinkedIn. FERVOR ordena + automatiza SU operación. No partnership.
const TANDAS: Tanda[] = [
  {
    key: 'abogados', dia: 1, label: 'Estudios jurídicos', emoji: '⚖️',
    filtros: [
      { campo: 'Industria', valor: 'Servicios jurídicos · Práctica de la abogacía' },
      { campo: 'Empleados en la empresa', valor: '1-10 · 11-50' },
      { campo: 'Nivel de responsabilidad', valor: 'Propietario · Socio · Director' },
      { campo: 'Función', valor: 'Servicios jurídicos · Emprendimiento' },
    ],
    cargo: 'Abogado OR Socio OR Titular OR Fundador',
    keywords: '("estudio jurídico" OR abogados OR "law firm") NOT recruiter',
    nota: 'Hola [Nombre], vi tu estudio en [ciudad]. Ayudo a estudios jurídicos a ordenar y automatizar su operación: seguimiento de casos, intake de consultas y recordatorios de vencimientos, para que no dependa de estar encima de todo. Si te interesa, conectemos.',
  },
  {
    key: 'contadores', dia: 2, label: 'Estudios contables', emoji: '📊',
    filtros: [
      { campo: 'Industria', valor: 'Contabilidad · Servicios financieros' },
      { campo: 'Empleados en la empresa', valor: 'Trabajador independiente · 1-10 · 11-50' },
      { campo: 'Nivel de responsabilidad', valor: 'Propietario · Socio · Director' },
      { campo: 'Función', valor: 'Contabilidad · Finanzas' },
    ],
    cargo: 'Contador OR Socio OR Titular OR Fundador',
    keywords: '("estudio contable" OR contadores OR "contador público") NOT recruiter',
    nota: 'Hola [Nombre], vi tu estudio contable en [ciudad]. Ayudo a contadores a automatizar lo repetitivo: seguimiento de clientes, pedido de documentación y recordatorios de vencimientos. Menos tareas a mano, más control. ¿Conectamos?',
  },
  {
    key: 'inmobiliarias', dia: 3, label: 'Inmobiliarias', emoji: '🏠',
    filtros: [
      { campo: 'Industria', valor: 'Bienes inmuebles · Servicios inmobiliarios' },
      { campo: 'Empleados en la empresa', valor: '1-10 · 11-50' },
      { campo: 'Nivel de responsabilidad', valor: 'Propietario · Socio · Director · Gerente' },
      { campo: 'Función', valor: 'Ventas · Emprendimiento · Operaciones' },
    ],
    cargo: 'Director OR Titular OR Broker OR Martillero OR Fundador',
    keywords: '(inmobiliaria OR "bienes raíces" OR "real estate") NOT recruiter',
    nota: 'Hola [Nombre], vi tu inmobiliaria en [ciudad]. Ayudo a inmobiliarias a no perder consultas: CRM de interesados, respuesta automática por WhatsApp y seguimiento de cada lead hasta la visita. Si te suma, conectemos.',
  },
  {
    key: 'consultores', dia: 4, label: 'Consultores (empresa · finanzas · RRHH)', emoji: '🧭',
    filtros: [
      { campo: 'Industria', valor: 'Consultoría y servicios a empresas · Recursos humanos · Servicios financieros' },
      { campo: 'Empleados en la empresa', valor: 'Trabajador independiente · 1-10 · 11-50' },
      { campo: 'Nivel de responsabilidad', valor: 'Propietario · Socio · CXO' },
      { campo: 'Función', valor: 'Consultoría · Recursos humanos · Finanzas' },
    ],
    cargo: 'Consultor OR Asesor OR Fundador',
    keywords: '(consultor OR asesor) AND (empresas OR negocios OR financiero OR "recursos humanos") NOT recruiter',
    nota: 'Hola [Nombre], vi tu trabajo como consultor. Ayudo a consultores a sistematizar su operación: pipeline de clientes, onboarding y seguimiento automatizado, para escalar sin que todo dependa de vos. ¿Conectamos?',
  },
  {
    key: 'coaches', dia: 5, label: 'Coaches e inversionistas', emoji: '🎯',
    filtros: [
      { campo: 'Industria', valor: 'Coaching y desarrollo profesional · Servicios financieros' },
      { campo: 'Empleados en la empresa', valor: 'Trabajador independiente · 1-10' },
      { campo: 'Nivel de responsabilidad', valor: 'Propietario · Socio' },
      { campo: 'Función', valor: 'Emprendimiento · Consultoría · Finanzas' },
    ],
    cargo: 'Coach OR "Business Coach" OR Inversionista OR "Asesor financiero"',
    keywords: '(coach OR mentor OR inversionista OR "asesor financiero") NOT recruiter',
    nota: 'Hola [Nombre], vi tu trabajo. Ayudo a profesionales como vos a captar y dar seguimiento a clientes con un sistema: embudos, agendado y respuestas automáticas. Si te interesa ordenar esa parte, conectemos.',
  },
];

const MSG2 = 'Gracias por conectar, [Nombre]. Te leo y me da curiosidad: hoy en [empresa], ¿qué parte de la operación te come más tiempo o depende 100% de vos? (seguimiento de clientes, carga de datos, responder consultas…)';
const MSG3 = 'Te tiro un caso por si te sirve de referencia: a un cliente le armé el sistema completo (web + app de gestión + bot de WhatsApp con IA que carga datos por audio). Hoy opera con orden y no se le escapa ningún cliente. Lo dejé documentado acá → wolfdma.website/caso-fma\nSi querés, coordinamos una llamada corta y lo vemos para tu caso.';

const FILTROS_BASE: Filtro[] = [
  { campo: 'Ubicación', valor: 'Argentina · Chile · Uruguay · Colombia · México · Perú · España' },
  { campo: 'Idioma del perfil', valor: 'Español' },
  { campo: 'Nivel de responsabilidad', valor: 'Propietario · Socio · Director (que SIENTAN el dolor + decidan)' },
];
const SPOTLIGHTS = [
  'Ha publicado en LinkedIn (Actualizaciones recientes) → más activos = más responden',
  'Cambios de empleo (Actualizaciones recientes) → buen momento para hablar',
  'Contacto: 2º grado + Experiencias en común → mencionarlo sube la aceptación',
];
const EXCLUIR = [
  'Recruiter / Headhunter (ya va NOT recruiter en Palabras clave)',
  'Empleados en relación de dependencia (querés DUEÑOS/SOCIOS que deciden)',
  'Estudiante / Student',
  'Perfiles con badge "Open to work" prominente',
];
const REGLAS = [
  'Tono FORMAL LATAM. Sin che/dale/loco/manija. Máx 1 emoji. 6-10 líneas. "Coordinar llamada", no "agendemos call".',
  'Variá SIEMPRE: nombre + empresa + UN detalle del perfil. Nada de copy-paste idéntico.',
  'Hablás de SU negocio (cliente final), no de revender ni partnership.',
  'Si no acepta en 7 días → cancelar invite y buscar otro target.',
  'NO automatizar (Phantombuster / Dripify / LinkedHelper). LinkedIn flag = cuenta perdida.',
  'Tope: 100 invites/semana (LinkedIn flag ~200/sem).',
];
const CHECKLIST = [
  'Responder DMs pendientes',
  'Abrir Sales Navigator → Búsqueda de leads',
  'Rellenar los filtros de la tanda del día (abajo)',
  'Filtrar (excluir recruiters / empleados / estudiantes / open-to-work)',
  '10-15 invites con nota personalizada',
  'Cargar los que avancen en el CRM',
  'Mensaje 2 a los que conectaron hace 3 días',
  'Mensaje 3 a los que respondieron y matchean',
];

function tandaDeHoy(): { tanda: Tanda | null; diaLabel: string; finde: boolean } {
  const wd = new Intl.DateTimeFormat('en-US', { timeZone: 'America/Argentina/Buenos_Aires', weekday: 'short' }).format(new Date());
  const map: Record<string, number> = { Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6, Sun: 0 };
  const diaNames: Record<number, string> = { 1: 'Lunes', 2: 'Martes', 3: 'Miércoles', 4: 'Jueves', 5: 'Viernes', 6: 'Sábado', 0: 'Domingo' };
  const d = map[wd] ?? 1;
  const tanda = TANDAS.find((t) => t.dia === d) ?? TANDAS[0];
  return { tanda, diaLabel: diaNames[d], finde: d === 0 || d === 6 };
}

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
  const { tanda, diaLabel, finde } = tandaDeHoy();

  return (
    <PageShell
      kicker="Sales Navigator · clientes finales · 10-15 invites/día · 10:15"
      title="Outreach"
      actions={
        <div className="flex items-center gap-2">
          <Link href="/crm/importar" className="px-3 py-1.5 rounded-lg text-sm border border-fervor-border text-fervor-smoke hover:text-fervor-flame hover:border-fervor-flame transition-colors flex items-center gap-1.5"><Upload size={14} /> Importar contactos</Link>
          <Link href="/crm" className="btn-primary text-sm shadow-flame flex items-center gap-1.5"><Target size={14} /> Ir al CRM</Link>
        </div>
      }
    >
      <div className="mb-5 text-sm text-fervor-smoke">
        <b className="text-fervor-ash">Clientes finales</b> — negocios tradicionales que manejan clientes, datos, CRM y flujo de conversaciones (estudios jurídicos y contables, inmobiliarias, consultores, coaches). FERVOR <b className="text-fervor-ash">ordena y automatiza SU operación</b>. Armado para <b className="text-fervor-ash">Sales Navigator</b>; sin SN usá los campos Cargo + Palabras clave en la búsqueda normal.
      </div>

      {/* FILTROS BASE */}
      <div className={`${card} mb-6`}>
        <div className={headRow}><Filter size={15} /> Filtros base de Sales Navigator (siempre)</div>
        <div className="grid md:grid-cols-2 gap-x-8">
          <div>{FILTROS_BASE.map((f, i) => <FiltroRow key={i} f={f} />)}</div>
          <div className="mt-4 md:mt-0">
            <div className="flex items-center gap-2 text-fervor-flame mb-2 font-mono text-[11px] uppercase tracking-wider"><Sparkles size={13} /> Spotlights (tildar, opcional)</div>
            <ul className="space-y-1.5 text-sm text-fervor-ash">
              {SPOTLIGHTS.map((s, i) => <li key={i} className="flex gap-2"><span className="text-fervor-flame">·</span>{s}</li>)}
            </ul>
          </div>
        </div>
      </div>

      {/* TANDA DE HOY */}
      <div className="mb-6 rounded-xl border border-fervor-flame/40 bg-fervor-flame/5 p-5">
        <div className="flex items-center gap-2 text-fervor-flame mb-1 font-mono text-xs uppercase tracking-wider">
          <CalendarClock size={15} /> {diaLabel} · tanda de hoy
        </div>
        {finde && <div className="text-sm text-fervor-smoke mb-3">Fin de semana — no hay tanda asignada. Te dejo la del lunes (Estudios jurídicos) por si querés adelantar.</div>}
        {tanda && (
          <>
            <div className="font-display text-2xl text-fervor-paper mb-4">{tanda.emoji} {tanda.label}</div>

            <div className="flex items-center gap-2 text-fervor-smoke mb-1 font-mono text-[11px] uppercase tracking-wider"><SlidersHorizontal size={13} /> Filtros a seleccionar</div>
            <div className="bg-fervor-ink-3 rounded-lg px-4 py-2 mb-4">
              {tanda.filtros.map((f, i) => <FiltroRow key={i} f={f} />)}
            </div>

            <div className="grid md:grid-cols-2 gap-3 mb-4">
              <div className="bg-fervor-ink-3 rounded-lg px-4 py-3">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[11px] font-mono uppercase tracking-wider text-fervor-smoke">Cargo actual (escribir)</span>
                  <CopyButton text={tanda.cargo} />
                </div>
                <code className="text-xs text-fervor-ash font-mono break-all">{tanda.cargo}</code>
              </div>
              <div className="bg-fervor-ink-3 rounded-lg px-4 py-3">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[11px] font-mono uppercase tracking-wider text-fervor-smoke">Palabras clave (pegar)</span>
                  <CopyButton text={tanda.keywords} />
                </div>
                <code className="text-xs text-fervor-ash font-mono break-all">{tanda.keywords}</code>
              </div>
            </div>

            <div className="pt-4 border-t border-fervor-border">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-mono uppercase tracking-wider text-fervor-smoke">Nota de conexión (reemplazá [ ])</span>
                <CopyButton text={tanda.nota} label="Copiar nota" />
              </div>
              <p className="text-sm text-fervor-ash leading-relaxed">{tanda.nota}</p>
            </div>
          </>
        )}
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

      {/* Rotación semanal */}
      <div className={`${card} mb-6`}>
        <div className={headRow}><CalendarClock size={15} /> Rotación semanal</div>
        <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-3">
          {TANDAS.map((t) => (
            <div key={t.key} className="rounded-lg border border-fervor-border bg-fervor-ink-3 p-3">
              <div className="text-[10px] font-mono uppercase tracking-wider text-fervor-smoke mb-1">{['Lunes','Martes','Miércoles','Jueves','Viernes'][t.dia-1]}</div>
              <div className="text-sm text-fervor-paper font-semibold leading-tight">{t.emoji} {t.label}</div>
            </div>
          ))}
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
            {REGLAS.map((r, i) => <li key={i} className="flex gap-2"><span className="text-fervor-flame font-mono text-xs mt-0.5">{i+1}</span>{r}</li>)}
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
        Al principio tomá lo que venga · redirigí de a poco hacia estos clientes ideales
      </div>
    </PageShell>
  );
}
