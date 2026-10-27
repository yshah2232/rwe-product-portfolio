import { createContext, useContext, useState, type ReactNode } from 'react';
import { toggleSelection } from '@/lib/trialCompare';

const Context = createContext<{
  selected: string[];
  toggle: (nct: string) => void;
  clear: () => void;
} | null>(null);

export function TrialComparisonProvider({ children }: { children: ReactNode }) {
  const [selected, setSelected] = useState<string[]>([]);
  return <Context.Provider value={{ selected, toggle: (nct) => setSelected((previous) => toggleSelection(previous, nct)), clear: () => setSelected([]) }}>{children}</Context.Provider>;
}

export function useTrialComparison() {
  const context = useContext(Context);
  if (!context) throw new Error('Trial comparison requires its provider');
  return context;
}