// Plain-language mode + audience tracking.
// Persists in localStorage so the choice survives reloads.
// Plain mode automatically forces "Recruiting only" filtering on Search.

import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';

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
  const [audiencePromptSeen, setAudiencePromptSeen] = useState(false);

  // Remove old preferences; all new preferences live only in memory.
  useEffect(() => {
    try {
      [KEY_AUDIENCE, KEY_PLAIN, KEY_PROMPT_SEEN].forEach((key) => localStorage.removeItem(key));
      sessionStorage.removeItem('ctg_sid_v1');
    } catch {
      /* ignore */
    }
  }, []);

  const setAudience = useCallback((a: Audience, opts?: { skipPlain?: boolean }) => {
    setAudienceState(a);

    // Default plain mode based on audience choice
    if (!opts?.skipPlain) {
      const plainDefault = a === 'patient';
      setPlainModeState(plainDefault);
    }

  }, []);

  const setPlainMode = useCallback((v: boolean) => {
    setPlainModeState(v);
  }, []);

  const togglePlainMode = useCallback(() => {
    setPlainModeState((prev) => {
      const next = !prev;
      return next;
    });
  }, []);

  const markAudiencePromptSeen = useCallback(() => {
    setAudiencePromptSeen(true);
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
