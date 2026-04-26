// Hook that fetches & caches the plain-language version of a single trial.
// Only fires when `enabled` is true (so it skips work when plain mode is off).

import { useEffect, useState } from 'react';

export interface PlainTrial {
  nct_id: string;
  plain_title: string;
  plain_summary: string;
  plain_condition: string;
  plain_intervention: string;
  plain_eligibility: string;
  plain_design: string;
  plain_time_commitment: string;
  plain_what_happens: string;
  key_numbers: string[];
  is_recruiting: boolean;
  cached?: boolean;
}

const URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ctg-plain-language`;

// In-memory cache to avoid re-hitting the function within a session
const memCache = new Map<string, PlainTrial>();

export function usePlainTrial(nctId: string | null, enabled: boolean) {
  const [data, setData] = useState<PlainTrial | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled || !nctId) {
      setData(null);
      return;
    }

    // Memory cache hit
    const cached = memCache.get(nctId);
    if (cached) {
      setData(cached);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    fetch(`${URL}?nctId=${encodeURIComponent(nctId)}`, {
      headers: { Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}` },
    })
      .then((r) => r.json().then((b) => ({ ok: r.ok, body: b })))
      .then(({ ok, body }) => {
        if (cancelled) return;
        if (!ok) {
          setError(body.error ?? 'Failed to load plain-language version');
        } else {
          memCache.set(nctId, body);
          setData(body);
        }
      })
      .catch((e) => !cancelled && setError(e instanceof Error ? e.message : 'Network error'))
      .finally(() => !cancelled && setLoading(false));

    return () => {
      cancelled = true;
    };
  }, [nctId, enabled]);

  return { data, loading, error };
}
