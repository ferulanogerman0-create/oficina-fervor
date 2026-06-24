import { PageShell } from '@/components/page-shell';
import { CopyButton } from '@/components/copy-button';
import { Search, MessageSquare, Filter, Ban, ShieldAlert, CheckSquare, Target, Upload, CalendarClock } from 'lucide-react';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

type Tanda = {
  key: string; dia: number; label: string; emoji: string;
  busquedas: string[]; nota: string;
};

const TANDAS: Tanda[] = [
  {
    key: 'agencias', dia: 1, label: 'Agencias chicas LATAM', emoji: '🏢',
    busquedas: [
      '"Director de agencia" OR "Owner agencia" OR "Fundador agencia"',
      '"Account Manager" AND "agencia marketing"',
      '"Cuentas" AND "agencia publicidad"',
      '"Head of Operations" AND "agencia"',
    ],
    nota: 'Hola [Nombre], vi que llevás [agencia] en [ciudad]. Trabajo con agencias chicas dando delivery tech (apps PyME, bots WhatsApp, automatización) bajo white-label. Si te suma para escalar sin sumar headcount, conectemos.',
  },
  {
    key: 'consultores', dia: 2, label: 'Consultores PyMEs', emoji: '🧭',
    busquedas: [
      '"Consultor PyMEs" OR "Consultor pequeñas empresas"',
      '"Asesor de negocios" AND LATAM',
      '"Business Coach" AND "empresarios"',
      '"Mentor de emprendedores"',
    ],
    nota: 'Hola [Nombre], vi tu trabajo con PyMEs. Yo armo el lado tech (gestión + automatización WhatsApp + web) para los negocios que vos asesorás. Quizás suma cruzar referidos. ¿Conectamos?',
  },
  {
    key: 'contadores', dia: 3, label: 'Contadores / Asesores', emoji: '📊',
    busquedas: [
      '"Contador público" AND "PyMEs"',
      '"Estudio contable"',
      '"Asesor impositivo" AND "emprendedores"',
    ],
    nota: 'Hola [Nombre], vi tu trabajo con PyMEs. Yo armo el lado tech (gestión + automatización WhatsApp + web) para los negocios que vos asesorás. Quizás suma cruzar referidos. ¿Conectamos?',
  },
  {
    key: 'saas', dia: 4, label: 'Founders SaaS LATAM', emoji: '🚀',
    busquedas: [
      '"CEO" AND "SaaS" AND LATAM',
      '"Founder" AND "startup" AND "early stage"',
      '"Co-fundador" AND "software"',
    ],
    nota: 'Hola [Nombre], me crucé con [empresa]. Yo armo branding + landing + ads para SaaS LATAM en early stage. Si estás en momento de salir a vender o mejorar funnel, conectemos.',
  },
  {
    key: 'marketers', dia: 5, label: 'Marketers / Performance', emoji: '📈',
    busquedas: [
      '"Marketing Manager" AND "freelance"',
      '"Performance Marketing" AND "PyME"',
      '"Growth" AND "consultor"',
    ],
    nota: 'Hola [Nombre], vi tu trabajo en performance. Yo armo la parte tech (landings rápidas, bots WA, app de gestión) para los clientes que tomás. Conectemos por si surge match.',
  },
];

const MSG2 = 'Gracias por conectar, [Nombre]. Te leo y me da curiosidad: hoy en [empresa], ¿qué parte de la operación te come más tiempo o depende 100% de vos?';
const MSG3 = 'Te tiro un caso por si te sirve de referencia: a un cliente le armé el sistema completo (web + app de gestión + bot de WhatsApp con IA). Hoy opera con orden. Lo dejé documentado acá → wolfdma.website/caso-fma\nSi querés, coordinamos una llamada corta y lo vemos para tu caso.';

const FILTROS = [
  'Ubicación: Argentina + Chile + Uruguay + Colombia + México + Perú + España',
  'Conexiones: 2nd + 3rd',
  'Sector: Marketing y publicidad · Diseño · Servicios financieros · Software · Consultoría',
  'Idioma del perfil: Español',
];
const EXCLUIR = ['Recruiter / Headhunter', 'SDR / Sales Development Rep', 'Estudiante / Student', 'Perfiles con badge "Open to work" prominente'];
const REGLAS = [
  'Tono FORMAL LATAM. Sin che/dale/loco/manija. Máx 1 emoji. 6-10 líneas. "Coordinar llamada", no "agendemos call".',
  'Variá SIEMPRE: nombre + empresa + UN detalle del perfil. Nada de copy-paste idéntico.',
  'Si no acepta en 7 días → cancelar invite y buscar otro target.',
  'NO automatizar (Phantombuster / Dripify / LinkedHelper). LinkedIn flag = cuenta perdida.',
  'Tope: 100 invites/semana (LinkedIn flag ~200/sem).',
];
const CHECKLIST = [
  'Responder DMs pendientes',
  'Buscar con la búsqueda del día',
  'Filtrar (excluir recruiters / estudiantes / open-to-work)',
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
  const tanda = TANDAS.find((t) => t.dia === d) ?? null;
  return { tanda, diaLabel: diaNames[d], finde: d === 0 || d === 6 };
}

const card = 'rounded-xl border border-fervor-border bg-fervor-ink-2 p-5';
const headRow = 'flex items-center gap-2 text-fervor-flame mb-3 font-mono text-xs uppercase tracking-wider';

export default function OutreachPage() {
  const { tanda, diaLabel, finde } = tandaDeHoy();

  return (
    <PageShell
      kicker="LinkedIn · 10-15 invites/día · slot 10:15"
      title="Outreach"
      actions={
        <div className="flex items-center gap-2">
          <Link href="/crm/importar" className="px-3 py-1.5 rounded-lg text-sm border border-fervor-border text-fervor-smoke hover:text-fervor-flame hover:border-fervor-flame transition-colors flex items-center gap-1.5"><Upload size={14} /> Importar contactos</Link>
          <Link href="/crm" className="btn-primary text-sm shadow-flame flex items-center gap-1.5"><Target size={14} /> Ir al CRM</Link>
        </div>
      }
    >
      {/* HOY */}
      <div className="mb-6 rounded-xl border border-fervor-flame/40 bg-fervor-flame/5 p-5">
        <div className="flex items-center gap-2 text-fervor-flame mb-1 font-mono text-xs uppercase tracking-wider">
          <CalendarClock size={15} /> {diaLabel} · tanda de hoy
        </div>
        {finde && <div className="text-sm text-fervor-smoke mb-3">Fin de semana — no hay tanda asignada. Te dejo la del lunes (Agencias) por si querés adelantar.</div>}
        {tanda && (
          <>
            <div className="font-display text-2xl text-fervor-paper mb-4">{tanda.emoji} {tanda.label}</div>
            <div className="space-y-2">
              {tanda.busquedas.map((b, i) => (
                <div key={i} className="flex items-center gap-2 justify-between bg-fervor-ink-3 rounded-lg px-3 py-2">
                  <code className="text-xs text-fervor-ash font-mono break-all pr-2">{b}</code>
                  <CopyButton text={b} className="shrink-0" />
                </div>
              ))}
            </div>
            <div className="mt-4 pt-4 border-t border-fervor-border">
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

      {/* Todas las tandas (referencia) */}
      <div className={`${card} mb-6`}>
        <div className={headRow}><Search size={15} /> Rotación semanal — todas las tandas</div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
          {TANDAS.map((t) => (
            <div key={t.key} className="rounded-lg border border-fervor-border bg-fervor-ink-3 p-3">
              <div className="text-sm text-fervor-paper font-semibold mb-1">{t.emoji} {t.label}</div>
              <div className="text-[10px] font-mono uppercase tracking-wider text-fervor-smoke mb-2">{['Lunes','Martes','Miércoles','Jueves','Viernes'][t.dia-1]}</div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-fervor-smoke">{t.busquedas.length} búsquedas + nota</span>
                <CopyButton text={t.nota} label="Nota" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Filtros + Excluir */}
      <div className="grid md:grid-cols-2 gap-4 mb-6">
        <div className={card}>
          <div className={headRow}><Filter size={15} /> Filtros (búsqueda gratuita)</div>
          <ul className="space-y-1.5 text-sm text-fervor-ash">
            {FILTROS.map((f, i) => <li key={i} className="flex gap-2"><span className="text-fervor-flame">·</span>{f}</li>)}
          </ul>
        </div>
        <div className={card}>
          <div className={headRow}><Ban size={15} /> Excluir siempre</div>
          <ul className="space-y-1.5 text-sm text-fervor-ash">
            {EXCLUIR.map((f, i) => <li key={i} className="flex gap-2"><span className="text-alert">✕</span>{f}</li>)}
          </ul>
        </div>
      </div>

      {/* Reglas + Checklist */}
      <div className="grid md:grid-cols-2 gap-4">
        <div className={card}>
          <div className={headRow}><ShieldAlert size={15} /> Reglas duras</div>
          <ul className="space-y-2 text-sm text-fervor-ash">
            {REGLAS.map((r, i) => <li key={i} className="flex gap-2"><span className="text-fervor-flame font-mono text-xs mt-0.5">{i+1}</span>{r}</li>)}
          </ul>
        </div>
        <div className={card}>
          <div className={headRow}><CheckSquare size={15} /> Checklist diario (10:15)</div>
          <ul className="space-y-2 text-sm text-fervor-ash">
            {CHECKLIST.map((c, i) => <li key={i} className="flex gap-2 items-start"><span className="mt-1 w-3.5 h-3.5 rounded border border-fervor-smoke shrink-0" />{c}</li>)}
          </ul>
        </div>
      </div>

      <div className="mt-6 text-center text-xs text-fervor-smoke font-mono">
        Meta 90 días: 200-300 conexiones · 30-50 charlas · 8-12 calls · 2-3 clientes
      </div>
    </PageShell>
  );
}
