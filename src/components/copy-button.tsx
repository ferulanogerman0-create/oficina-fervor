'use client';
import { useState } from 'react';
import { Copy, Check } from 'lucide-react';

export function CopyButton({ text, label = 'Copiar', className = '' }: { text: string; label?: string; className?: string }) {
  const [done, setDone] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
          setDone(true);
          setTimeout(() => setDone(false), 1600);
        } catch {
          // fallback: seleccionar via textarea temporal
          const ta = document.createElement('textarea');
          ta.value = text; document.body.appendChild(ta); ta.select();
          try { document.execCommand('copy'); setDone(true); setTimeout(() => setDone(false), 1600); } catch {}
          document.body.removeChild(ta);
        }
      }}
      className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-mono uppercase tracking-wider transition-colors ${
        done ? 'bg-emerald-400/15 text-emerald-400 border border-emerald-400/30'
             : 'bg-fervor-flame/10 text-fervor-flame border border-fervor-flame/30 hover:bg-fervor-flame/20'
      } ${className}`}
    >
      {done ? <Check size={13} /> : <Copy size={13} />}
      {done ? 'Copiado' : label}
    </button>
  );
}
