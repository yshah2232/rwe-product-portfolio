import React, { createContext, useContext, useState, useEffect } from 'react';
import type { TherapeuticWorld, WorldDataset } from '@/data/engine/types';
import { loadWorld } from '@/data/engine/dataLoader';
import { WORLD_META } from '@/data/engine/worldConfigs';

interface WorldContextValue {
  world: TherapeuticWorld;
  setWorld: (w: TherapeuticWorld) => void;
  dataset: WorldDataset | null;
  loading: boolean;
  worlds: typeof WORLD_META;
}

const WorldContext = createContext<WorldContextValue | null>(null);

export function WorldProvider({ children }: { children: React.ReactNode }) {
  const [world, setWorld] = useState<TherapeuticWorld>('glp1');
  const [dataset, setDataset] = useState<WorldDataset | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    loadWorld(world)
      .then(ds => {
        setDataset(ds);
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to load world data:', err);
        setLoading(false);
      });
  }, [world]);

  return (
    <WorldContext.Provider value={{ world, setWorld, dataset, loading, worlds: WORLD_META }}>
      {children}
    </WorldContext.Provider>
  );
}

export function useWorld() {
  const ctx = useContext(WorldContext);
  if (!ctx) throw new Error('useWorld must be used within WorldProvider');
  return ctx;
}
