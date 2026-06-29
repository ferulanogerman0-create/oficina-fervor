import { NextRequest, NextResponse } from 'next/server';
import { runCrmAgent, transcribeVoice } from '@/lib/telegram/crm-agent';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const tgBase = (token: string) => `https://api.telegram.org/bot${token}`;

async function sendMessage(token: string, chatId: number | string, text: string) {
  await fetch(`${tgBase(token)}/sendMessage`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text }),
  }).catch(() => {});
}

export async function POST(req: NextRequest) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const secret = process.env.TELEGRAM_WEBHOOK_SECRET;
  if (!token) return NextResponse.json({ ok: false, error: 'TELEGRAM_BOT_TOKEN no configurado' });

  // Telegram manda este header si seteamos secret_token en setWebhook
  if (secret && req.headers.get('x-telegram-bot-api-secret-token') !== secret) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  let update: Record<string, unknown>;
  try { update = await req.json(); } catch { return NextResponse.json({ ok: true }); }

  const msg = (update.message || update.edited_message) as Record<string, unknown> | undefined;
  const chat = msg?.chat as Record<string, unknown> | undefined;
  const chatId = chat?.id as number | undefined;
  if (!msg || chatId == null) return NextResponse.json({ ok: true });

  // allowlist de chats (default = Germán). Vacío string = abierto.
  const allow = (process.env.TELEGRAM_ALLOWED_CHAT ?? '1147573365').split(',').map((s) => s.trim()).filter(Boolean);
  if (allow.length && !allow.includes(String(chatId))) {
    await sendMessage(token, chatId, 'No autorizado.');
    return NextResponse.json({ ok: true });
  }

  try {
    let text = String((msg.text as string) || '').trim();
    const voice = msg.voice as Record<string, unknown> | undefined;

    if (!text && voice?.file_id) {
      const fr = await fetch(`${tgBase(token)}/getFile?file_id=${voice.file_id}`).then((r) => r.json());
      const path = fr?.result?.file_path;
      if (!path) { await sendMessage(token, chatId, 'No pude bajar el audio.'); return NextResponse.json({ ok: true }); }
      await sendMessage(token, chatId, '🎧 Transcribiendo…');
      const audio = Buffer.from(await (await fetch(`https://api.telegram.org/file/bot${token}/${path}`)).arrayBuffer());
      text = await transcribeVoice(audio);
    }

    if (!text) {
      await sendMessage(token, chatId, 'Mandame texto o un audio sobre los leads. Ej: "le hablé a Marta y a la inmobiliaria López, pasalos a contactado".');
      return NextResponse.json({ ok: true });
    }

    const reply = await runCrmAgent(text);
    await sendMessage(token, chatId, reply);
  } catch (e) {
    await sendMessage(token, chatId, `Error: ${String((e as Error)?.message || e).slice(0, 350)}`);
  }

  return NextResponse.json({ ok: true });
}

// Healthcheck simple
export async function GET() {
  return NextResponse.json({ ok: true, bot: 'crm-telegram', configured: !!process.env.TELEGRAM_BOT_TOKEN });
}
