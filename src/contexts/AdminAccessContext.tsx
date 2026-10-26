import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';

type Session = { token: string; username: string; expiresAt: string };
type Access = {
  session: Session | null;
  signIn: (username: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  request: (name: string, init?: RequestInit, query?: string) => Promise<Response>;
};
const Context = createContext<Access | null>(null);
const base = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1`;
const publicKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

export function AdminAccessProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  useEffect(() => {
    if (!session) return;
    const timer = setTimeout(() => setSession(null), Math.max(0, Date.parse(session.expiresAt) - Date.now()));
    return () => clearTimeout(timer);
  }, [session]);

  const request = useCallback(async (name: string, init: RequestInit = {}, query = '') => {
    if (!session || Date.parse(session.expiresAt) <= Date.now()) { setSession(null); throw new Error('Sign in required.'); }
    const headers = new Headers(init.headers);
    headers.set('apikey', publicKey);
    headers.set('Authorization', `Bearer ${publicKey}`);
    headers.set('x-admin-session', session.token);
    const response = await fetch(`${base}/${name}${query}`, { ...init, headers, cache: 'no-store' });
    if (response.status === 401) { setSession(null); throw new Error('Your session expired. Sign in again.'); }
    return response;
  }, [session]);

  const signIn = async (username: string, password: string) => {
    const response = await fetch(`${base}/admin-access`, {
      method: 'POST', cache: 'no-store',
      headers: { apikey: publicKey, Authorization: `Bearer ${publicKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.error || 'Sign in unavailable.');
    if (typeof data.token !== 'string' || typeof data.expiresAt !== 'string') throw new Error('Sign in unavailable.');
    setSession(data);
  };

  const signOut = async () => {
    try {
      const response = await request('admin-access', { method: 'DELETE' });
      if (!response.ok) throw new Error('Sign out could not be confirmed.');
    } finally { setSession(null); }
  };
  return <Context.Provider value={{ session, signIn, signOut, request }}>{children}</Context.Provider>;
}

export function useAdminAccess() {
  const context = useContext(Context);
  if (!context) throw new Error('Admin access provider is required.');
  return context;
}