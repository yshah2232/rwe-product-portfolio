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
  // Visitor analytics are disabled. Keep callers compatible without emitting activity.
  void name;
  void props;
};
