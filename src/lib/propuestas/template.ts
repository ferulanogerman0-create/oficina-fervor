import type { LineaSeleccionada } from './catalog';

export type PropuestaData = {
  id?: number;
  clientName: string;
  clientNegocio?: string;
  clientEmail?: string;
  lineas: LineaSeleccionada[];
  setupTotal: number;
  mrrTotal: number;
  currency: string; // USD / ARS
  validityDays: number;
  fechaEmision: string; // YYYY-MM-DD
};

const fmt = (n: number, cur: string) =>
  cur === 'USD'
    ? `USD ${n.toLocaleString('en-US', { maximumFractionDigits: 0 })}`
    : `$${n.toLocaleString('es-AR', { maximumFractionDigits: 0 })} ${cur}`;

export function renderPropuestaHTML(p: PropuestaData): string {
  const fechaLabel = new Date(p.fechaEmision + 'T12:00:00').toLocaleDateString('es-AR', {
    day: 'numeric', month: 'long', year: 'numeric',
  });
  const validUntil = new Date(p.fechaEmision + 'T12:00:00');
  validUntil.setDate(validUntil.getDate() + p.validityDays);
  const validUntilLabel = validUntil.toLocaleDateString('es-AR', { day: 'numeric', month: 'long', year: 'numeric' });

  return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<title>Propuesta FERVOR — ${escapeHtml(p.clientName)}</title>
<link href="https://fonts.googleapis.com/css2?family=Anton&family=Chivo+Mono:wght@400;700&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
<style>
:root{--bg:#0A0A0A;--bg2:#141414;--bg3:#1c1c1c;--fire:#FF5A1F;--ember:#FF7A3C;--red:#E0240A;--white:#FAFAFA;--muted:#9a9a9a;}
*{margin:0;padding:0;box-sizing:border-box}
html,body{background:var(--bg);color:var(--white);font-family:'Inter',sans-serif;line-height:1.55;font-size:11pt}
.page{width:210mm;min-height:296mm;padding:18mm 20mm;position:relative;page-break-after:always}
.page:last-child{page-break-after:auto}
.brand{font-family:'Anton';font-size:36px;letter-spacing:.04em;text-transform:uppercase}
.brand span{color:var(--fire)}
.kicker{font-family:'Chivo Mono';font-size:10pt;letter-spacing:.18em;text-transform:uppercase;color:var(--fire);margin-bottom:8px}
h1{font-family:'Anton';font-size:64px;line-height:.95;text-transform:uppercase;margin-bottom:12px}
h1 .fire{color:var(--fire)}
h2{font-family:'Anton';font-size:32px;text-transform:uppercase;margin:32px 0 12px}
h2 .fire{color:var(--fire)}
h3{font-family:'Anton';font-size:18px;text-transform:uppercase;margin:18px 0 6px;letter-spacing:.02em}
p{margin-bottom:8px;opacity:.92}
.cover-meta{position:absolute;bottom:18mm;left:20mm;right:20mm;display:flex;justify-content:space-between;font-family:'Chivo Mono';font-size:10pt;color:var(--muted);text-transform:uppercase;letter-spacing:.1em;border-top:1px solid #222;padding-top:14px}
.card{background:var(--bg2);border:1px solid #222;padding:18px;margin:10px 0}
.card.flame{border-left:4px solid var(--fire)}
.client-info{background:var(--bg2);border-left:4px solid var(--fire);padding:18px 22px;margin:24px 0}
.client-info dl{display:grid;grid-template-columns:130px 1fr;gap:6px 14px;font-family:'Chivo Mono';font-size:10pt}
.client-info dt{color:var(--fire);font-weight:700;text-transform:uppercase}
.client-info dd{opacity:.92}
table{width:100%;border-collapse:collapse;font-size:10pt;margin:10px 0}
th{font-family:'Chivo Mono';font-size:9pt;letter-spacing:.1em;text-transform:uppercase;color:var(--fire);text-align:left;padding:10px 12px;border-bottom:2px solid var(--fire);background:var(--bg2)}
th.right,td.right{text-align:right}
td{padding:10px 12px;border-bottom:1px solid #222;vertical-align:top}
tr:nth-child(even) td{background:#0f0f0f}
.svc-name{font-family:'Anton';font-size:14pt;text-transform:uppercase}
.svc-desc{font-size:9.5pt;opacity:.8;margin-top:4px}
.totals{margin-top:24px;background:linear-gradient(135deg,var(--bg2),#0a0a0a);border:2px solid var(--fire);padding:24px}
.totals .row{display:flex;justify-content:space-between;align-items:baseline;padding:10px 0;border-bottom:1px solid #222}
.totals .row:last-child{border-bottom:0}
.totals .lbl{font-family:'Chivo Mono';font-size:10pt;letter-spacing:.14em;text-transform:uppercase;color:var(--fire)}
.totals .val{font-family:'Anton';font-size:28px}
.totals .val.big{font-size:40px;color:var(--fire)}
.note{font-family:'Chivo Mono';font-size:9.5pt;color:var(--muted);padding:10px 14px;border-left:2px solid #333;margin:12px 0}
.signature{margin-top:48px;padding-top:20px;border-top:1px solid #333;font-family:'Chivo Mono';font-size:10pt}
.signature .name{font-family:'Anton';font-size:18pt;color:var(--white);text-transform:uppercase;margin-top:4px}
.next-step{background:var(--fire);color:var(--white);padding:24px 28px;font-family:'Anton';font-size:22px;text-transform:uppercase;letter-spacing:.02em;margin-top:24px}
.next-step span{display:block;font-family:'Chivo Mono';font-size:10pt;text-transform:none;letter-spacing:.02em;margin-top:8px;opacity:.85}
.ghost{position:absolute;font-family:'Anton';font-size:180px;color:rgba(255,90,31,0.06);top:-10px;right:-30px;line-height:1;text-transform:uppercase;pointer-events:none;letter-spacing:-.02em}
.foot{margin-top:36px;font-family:'Chivo Mono';font-size:9pt;color:var(--muted);line-height:1.7}
</style>
</head>
<body>
<!-- COVER -->
<section class="page">
  <div class="ghost">FRV</div>
  <div class="brand">FERVOR<span>®</span></div>
  <div class="kicker" style="margin-top:200px">Propuesta comercial</div>
  <h1>Para<br><span class="fire">${escapeHtml(p.clientName)}</span></h1>
  ${p.clientNegocio ? `<p style="font-family:'Chivo Mono';font-size:14pt;color:var(--white);opacity:.85;margin-top:24px">${escapeHtml(p.clientNegocio)}</p>` : ''}

  <div class="client-info" style="margin-top:48px">
    <dl>
      <dt>De</dt><dd>Germán Ferulano · FERVOR</dd>
      <dt>Para</dt><dd>${escapeHtml(p.clientName)}${p.clientEmail ? ' · ' + escapeHtml(p.clientEmail) : ''}</dd>
      <dt>Fecha emisión</dt><dd>${fechaLabel}</dd>
      <dt>Validez</dt><dd>${p.validityDays} días — hasta ${validUntilLabel}</dd>
      ${p.id ? `<dt>Propuesta #</dt><dd>FRV-${String(p.id).padStart(4, '0')}</dd>` : ''}
    </dl>
  </div>

  <div class="cover-meta">
    <span>Germán Ferulano · FERVOR · fervorar.com</span>
    <span>v1</span>
  </div>
</section>

<!-- SERVICIOS -->
<section class="page">
  <div class="ghost">01</div>
  <div class="kicker">Servicios incluidos</div>
  <h2>Lo que <span class="fire">construimos</span> para vos</h2>

  ${p.lineas.map((l, i) => `
    <div class="card flame">
      <div style="display:flex;justify-content:space-between;align-items:baseline;margin-bottom:6px">
        <div>
          <div class="kicker" style="font-size:9pt">${String(i + 1).padStart(2, '0')}</div>
          <div class="svc-name">${escapeHtml(l.label)}</div>
        </div>
        <div style="text-align:right;font-family:'Chivo Mono';font-size:10pt">
          ${l.setup > 0 ? `<div><span style="color:var(--muted);font-size:8.5pt;letter-spacing:.1em;text-transform:uppercase">Setup</span> <strong style="color:var(--fire);font-family:'Anton';font-size:14pt">${fmt(l.setup, p.currency)}</strong></div>` : ''}
          ${l.mrr > 0 ? `<div style="margin-top:4px"><span style="color:var(--muted);font-size:8.5pt;letter-spacing:.1em;text-transform:uppercase">Mensual</span> <strong style="color:var(--fire);font-family:'Anton';font-size:14pt">${fmt(l.mrr, p.currency)}/mes</strong></div>` : ''}
        </div>
      </div>
      <div class="svc-desc">${escapeHtml(l.descripcion)}</div>
    </div>
  `).join('')}

  <div class="totals">
    <div class="row">
      <span class="lbl">Setup único</span>
      <span class="val">${fmt(p.setupTotal, p.currency)}</span>
    </div>
    <div class="row">
      <span class="lbl">Mensual recurrente</span>
      <span class="val big">${fmt(p.mrrTotal, p.currency)}<span style="font-size:18px;color:var(--white);opacity:.7"> / mes</span></span>
    </div>
  </div>

  <div class="note">
    Precios expresados en <strong style="color:var(--fire)">${p.currency}</strong>. Si pagás en ARS se factura al tipo de cambio MEP del día. Propuesta válida ${p.validityDays} días. Setup se cobra 50% al confirmar + 50% al entregar; mensual se factura el día 1 de cada mes.
  </div>
</section>

<!-- CIERRE -->
<section class="page">
  <div class="ghost">02</div>
  <div class="kicker">Cómo seguimos</div>
  <h2>Pr<span class="fire">ó</span>ximo paso</h2>

  <div class="card">
    <h3>1. Confirmás esta propuesta</h3>
    <p>Respondés este mail o me escribís por WhatsApp. Si tenés ajustes, los hacemos. Si está OK, te paso link de pago del setup y arrancamos.</p>
  </div>

  <div class="card">
    <h3>2. Kick-off (semana 1)</h3>
    <p>Call de 60 min para alinear marca, prioridades, accesos a Meta/Google/dominio, y armar cronograma. A las 48h tenés un plan semanal con entregables.</p>
  </div>

  <div class="card">
    <h3>3. Delivery (semanas 2-6)</h3>
    <p>Producción + iteración. Update semanal por WhatsApp con avance. Acceso permanente a oficina.fervorar.com para ver tu dashboard en tiempo real.</p>
  </div>

  <div class="card">
    <h3>4. Lanzamiento + soporte</h3>
    <p>Go live + onboarding tuyo + handoff. Después: soporte mensual (incluido en el MRR), ajustes, optimización, reporting mensual con KPIs y plan próximo trimestre.</p>
  </div>

  <div class="next-step">
    ¿Avanzamos?
    <span>Respondé este mail con "OK" y te paso el link de pago del setup.</span>
  </div>

  <div class="signature">
    Gracias por considerarme.
    <div class="name">Germán Ferulano</div>
    Fundador · FERVOR<br>
    wolfdmagency@gmail.com · fervorar.com
  </div>

  <div class="foot">
    Germán Ferulano · FERVOR — Empresa unipersonal · Monotributo AFIP · Campana, Buenos Aires, Argentina<br>
    Esta propuesta es confidencial. Compartirla públicamente sin autorización está sujeto a las Condiciones del servicio publicadas en fervorar.com/terms.
  </div>
</section>
</body>
</html>`;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
