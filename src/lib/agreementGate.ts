// Agreement gate: interactive processing (registry search, AI, document review)
// runs only after the visitor accepts the current Terms and picks an audience.

export const TERMS_VERSION = '2026-10-27';
export const KEY_ACCEPTANCE = 'ctd.terms_acceptance';

export type AcceptedAudience = 'clinical' | 'patient';
export interface StoredAcceptance { audience: AcceptedAudience; accepted: true; termsVersion: string; acceptedAt: string }

type StorageLike = Pick<Storage, 'getItem'>;

export const readAcceptance = (storage: StorageLike | undefined, version = TERMS_VERSION): StoredAcceptance | null => {
  try {
    const raw = storage?.getItem(KEY_ACCEPTANCE);
    if (!raw) return null;
    const v = JSON.parse(raw);
    if (v?.accepted === true && v.termsVersion === version && ['clinical', 'patient'].includes(v.audience)) return v;
  } catch { /* ignore */ }
  return null;
};

/** Holds a direct URL query until acceptance, then runs it exactly once. */
export const createPendingSearchGate = (run: (q: string) => void) => {
  let pending: string | null = null;
  let consumed = false;
  return {
    /** Offer a deep-link query. Runs now if accepted, otherwise preserved. */
    offer(q: string, accepted: boolean) {
      if (consumed) return;
      pending = q;
      if (accepted) this.release(true);
    },
    /** Call whenever acceptance state changes. */
    release(accepted: boolean) {
      if (!accepted || consumed || pending === null) return;
      consumed = true;
      const q = pending;
      pending = null;
      run(q);
    },
    get pending() { return pending; },
  };
};
