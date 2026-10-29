import { createContext, useContext, useState, type ReactNode } from 'react';

type PageRecords = { ncts: string[]; query: string };
const Context = createContext<{ records: PageRecords; setRecords: (value: PageRecords) => void } | null>(null);
export function RegistryPageProvider({ children }: { children: ReactNode }) {
  const [records, setRecords] = useState<PageRecords>({ ncts: [], query: '' });
  return <Context.Provider value={{ records, setRecords }}>{children}</Context.Provider>;
}
export function useRegistryPage() {
  const context = useContext(Context);
  if (!context) throw new Error('Registry page provider is required');
  return context;
}