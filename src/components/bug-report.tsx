'use client';
import { useState } from 'react';
import { Bug, X, Send, Check } from 'lucide-react';

/**
 * Botón flotante "Reportar bug / Soporte" + modal.
 * Reusable en todas las apps FERVOR. Manda al colector central de Oficina.
 *
 * Props:
 *  - app: identificador de la app (tutaller / agenciafacil / fma / oficina)
 *  - endpoint: URL del colector (default: oficina prod). Mismo origen si es Oficina.
 *  - usuario: nombre del usuario logueado (opcional)
 */
export function BugReport({
  app,
  endpoint = 'https://oficina.wolfdma.website/api/bugs',
  usuario,
}: {
  app: string;
  endpoint?: string;
  usuario?: string;
}) {
  const [open, setOpen] = useState(false);
  const [mensaje, setMensaje] = useState('');
  const [contacto, setContacto] = useState('');
  const [estado, setEstado] = useState<'idle' | 'sending' | 'ok' | 'error'>('idle');

  async function enviar() {
    if (!mensaje.trim()) return;
    setEstado('sending');
    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          app,
          mensaje,
          contacto: contacto || undefined,
          usuario: usuario || undefined,
          url: typeof window !== 'undefined' ? window.location.href : undefined,
          userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
        }),
      });
      if (!res.ok) throw new Error('fail');
      setEstado('ok');
      setMensaje('');
      setContacto('');
      setTimeout(() => { setOpen(false); setEstado('idle'); }, 2200);
    } catch {
      setEstado('error');
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        aria-label="Reportar un problema"
        style={{
          position: 'fixed', right: 18, bottom: 18, zIndex: 9998,
          display: 'flex', alignItems: 'center', gap: 8,
          background: '#FF5A1F', color: '#0a0a0a', border: 'none',
          borderRadius: 999, padding: '11px 16px', cursor: 'pointer',
          fontFamily: 'inherit', fontWeight: 700, fontSize: 14,
          boxShadow: '0 6px 22px rgba(255,90,31,.45)',
        }}
      >
        <Bug size={18} /> Reportar problema
      </button>

      {open && (
        <div
          onClick={(e) => { if (e.target === e.currentTarget) setOpen(false); }}
          style={{
            position: 'fixed', inset: 0, zIndex: 9999,
            background: 'rgba(0,0,0,.6)', backdropFilter: 'blur(3px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16,
          }}
        >
          <div style={{
            width: '100%', maxWidth: 440, background: '#141414',
            border: '1px solid #2a2a2a', borderRadius: 16, padding: 22,
            color: '#FAFAFA', fontFamily: 'inherit',
            boxShadow: '0 24px 70px rgba(0,0,0,.6)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 9, fontWeight: 700, fontSize: 18 }}>
                <Bug size={20} color="#FF5A1F" /> Reportar un problema
              </div>
              <button onClick={() => setOpen(false)} aria-label="Cerrar"
                style={{ background: 'none', border: 'none', color: '#888', cursor: 'pointer', padding: 4 }}>
                <X size={20} />
              </button>
            </div>

            {estado === 'ok' ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, padding: '28px 0' }}>
                <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'rgba(255,90,31,.15)', color: '#FF5A1F', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Check size={30} />
                </div>
                <div style={{ fontWeight: 600, fontSize: 16 }}>¡Recibido! Gracias.</div>
                <div style={{ fontSize: 13, color: '#999', textAlign: 'center' }}>Ya nos llegó tu reporte. Lo revisamos y lo solucionamos.</div>
              </div>
            ) : (
              <>
                <p style={{ fontSize: 13, color: '#9a9a9a', margin: '0 0 14px' }}>
                  Contanos qué pasó o qué no funciona. Cuanto más detalle, mejor.
                </p>
                <textarea
                  value={mensaje}
                  onChange={(e) => setMensaje(e.target.value)}
                  placeholder="Ej: al guardar una orden me tira error / no me deja cargar un cliente…"
                  rows={5}
                  style={{
                    width: '100%', background: '#0d0d0d', border: '1px solid #2a2a2a',
                    borderRadius: 10, padding: '11px 13px', color: '#FAFAFA',
                    fontFamily: 'inherit', fontSize: 14, resize: 'vertical', outline: 'none',
                  }}
                />
                <input
                  value={contacto}
                  onChange={(e) => setContacto(e.target.value)}
                  placeholder="Tu email o WhatsApp (opcional, por si necesitamos más datos)"
                  style={{
                    width: '100%', marginTop: 10, background: '#0d0d0d', border: '1px solid #2a2a2a',
                    borderRadius: 10, padding: '11px 13px', color: '#FAFAFA',
                    fontFamily: 'inherit', fontSize: 14, outline: 'none',
                  }}
                />
                {estado === 'error' && (
                  <div style={{ marginTop: 10, fontSize: 13, color: '#ff7a6b' }}>No se pudo enviar. Probá de nuevo.</div>
                )}
                <button
                  onClick={enviar}
                  disabled={!mensaje.trim() || estado === 'sending'}
                  style={{
                    width: '100%', marginTop: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                    background: mensaje.trim() ? '#FF5A1F' : '#3a2418', color: '#0a0a0a',
                    border: 'none', borderRadius: 10, padding: '13px', cursor: mensaje.trim() ? 'pointer' : 'not-allowed',
                    fontFamily: 'inherit', fontWeight: 700, fontSize: 15,
                    opacity: estado === 'sending' ? 0.7 : 1,
                  }}
                >
                  <Send size={17} /> {estado === 'sending' ? 'Enviando…' : 'Enviar reporte'}
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
