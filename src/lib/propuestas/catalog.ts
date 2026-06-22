// Catálogo de servicios FERVOR p/ propuestas (del PDF estrategia 90d)
export type Servicio = {
  key: string;
  label: string;
  descripcion: string;
  setupMin: number;
  setupMax: number;
  mrrMin: number;
  mrrMax: number;
  tags: string[];
};

export const SERVICIOS: Servicio[] = [
  {
    key: 'app_pyme',
    label: 'App interna PyME (gestión)',
    descripcion: 'PWA multi-pantalla: presupuestos → órdenes → caja → cobranza. Mobile-first. Login + roles. Login con Google opcional.',
    setupMin: 500, setupMax: 1500, mrrMin: 300, mrrMax: 500,
    tags: ['delivery', 'app'],
  },
  {
    key: 'bot_wa',
    label: 'Bot WhatsApp + agente IA',
    descripcion: 'Bot de WhatsApp Business API (Evolution) + agente IA (audios + texto) que maneja consultas, agenda, cotizaciones y deriva a operadores.',
    setupMin: 800, setupMax: 2000, mrrMin: 300, mrrMax: 600,
    tags: ['delivery', 'ia'],
  },
  {
    key: 'web_landing',
    label: 'Web + landing + tracking',
    descripcion: 'Sitio web profesional + landing dedicada con lead form + pixel propio + Meta Pixel + tracking centralizado en oficina FERVOR.',
    setupMin: 400, setupMax: 1200, mrrMin: 100, mrrMax: 300,
    tags: ['marketing', 'web'],
  },
  {
    key: 'ads_campaign',
    label: 'Campañas Meta Ads (IG + FB)',
    descripcion: 'Estrategia + creativos + setup + gestión Meta Ads. Reportes mensuales con costo por lead, ROI, alcance. Optimización continua A/B.',
    setupMin: 300, setupMax: 800, mrrMin: 400, mrrMax: 800,
    tags: ['marketing', 'ads'],
  },
  {
    key: 'branding',
    label: 'Branding + identidad visual',
    descripcion: 'Estrategia de marca + logo + paleta + tipografía + tono de voz + sistema aplicado a redes y materiales.',
    setupMin: 600, setupMax: 1500, mrrMin: 0, mrrMax: 0,
    tags: ['marketing', 'branding'],
  },
  {
    key: 'contenido_mensual',
    label: 'Contenido mensual IG (8-12 piezas)',
    descripcion: '8-12 piezas mensuales (carruseles + reels + stories) producidas con tu identidad. Calendario + publicación + community light.',
    setupMin: 0, setupMax: 300, mrrMin: 350, mrrMax: 700,
    tags: ['marketing', 'contenido'],
  },
  {
    key: 'combo_completo',
    label: 'Combo: App + Bot + Web + Marketing',
    descripcion: 'Stack completo FERVOR: sistema operativo + bot + landing + ads + branding + contenido mensual. Lo recomendado para PyMEs serias.',
    setupMin: 1500, setupMax: 3000, mrrMin: 700, mrrMax: 1200,
    tags: ['delivery', 'marketing', 'combo'],
  },
  {
    key: 'partnership_whitelabel',
    label: 'Partnership white-label (agencias)',
    descripcion: 'Delivery tech para agencias chicas: apps + bots + automatizaciones que vos vendés con tu marca al cliente final.',
    setupMin: 0, setupMax: 0, mrrMin: 500, mrrMax: 2000,
    tags: ['partnership'],
  },
];

export function getServicio(key: string): Servicio | undefined {
  return SERVICIOS.find((s) => s.key === key);
}

export type LineaSeleccionada = {
  key: string;
  label: string;
  descripcion: string;
  setup: number;
  mrr: number;
};

export function totalesFrom(lineas: LineaSeleccionada[]) {
  const setupTotal = lineas.reduce((acc, l) => acc + (Number(l.setup) || 0), 0);
  const mrrTotal = lineas.reduce((acc, l) => acc + (Number(l.mrr) || 0), 0);
  return { setupTotal, mrrTotal };
}
