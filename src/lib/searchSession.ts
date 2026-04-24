/**
 * Session id + feedback ingest helpers for the Search Registry.
 * Session id is browser-local (sessionStorage) so it survives reloads in the
 * same tab but resets between visits — good enough for funnel/refinement
 * analytics without being a persistent identifier.
 */

const SID_KEY = 'ctg_sid_v1';

export function getSessionId(): string {
  try {
    let id = sessionStorage.getItem(SID_KEY);
    if (!id) {
      id = crypto.randomUUID();
      sessionStorage.setItem(SID_KEY, id);
    }
    return id;
  } catch {
    return 'no-storage';
  }
}

const FEEDBACK_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ctg-feedback`;

export async function sendSignal(payload: Record<string, unknown>): Promise<void> {
  // Fire-and-forget; never block the UI.
  try {
    await fetch(FEEDBACK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
      },
      body: JSON.stringify(payload),
      keepalive: true,
    });
  } catch {
    // swallow — analytics must not crash UX
  }
}
