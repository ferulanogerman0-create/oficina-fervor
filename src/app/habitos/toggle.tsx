'use client';
import { useTransition } from 'react';
import { toggleCompletion } from '@/lib/actions/habits';
import { Check, Circle } from 'lucide-react';

export function ToggleCompletionBtn({ habitoId, fecha, done }: { habitoId: number; fecha: string; done: boolean }) {
  const [pending, start] = useTransition();
  return (
    <button
      onClick={() => start(() => toggleCompletion(habitoId, fecha))}
      disabled={pending}
      className={`w-10 h-10 rounded-full border-2 flex items-center justify-center transition-all flex-shrink-0
        ${done ? 'bg-fervor-flame border-fervor-flame text-white' : 'border-fervor-border hover:border-fervor-flame text-fervor-smoke hover:text-fervor-flame'}`}
      aria-label="Toggle hábito"
    >
      {done ? <Check className="h-5 w-5" /> : <Circle className="h-5 w-5" />}
    </button>
  );
}
