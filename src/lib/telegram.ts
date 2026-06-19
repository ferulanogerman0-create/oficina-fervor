/**
 * Envío de mensajes a Telegram (notificaciones internas FERVOR).
 * Requiere env TELEGRAM_BOT_TOKEN. Chat por defecto = Germán (1147573365),
 * override con TELEGRAM_CHAT_ID. No-op si falta el token (no rompe nada).
 */
const DEFAULT_CHAT = '1147573365';

export async function sendTelegram(text: string, chatId?: string): Promise<boolean> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chat = chatId || process.env.TELEGRAM_CHAT_ID || DEFAULT_CHAT;
  if (!token) return false;
  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chat, text, parse_mode: 'HTML', disable_web_page_preview: true }),
    });
    return res.ok;
  } catch {
    return false;
  }
}
