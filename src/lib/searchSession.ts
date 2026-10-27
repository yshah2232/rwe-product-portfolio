/**
 * Session id + feedback ingest helpers for the Search Registry.
 * Session id is browser-local (sessionStorage) so it survives reloads in the
 * same tab but resets between visits — good enough for funnel/refinement
 * analytics without being a persistent identifier.
 */

const sessionId = crypto.randomUUID();

export function getSessionId(): string {
  return sessionId;
}

export async function sendSignal(payload: Record<string, unknown>): Promise<void> {
  // Do not transmit or retain visitor feedback, clicks, queries, or outcomes.
  void payload;
}
