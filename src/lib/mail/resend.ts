// Resend mail wrapper. Usa env RESEND_API_KEY + RESEND_FROM (e.g. 'FERVOR <hola@fervorar.com>')
// Si no hay env, lanza error explícito p/ que UI lo muestre.

export type MailPayload = {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  replyTo?: string;
  bcc?: string | string[];
};

export async function sendMail(p: MailPayload) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM || 'FERVOR <hola@fervorar.com>';
  if (!apiKey) throw new Error('RESEND_API_KEY no configurada en env');

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from,
      to: Array.isArray(p.to) ? p.to : [p.to],
      subject: p.subject,
      html: p.html,
      text: p.text,
      reply_to: p.replyTo,
      bcc: p.bcc,
    }),
  });
  if (!res.ok) {
    const txt = await res.text().catch(() => '');
    throw new Error(`Resend error ${res.status}: ${txt}`);
  }
  return res.json() as Promise<{ id: string }>;
}
