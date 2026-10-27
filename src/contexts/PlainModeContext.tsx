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
  termsAccepted: boolean;
  acceptTerms: (a: 'clinical' | 'patient') => void;
}

const Ctx = createContext<PlainModeCtx | null>(null);

const KEY_AUDIENCE = 'ctd.audience';
const KEY_PLAIN = 'ctd.plain_mode';
const KEY_PROMPT_SEEN = 'ctd.audience_prompt_seen';
const KEY_ACCEPTANCE = 'ctd.terms_acceptance';
/** Terms version = current Terms "Last updated" date. Bump to re-prompt everyone. */
export const TERMS_VERSION = '2026-10-27';

interface StoredAcceptance { audience: Audience; accepted: true; termsVersion: string; acceptedAt: string }

const readAcceptance = (): StoredAcceptance | null => {
  try {
    const raw = localStorage.getItem(KEY_ACCEPTANCE);
    if (!raw) return null;
    const v = JSON.parse(raw);
    if (v?.accepted === true && v.termsVersion === TERMS_VERSION && ['clinical', 'patient'].includes(v.audience)) return v;
  } catch { /* ignore */ }
  return null;
};

export const PlainModeProvider = ({ children }: { children: ReactNode }) => {
  const initial = typeof window !== 'undefined' ? readAcceptance() : null;
  const [audience, setAudienceState] = useState<Audience>(initial?.audience ?? 'unspecified');
  const [plainMode, setPlainModeState] = useState(initial?.audience === 'patient');
  const [audiencePromptSeen, setAudiencePromptSeen] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(!!initial);

  // Stored locally only (no server record, no identifiers).
  const acceptTerms = useCallback((a: 'clinical' | 'patient') => {
    const record: StoredAcceptance = { audience: a, accepted: true, termsVersion: TERMS_VERSION, acceptedAt: new Date().toISOString().slice(0, 10) };
    try { localStorage.setItem(KEY_ACCEPTANCE, JSON.stringify(record)); } catch { /* ignore */ }
    setAudienceState(a);
    setPlainModeState(a === 'patient');
    setTermsAccepted(true);
    setAudiencePromptSeen(true);
  }, []);

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
        termsAccepted,
        acceptTerms,
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
