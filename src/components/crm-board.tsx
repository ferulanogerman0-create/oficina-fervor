'use client';

import { useState, useMemo, useTransition } from 'react';
import Link from 'next/link';
import { Phone, Mail, ChevronRight, FileText, Search, X } from 'lucide-react';
import { moveLead } from '@/lib/actions/leads';
import { ETAPAS_LEAD as ETAPAS, type EtapaLead } from '@/lib/types';

const ETAPA_LABEL: Record<string, string> = {
  nuevo: 'Nuevo', contactado: 'Contactado', calificado: 'Calificado',
  propuesta: 'Propuesta', cerrado: '🔥 Cerrado', perdido: 'Perdido',
};
const ETAPA_COLOR: Record<string, string> = {
  nuevo: 'text-fervor-flame', contactado: 'text-fervor-ember',
  calificado: 'text-warn', propuesta: 'text-fervor-flame-l',
  cerrado: 'text-ok', perdido: 'text-alert/60',
};
const ORDER = ['nuevo', 'contactado', 'calificado', 'propuesta', 'cerrado'] as const;

export type LeadCard = {
  id: number; nombre: string | null; telefono: string | null; email: string | null;
  estado: string; motivo: string | null; cliente: string | null; color: string | null;
};

export function CrmBoard({ leads }: { leads: LeadCard[] }) {
  const [q, setQ] = useState('');
  const [pending, start] = useTransition();

  const filtered = useMemo(() => {
    const t = q.trim().toLowerCase();
    if (!t) return leads;
    return leads.filter((l) =>
      [l.nombre, l.telefono, l.email, l.cliente, l.motivo]
        .some((v) => v && String(v).toLowerCase().includes(t)),
    );
  }, [q, leads]);

  return (
    <>
      <div className="relative mb-4 max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-fervor-smoke pointer-events-none" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Buscar lead — nombre, teléfono, email, negocio…"
          autoFocus
          className="input-field w-full pl-9 pr-9 normal-case font-sans tracking-normal"
        />
        {q && (
          <button
            onClick={() => setQ('')}
            aria-label="Limpiar"
            className="absolute right-3 top-1/2 -translate-y-1/2 text-fervor-smoke hover:text-fervor-flame transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
      {q && (
        <div className="text-xs text-fervor-smoke mb-3 font-mono">
          {filtered.length} resultado{filtered.length === 1 ? '' : 's'}
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-6 gap-3 mb-6">
        {ETAPAS.map((e) => {
          const items = filtered.filter((l) => l.estado === e);
          const idx = ORDER.indexOf(e as typeof ORDER[number]);
          const next = idx >= 0 && idx < ORDER.length - 1 ? ORDER[idx + 1] : null;
          return (
            <div key={e} className="bg-fervor-ink-2 border border-fervor-border rounded-xl p-3 min-h-[140px]">
              <div className="flex items-center justify-between mb-3">
                <div className={`text-xs font-mono uppercase tracking-wider font-bold ${ETAPA_COLOR[e]}`}>
                  {ETAPA_LABEL[e]}
                </div>
                <span className="text-xs text-fervor-smoke font-mono">{items.length}</span>
              </div>
              <div className="space-y-2">
                {items.map((l) => (
                  <div key={l.id} className="bg-fervor-ink-3 border border-fervor-border rounded-lg p-2.5 text-xs">
                    <div className="flex items-center gap-1.5 mb-1">
                      {l.color && <span className="w-2 h-2 rounded-full" style={{ background: l.color }} />}
                      <span className="text-fervor-smoke text-[10px]">{l.cliente}</span>
                    </div>
                    <div className="font-medium text-fervor-paper mb-1">{l.nombre}</div>
                    {l.telefono && <div className="flex items-center gap-1 text-fervor-smoke"><Phone className="h-3 w-3" />{l.telefono}</div>}
                    {l.email && <div className="flex items-center gap-1 text-fervor-smoke truncate"><Mail className="h-3 w-3" />{l.email}</div>}
                    {l.motivo && <div className="text-fervor-smoke mt-1 line-clamp-2">{l.motivo}</div>}
                    {next && (
                      <button
                        type="button"
                        disabled={pending}
                        onClick={() => start(() => { void moveLead(l.id, next as EtapaLead); })}
                        className="mt-2 text-fervor-flame hover:text-fervor-flame-l disabled:opacity-50 text-[10px] font-mono uppercase tracking-wider flex items-center gap-1"
                      >
                        → {next} <ChevronRight className="h-3 w-3" />
                      </button>
                    )}
                    <Link
                      href={`/propuestas/nueva?leadId=${l.id}&client_name=${encodeURIComponent(l.nombre || '')}&client_email=${encodeURIComponent(l.email || '')}&client_negocio=${encodeURIComponent(l.cliente || '')}`}
                      className="text-fervor-flame hover:text-fervor-flame-l text-[10px] font-mono uppercase tracking-wider flex items-center gap-1 mt-1"
                    >
                      <FileText className="h-3 w-3" /> + Propuesta
                    </Link>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}
