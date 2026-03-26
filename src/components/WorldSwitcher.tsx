import { useWorld } from '@/contexts/WorldContext';
import type { TherapeuticWorld } from '@/data/engine/types';
import { Globe } from 'lucide-react';

const worldStyles: Record<TherapeuticWorld, { ring: string; bg: string; text: string }> = {
  glp1: { ring: 'ring-purple-400', bg: 'bg-purple-50', text: 'text-purple-700' },
  nsclc: { ring: 'ring-sky-400', bg: 'bg-sky-50', text: 'text-sky-700' },
  alzheimer: { ring: 'ring-rose-400', bg: 'bg-rose-50', text: 'text-rose-700' },
};

export default function WorldSwitcher() {
  const { world, setWorld, worlds } = useWorld();

  return (
    <div className="flex items-center gap-1.5">
      <Globe className="h-4 w-4 text-muted-foreground" />
      {(Object.keys(worlds) as TherapeuticWorld[]).map((w) => {
        const active = w === world;
        const s = worldStyles[w];
        return (
          <button
            key={w}
            onClick={() => setWorld(w)}
            className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${
              active
                ? `${s.bg} ${s.text} ring-2 ${s.ring}`
                : 'bg-muted/50 text-muted-foreground hover:bg-muted'
            }`}
          >
            {worlds[w].shortLabel}
          </button>
        );
      })}
    </div>
  );
}
