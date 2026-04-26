// Plain-language mode + audience tracking.
// Persists in localStorage so the choice survives reloads.
// Plain mode automatically forces "Recruiting only" filtering on Search.

import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { getSessionId } from '@/lib/searchSession';

export type Audience = 'clinical' | 'patient' | 'unspecified';

interface PlainModeCtx {
  audience: Audience;
  plainMode: boolean;
  audiencePromptSeen: boolean;
  setAudience: (a: Audience, opts?: { skipPlain?: boolean }) => void;
  togglePlainMode: () => void;
  setPlainMode: (v: boolean) => void;
  markAudiencePromptSeen: () => void;
}

const Ctx = createContext<PlainModeCtx | null>(null);

const KEY_AUDIENCE = 'ctd.audience';
const KEY_PLAIN = 'ctd.plain_mode';
const KEY_PROMPT_SEEN = 'ctd.audience_prompt_seen';

export const PlainModeProvider = ({ children }: { children: ReactNode }) => {
  const [audience, setAudienceState] = useState<Audience>('unspecified');
  const [plainMode, setPlainModeState] = useState(false);
  const [audiencePromptSeen, setAudiencePromptSeen] = useState(true); // assume seen until hydrated

  // Hydrate from localStorage on mount
  useEffect(() => {
    try {
      const a = localStorage.getItem(KEY_AUDIENCE) as Audience | null;
      const p = localStorage.getItem(KEY_PLAIN);
      const seen = localStorage.getItem(KEY_PROMPT_SEEN);
      if (a) setAudienceState(a);
      if (p !== null) setPlainModeState(p === 'true');
      setAudiencePromptSeen(seen === 'true');
    } catch {
      /* ignore */
    }
  }, []);

  const setAudience = useCallback((a: Audience, opts?: { skipPlain?: boolean }) => {
    setAudienceState(a);
    try {
      localStorage.setItem(KEY_AUDIENCE, a);
    } catch { /* ignore */ }

    // Default plain mode based on audience choice
    if (!opts?.skipPlain) {
      const plainDefault = a === 'patient';
      setPlainModeState(plainDefault);
      try {
        localStorage.setItem(KEY_PLAIN, String(plainDefault));
      } catch { /* ignore */ }
    }

    // Fire-and-forget analytics insert
    try {
      supabase.from('audience_selections').insert({
        session_id: getSessionId(),
        audience: a,
        plain_mode_default: a === 'patient',
      }).then(() => { /* noop */ });
    } catch { /* ignore */ }
  }, []);

  const setPlainMode = useCallback((v: boolean) => {
    setPlainModeState(v);
    try {
      localStorage.setItem(KEY_PLAIN, String(v));
    } catch { /* ignore */ }
  }, []);

  const togglePlainMode = useCallback(() => {
    setPlainModeState((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(KEY_PLAIN, String(next));
      } catch { /* ignore */ }
      return next;
    });
  }, []);

  const markAudiencePromptSeen = useCallback(() => {
    setAudiencePromptSeen(true);
    try {
      localStorage.setItem(KEY_PROMPT_SEEN, 'true');
    } catch { /* ignore */ }
  }, []);

  return (
    <Ctx.Provider
      value={{
        audience,
        plainMode,
        audiencePromptSeen,
        setAudience,
        togglePlainMode,
        setPlainMode,
        markAudiencePromptSeen,
      }}
    >
      {children}
    </Ctx.Provider>
  );
};

export const usePlainMode = (): PlainModeCtx => {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('usePlainMode must be used within PlainModeProvider');
  return ctx;
};
