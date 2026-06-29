'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Flame, Menu, X } from 'lucide-react';
import { NAV } from './sidebar';

export function MobileNav() {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Barra superior mobile (solo < md) */}
      <div className="md:hidden sticky top-0 z-40 flex items-center justify-between px-4 py-3
                      border-b border-fervor-border bg-fervor-ink-2/95 backdrop-blur">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg gradient-flame flex items-center justify-center shadow-flame">
            <Flame className="h-4 w-4 text-white" />
          </div>
          <div className="font-display font-bold text-fervor-paper leading-none">
            Oficina <span className="text-fervor-flame text-[10px] font-mono uppercase tracking-wider align-middle">FERVOR</span>
          </div>
        </div>
        <button
          onClick={() => setOpen(true)}
          aria-label="Abrir menú"
          className="p-2 -mr-2 rounded-lg text-fervor-ash hover:bg-fervor-ink-3 transition-colors"
        >
          <Menu className="h-6 w-6" />
        </button>
      </div>

      {/* Drawer + overlay */}
      {open && (
        <div className="md:hidden fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/60" onClick={() => setOpen(false)} />
          <aside className="absolute left-0 top-0 bottom-0 w-72 max-w-[82%] bg-fervor-ink-2
                            border-r border-fervor-border flex flex-col shadow-2xl">
            <div className="p-4 border-b border-fervor-border flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl gradient-flame flex items-center justify-center shadow-flame">
                  <Flame className="h-5 w-5 text-white" />
                </div>
                <div className="leading-tight">
                  <div className="font-display font-bold text-fervor-paper text-lg">Oficina</div>
                  <div className="text-xs text-fervor-smoke font-mono uppercase tracking-wider">FERVOR</div>
                </div>
              </div>
              <button
                onClick={() => setOpen(false)}
                aria-label="Cerrar menú"
                className="p-2 rounded-lg text-fervor-ash hover:bg-fervor-ink-3 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
              {NAV.map((n) => (
                <Link
                  key={n.href}
                  href={n.href}
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-3 px-3 py-3 rounded-lg text-sm text-fervor-ash/80
                             hover:bg-fervor-ink-3 hover:text-fervor-flame transition-colors"
                >
                  <n.icon className="h-4 w-4 flex-shrink-0" />
                  {n.label}
                </Link>
              ))}
            </nav>
          </aside>
        </div>
      )}
    </>
  );
}
