import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useSeo } from '@/hooks/useSeo';

type Row = {
  id: string;
  path: string;
  event_type: string;
  x_norm: number | null;
  y_norm: number | null;
  scroll_depth_pct: number | null;
  selector: string | null;
  element_text: string | null;
  created_at: string;
};

const PATHS = ['/', '/search-registry'];

const HeatmapAnalytics = () => {
  useSeo({
    title: 'Interaction Heatmap — Internal Analytics',
    description: 'Internal click heatmap and scroll depth view for tracked pages.',
    canonical: '/analytics/heatmap',
    noindex: true,
  });

  const [path, setPath] = useState<string>('/');
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    const since = new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString();
    supabase
      .from('ui_interactions')
      .select('id, path, event_type, x_norm, y_norm, scroll_depth_pct, selector, element_text, created_at')
      .eq('path', path)
      .gte('created_at', since)
      .order('created_at', { ascending: false })
      .limit(5000)
      .then(({ data, error }) => {
        if (cancelled) return;
        if (error) console.warn(error);
        setRows((data as Row[]) || []);
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [path]);

  const clicks = rows.filter((r) => r.event_type === 'click' || r.event_type === 'rage_click');
  const rageClicks = rows.filter((r) => r.event_type === 'rage_click');

  const topElements = useMemo(() => {
    const map = new Map<string, { count: number; sample: string }>();
    clicks.forEach((c) => {
      const key = c.element_text?.slice(0, 60) || c.selector?.slice(0, 60) || '(unknown)';
      const cur = map.get(key) || { count: 0, sample: c.selector || '' };
      cur.count += 1;
      map.set(key, cur);
    });
    return Array.from(map.entries())
      .sort((a, b) => b[1].count - a[1].count)
      .slice(0, 25);
  }, [clicks]);

  const scrollBuckets = useMemo(() => {
    const buckets: Record<number, number> = { 0: 0, 25: 0, 50: 0, 75: 0, 100: 0 };
    rows
      .filter((r) => r.event_type === 'scroll_depth' && r.scroll_depth_pct != null)
      .forEach((r) => {
        const b = r.scroll_depth_pct!;
        if (b in buckets) buckets[b] += 1;
      });
    return buckets;
  }, [rows]);

  return (
    <div className="max-w-6xl mx-auto px-6 md:px-10 py-8 space-y-6">
      <header>
        <h1 className="text-2xl font-bold" style={{ color: 'hsl(var(--primary))' }}>
          Interaction Heatmap
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Last 30 days · click positions, top elements, scroll depth, and rage-click hotspots.
        </p>
      </header>

      <div className="flex gap-2">
        {PATHS.map((p) => (
          <button
            key={p}
            onClick={() => setPath(p)}
            className={`px-3 py-1.5 rounded-sm text-sm font-semibold border ${
              path === p
                ? 'bg-primary text-white border-primary'
                : 'bg-background border-border text-foreground/70 hover:border-primary/50'
            }`}
          >
            {p}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : (
        <>
          <section className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Stat label="Clicks" value={clicks.length} />
            <Stat label="Rage clicks" value={rageClicks.length} accent={rageClicks.length > 0} />
            <Stat label="Unique elements" value={topElements.length} />
            <Stat label="Reached 75%+ scroll" value={scrollBuckets[75] + scrollBuckets[100]} />
          </section>

          <section className="ctg-panel p-4">
            <h2 className="font-bold mb-3" style={{ color: 'hsl(var(--primary))' }}>
              Click heatmap (normalized to viewport)
            </h2>
            <div
              className="relative w-full rounded-sm border border-border bg-muted/30"
              style={{ aspectRatio: '16 / 10' }}
            >
              {clicks.map((c) => (
                <span
                  key={c.id}
                  className="absolute rounded-full pointer-events-none"
                  style={{
                    left: `${(c.x_norm || 0) * 100}%`,
                    top: `${(c.y_norm || 0) * 100}%`,
                    width: 22,
                    height: 22,
                    transform: 'translate(-50%, -50%)',
                    background:
                      c.event_type === 'rage_click'
                        ? 'radial-gradient(circle, rgba(239,68,68,0.7), rgba(239,68,68,0) 70%)'
                        : 'radial-gradient(circle, rgba(29,79,134,0.45), rgba(29,79,134,0) 70%)',
                  }}
                />
              ))}
            </div>
            <p className="text-[11px] text-muted-foreground mt-2">
              Red = rage click cluster (3+ clicks within 1s in a 40px radius). Coordinates are
              viewport-normalized, so positions match relatively even across screen sizes.
            </p>
          </section>

          <section className="ctg-panel p-4">
            <h2 className="font-bold mb-3" style={{ color: 'hsl(var(--primary))' }}>
              Scroll depth distribution
            </h2>
            <div className="space-y-1.5">
              {[0, 25, 50, 75, 100].map((b) => {
                const max = Math.max(...Object.values(scrollBuckets), 1);
                const pct = (scrollBuckets[b] / max) * 100;
                return (
                  <div key={b} className="flex items-center gap-3 text-sm">
                    <span className="w-12 text-right text-muted-foreground">{b}%</span>
                    <div className="flex-1 h-3 bg-muted rounded-sm overflow-hidden">
                      <div className="h-full bg-primary" style={{ width: `${pct}%` }} />
                    </div>
                    <span className="w-10 text-right tabular-nums">{scrollBuckets[b]}</span>
                  </div>
                );
              })}
            </div>
          </section>

          <section className="ctg-panel p-4">
            <h2 className="font-bold mb-3" style={{ color: 'hsl(var(--primary))' }}>
              Most-clicked elements
            </h2>
            {topElements.length === 0 ? (
              <p className="text-sm text-muted-foreground">No clicks recorded yet.</p>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-muted-foreground border-b border-border">
                    <th className="py-1.5">Element / Text</th>
                    <th className="py-1.5 w-24 text-right">Clicks</th>
                  </tr>
                </thead>
                <tbody>
                  {topElements.map(([label, info]) => (
                    <tr key={label} className="border-b border-border/50">
                      <td className="py-1.5 pr-2">
                        <div className="font-medium truncate">{label}</div>
                        <div className="text-[11px] text-muted-foreground truncate font-mono">
                          {info.sample}
                        </div>
                      </td>
                      <td className="py-1.5 text-right tabular-nums">{info.count}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </section>
        </>
      )}
    </div>
  );
};

const Stat = ({ label, value, accent }: { label: string; value: number; accent?: boolean }) => (
  <div className="ctg-panel p-3">
    <div className="text-[11px] uppercase tracking-wider text-muted-foreground">{label}</div>
    <div
      className="text-2xl font-bold mt-1"
      style={{ color: accent ? 'hsl(0 70% 50%)' : 'hsl(var(--primary))' }}
    >
      {value}
    </div>
  </div>
);

export default HeatmapAnalytics;
