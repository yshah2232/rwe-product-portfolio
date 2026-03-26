import React, { createContext, useContext, useState, useMemo } from 'react';
import type { TherapeuticWorld, WorldDataset } from '@/data/engine/types';
import { generateWorld } from '@/data/engine/generator';
import { WORLD_META } from '@/data/engine/worldConfigs';

interface WorldContextValue {
  world: TherapeuticWorld;
  setWorld: (w: TherapeuticWorld) => void;
  dataset: WorldDataset;
  worlds: typeof WORLD_META;
}

const WorldContext = createContext<WorldContextValue | null>(null);

export function WorldProvider({ children }: { children: React.ReactNode }) {
  const [world, setWorld] = useState<TherapeuticWorld>('glp1');
  const dataset = useMemo(() => generateWorld(world), [world]);

  return (
    <WorldContext.Provider value={{ world, setWorld, dataset, worlds: WORLD_META }}>
      {children}
    </WorldContext.Provider>
  );
}

export function useWorld() {
  const ctx = useContext(WorldContext);
  if (!ctx) throw new Error('useWorld must be used within WorldProvider');
  return ctx;
}
