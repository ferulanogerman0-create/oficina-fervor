import 'server-only';
import { db, schema } from '@/lib/db';
import { eq, or, ilike, desc } from 'drizzle-orm';

const ANTHROPIC = 'https://api.anthropic.com/v1/messages';
const MODEL = 'claude-sonnet-4-6';
const ESTADOS = ['nuevo', 'contactado', 'calificado', 'propuesta', 'cerrado', 'perdido'];

// ====== Groq Whisper: voz → texto ======
export async function transcribeVoice(buf: Buffer, filename = 'audio.ogg'): Promise<string> {
  const key = process.env.GROQ_API_KEY;
  if (!key) throw new Error('GROQ_API_KEY no configurada');
  const form = new FormData();
  form.append('file', new Blob([new Uint8Array(buf)]), filename);
  form.append('model', 'whisper-large-v3');
  form.append('language', 'es');
  const res = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
    method: 'POST', headers: { authorization: `Bearer ${key}` }, body: form,
  });
  if (!res.ok) throw new Error(`Groq ${res.status}: ${(await res.text()).slice(0, 200)}`);
  const j = await res.json();
  return String(j.text || '').trim();
}

// ====== Tools sobre leads (db directo, sin sesión — la ruta valida secret + chat) ======
async function searchLeads(query: string) {
  const q = `%${query.trim()}%`;
  return await db.select({
    id: schema.leads.id, nombre: schema.leads.nombre, estado: schema.leads.estado,
    telefono: schema.leads.telefono, email: schema.leads.email, notas: schema.leads.notas,
    cliente: schema.clients.nombre,
  }).from(schema.leads)
    .leftJoin(schema.clients, eq(schema.leads.clientId, schema.clients.id))
    .where(or(
      ilike(schema.leads.nombre, q),
      ilike(schema.clients.nombre, q),
      ilike(schema.leads.telefono, q),
      ilike(schema.leads.email, q),
      ilike(schema.leads.motivo, q),
      ilike(schema.leads.notas, q),
    ))
    .orderBy(desc(schema.leads.createdAt))
    .limit(12);
}

async function updateLead(id: number, estado?: string, nota?: string) {
  const set: Record<string, unknown> = { ultimoContacto: new Date() };
  if (estado) {
    if (!ESTADOS.includes(estado)) return { error: `estado inválido: ${estado}` };
    set.estado = estado;
  }
  if (nota && nota.trim()) {
    const cur = (await db.select({ notas: schema.leads.notas })
      .from(schema.leads).where(eq(schema.leads.id, id)))[0];
    const stamp = new Date().toISOString().slice(0, 10);
    set.notas = `${cur?.notas ? cur.notas + '\n' : ''}[${stamp}] ${nota.trim()}`;
  }
  const r = await db.update(schema.leads).set(set).where(eq(schema.leads.id, id))
    .returning({ id: schema.leads.id, nombre: schema.leads.nombre, estado: schema.leads.estado });
  return r[0] || { error: 'lead no encontrado' };
}

const TOOLS = [
  {
    name: 'buscar_leads',
    description: 'Buscar leads/contactos del CRM por nombre de persona, nombre del negocio, teléfono o email. Devuelve coincidencias con id, nombre, negocio y estado actual.',
    input_schema: { type: 'object', properties: { query: { type: 'string', description: 'nombre o negocio a buscar' } }, required: ['query'] },
  },
  {
    name: 'actualizar_lead',
    description: 'Actualizar un lead del CRM: cambiar su estado y/o agregarle una nota. Usá el id que te dio buscar_leads.',
    input_schema: {
      type: 'object',
      properties: {
        id: { type: 'number' },
        estado: { type: 'string', enum: ESTADOS },
        nota: { type: 'string', description: 'nota a agregar (qué se habló)' },
      },
      required: ['id'],
    },
  },
];

const SYSTEM = `Sos el asistente del CRM de FERVOR (la agencia de Germán). Germán te habla por Telegram (voz o texto) contándote a qué leads contactó o qué pasó con ellos. Tu trabajo:
- Buscá los leads que menciona con buscar_leads (por nombre de persona o de negocio).
- Actualizá su estado y/o agregá una nota con actualizar_lead.
- Estados válidos: nuevo, contactado, calificado, propuesta, cerrado, perdido.
- Mapeo: "le hablé / lo contacté / le escribí" → contactado. "le mandé/pasé propuesta" → propuesta. "cerró / es cliente / firmó" → cerrado. "no le interesa / lo perdí / me dijo que no" → perdido. "está interesado / engancha / califica" → calificado.
- Si para un nombre hay VARIOS matches, NO adivines: listáselos (nombre + negocio + estado) y preguntá cuál.
- Si no encontrás a alguien, decílo claramente.
- Podés actualizar varios leads en un mismo mensaje.
- Al final confirmá en pocas líneas qué actualizaste (nombres + nuevo estado). Español rioplatense, directo, sin relleno.
Hoy: ${new Date().toISOString().slice(0, 10)}.`;

type Block = { type: string; [k: string]: unknown };

export async function runCrmAgent(userText: string): Promise<string> {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) throw new Error('ANTHROPIC_API_KEY no configurada');
  const messages: Array<{ role: string; content: unknown }> = [{ role: 'user', content: userText }];

  for (let i = 0; i < 8; i++) {
    const res = await fetch(ANTHROPIC, {
      method: 'POST',
      headers: { 'x-api-key': key, 'anthropic-version': '2023-06-01', 'content-type': 'application/json' },
      body: JSON.stringify({ model: MODEL, max_tokens: 1500, system: SYSTEM, tools: TOOLS, messages }),
    });
    if (!res.ok) throw new Error(`Anthropic ${res.status}: ${(await res.text()).slice(0, 300)}`);
    const data = await res.json();
    messages.push({ role: 'assistant', content: data.content });

    if (data.stop_reason !== 'tool_use') {
      const txt = (data.content || []).filter((b: Block) => b.type === 'text')
        .map((b: Block) => b.text).join('\n').trim();
      return txt || 'Listo.';
    }

    const toolResults: unknown[] = [];
    for (const block of data.content as Block[]) {
      if (block.type !== 'tool_use') continue;
      let result: unknown;
      try {
        const input = block.input as Record<string, unknown>;
        if (block.name === 'buscar_leads') result = await searchLeads(String(input.query || ''));
        else if (block.name === 'actualizar_lead') result = await updateLead(Number(input.id), input.estado as string | undefined, input.nota as string | undefined);
        else result = { error: 'tool desconocida' };
      } catch (e) {
        result = { error: String((e as Error)?.message || e) };
      }
      toolResults.push({ type: 'tool_result', tool_use_id: block.id, content: JSON.stringify(result) });
    }
    messages.push({ role: 'user', content: toolResults });
  }
  return 'No pude terminar (demasiados pasos). Probá de nuevo más simple.';
}
