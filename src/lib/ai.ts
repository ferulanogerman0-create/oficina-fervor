import 'server-only';

const API = 'https://api.anthropic.com/v1/messages';
const MODEL = 'claude-sonnet-4-6';

export function aiEnabled() {
  return !!process.env.ANTHROPIC_API_KEY;
}

async function callClaude(system: string, user: string, maxTokens = 1200): Promise<string> {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) throw new Error('ANTHROPIC_API_KEY no configurada');
  const res = await fetch(API, {
    method: 'POST',
    headers: {
      'x-api-key': key,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: maxTokens,
      system,
      messages: [{ role: 'user', content: user }],
    }),
  });
  if (!res.ok) {
    const t = await res.text().catch(() => '');
    throw new Error(`Anthropic ${res.status}: ${t.slice(0, 300)}`);
  }
  const data = await res.json();
  return (data?.content?.[0]?.text ?? '').trim();
}

function parseJSON<T>(raw: string): T {
  let s = raw.trim();
  // sacar fences ```json ... ```
  const fence = s.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fence) s = fence[1].trim();
  // primer { o [ hasta el último } o ]
  const start = s.search(/[{[]/);
  if (start > 0) s = s.slice(start);
  return JSON.parse(s) as T;
}

// ====== BAÚL DE GANCHOS: texto → plantilla reusable ======
export type GanchoAI = { plantilla: string; angulos: string[]; tipo: string; nicho: string };

export async function ganchoToPlantilla(texto: string, contexto?: string): Promise<GanchoAI> {
  const system = `Sos un estratega de contenido para FERVOR (agencia que ordena, automatiza y escala negocios en LATAM).
Te paso un gancho (hook) de un reel/post. Convertilo en una PLANTILLA REUSABLE: reemplazá lo específico por [variables] entre corchetes para que sirva en cualquier nicho.
Devolvé SOLO JSON con este formato exacto:
{"plantilla":"...", "angulos":["...","...","..."], "tipo":"pregunta|contraste|lista|historia|dato|polemica|promesa", "nicho":"automotriz|saas|agencias|contable|marketing|general"}
- plantilla: el gancho con [variables], directo y reusable.
- angulos: 3 ángulos distintos para reusar este gancho en contenido de FERVOR o sus clientes.
- tipo: clasificá el tipo de gancho.
- nicho: el nicho más probable (si es genérico, "general").
Español rioplatense, sin relleno.`;
  const user = `Gancho: "${texto}"${contexto ? `\nContexto: ${contexto}` : ''}`;
  return parseJSON<GanchoAI>(await callClaude(system, user, 900));
}

// ====== GUION desde un gancho ======
export type GuionAI = { titulo: string; guion: string };

export async function generarGuion(gancho: string, formato: string, plataforma: string): Promise<GuionAI> {
  const system = `Sos guionista de contenido de FERVOR. Te doy un gancho y armás un guion ${formato} para ${plataforma}.
Devolvé SOLO JSON: {"titulo":"...", "guion":"..."}
- titulo: título corto del contenido.
- guion: guion completo listo para grabar/diseñar. Para reel: hook + desarrollo + CTA, con marcas de escena. Para carrusel: slide por slide. Español rioplatense, tono FERVOR (directo, profesional, sin humo).`;
  const user = `Gancho: "${gancho}"`;
  return parseJSON<GuionAI>(await callClaude(system, user, 1600));
}

// ====== TENDENCIAS: clasificar un item ======
export type TendenciaAI = { categoria: 'gancho' | 'explicativo' | 'ignorar'; potencial: number; resumen: string };

export async function tagTendencia(titulo: string, contenido: string, fuente: string): Promise<TendenciaAI> {
  const system = `Sos el radar de tendencias de FERVOR (agencia de IA + automatización + marketing para negocios LATAM).
Te paso un item de noticia/blog. Clasificalo por su potencial para generar CONTENIDO de FERVOR.
Devolvé SOLO JSON: {"categoria":"gancho|explicativo|ignorar", "potencial":0-100, "resumen":"..."}
- categoria: "gancho" si da para un hook viral / ángulo de contenido; "explicativo" si sirve para un post educativo; "ignorar" si no aporta.
- potencial: 0-100 qué tan bueno es para contenido de FERVOR.
- resumen: 1-2 frases en español rioplatense de por qué sirve (o no) para contenido.`;
  const user = `Fuente: ${fuente}\nTítulo: ${titulo}\nContenido: ${contenido.slice(0, 1500)}`;
  return parseJSON<TendenciaAI>(await callClaude(system, user, 500));
}
