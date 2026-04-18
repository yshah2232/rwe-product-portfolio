/**
 * Lightweight client-side event tracker.
 * Logs to console (visible in Lovable analytics + browser devtools)
 * and dispatches a window CustomEvent so any analytics provider
 * (Plausible, GA, PostHog) can subscribe later without code changes.
 */
export type TrackEvent = {
  name: string;
  props?: Record<string, string | number | boolean | undefined>;
};

export const track = (name: string, props?: TrackEvent['props']) => {
  const payload: TrackEvent = { name, props };
  // eslint-disable-next-line no-console
  console.info('[track]', name, props ?? {});
  try {
    window.dispatchEvent(new CustomEvent('app:track', { detail: payload }));
  } catch {
    // no-op (SSR / restricted env)
  }
};
