// Site geography + surrounding population context for compared trials.
// Trial site facts come from ClinicalTrials.gov; population context comes from
// US Census ACS and is shown in a visually separate block. No scores.

import { useEffect, useMemo, useState } from 'react';
import { MapPin, Users, Info, Loader2 } from 'lucide-react';
import type { CompareTrial } from '@/lib/trialCompare';
import { STATE_TILES, summarizeGeography, type TrialCoverage } from '@/lib/trialGeography';

const ACS_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/acs-demographics`;

const COVERAGE_TEXT: Record<TrialCoverage, string> = {
  us: '',
  none_listed: 'No facility locations listed on the record. This does not confirm the trial has no sites.',
  non_us_only: 'Listed facilities are outside the United States only.',
  us_state_missing: 'US facilities listed without a usable state, so they cannot be placed on the map.',
};

type AcsRow = { state: string; data?: any; error?: string };
const pct = (n?: number | null, d?: number | null) => (n == null || !d ? null : `${((n / d) * 100).toFixed(1)}%`);

export function TrialGeographyPanel({ trials }: { trials: CompareTrial[] }) {
  const geo = useMemo(() => summarizeGeography(trials), [trials]);
  const [view, setView] = useState<'state' | 'region'>('state');
  const [acs, setAcs] = useState<{ loading: boolean; rows: AcsRow[]; error?: string; year?: number }>({ loading: false, rows: [] });
  const byState = useMemo(() => new Map(geo.states.map((s) => [s.state, s])), [geo]);
  const max = Math.max(1, ...geo.states.map((s) => s.siteCount));

  useEffect(() => {
    const top = geo.states.slice(0, 30);
    if (!top.length) return;
    let cancelled = false;
    setAcs({ loading: true, rows: [] });
    fetch(ACS_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}` },
      body: JSON.stringify({ geos: top.map((s) => ({ type: 'state', id: s.fips })) }),
    }).then((r) => r.json()).then((b) => {
      if (cancelled) return;
      if (b.error) return setAcs({ loading: false, rows: [], error: b.error });
      const rows: AcsRow[] = (b.results ?? []).map((r: any, i: number) => ({ state: top[i].state, data: r.data, error: r.error }));
      const keyErr = rows.length > 0 && rows.every((r) => r.error === rows[0].error) &&
        (rows[0].error === 'census_key_required' || rows[0].error === 'census_key_invalid') ? rows[0].error : undefined;
      setAcs({ loading: false, rows: keyErr ? [] : rows, error: keyErr, year: b.acsYear });
    }).catch(() => { if (!cancelled) setAcs({ loading: false, rows: [], error: 'network' }); });
    return () => { cancelled = true; };
  }, [geo]);

  const gaps = geo.trials.filter((t) => t.coverage !== 'us' || t.usSitesWithoutState > 0);

  return (
    <div className="mt-10 space-y-8">
      {/* ── Trial sites (ClinicalTrials.gov) ── */}
      <section aria-labelledby="geo-sites" className="rounded-md border border-border bg-card">
        <header className="p-4 border-b border-border flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 id="geo-sites" className="font-display text-xl font-medium text-foreground flex items-center gap-2"><MapPin className="h-4 w-4 text-primary" /> Where the trial sites are</h2>
            <p className="text-[12px] text-muted-foreground mt-1">US facility locations listed on each ClinicalTrials.gov record. Site counts are not enrollment counts.</p>
          </div>
          <div className="inline-flex rounded border border-border text-[12px]" role="group" aria-label="Summary level">
            {(['state', 'region'] as const).map((v) => (
              <button key={v} onClick={() => setView(v)} aria-pressed={view === v}
                className={`px-3 py-1.5 ${view === v ? 'bg-primary text-primary-foreground' : 'text-foreground hover:bg-muted'}`}>
                By {v}
              </button>
            ))}
          </div>
        </header>

        <div className="p-4 grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
          <div className="min-w-0 overflow-x-auto">
            {geo.states.length === 0 ? (
              <p className="text-sm text-muted-foreground italic">No compared trial lists a US facility with a state, so there is nothing to map.</p>
            ) : (
              <div className="grid gap-[3px] sm:gap-1 min-w-[264px]" style={{ gridTemplateColumns: 'repeat(12, minmax(0, 1fr))' }} aria-label="US site map">
                {Object.entries(STATE_TILES).map(([name, [c, r, ab]]) => {
                  const row = byState.get(name);
                  const o = row ? 0.25 + 0.75 * (row.siteCount / max) : 0;
                  return (
                    <div key={name} title={row ? `${name}: ${row.siteCount} sites, ${row.recruitingSites} recruiting` : `${name}: no listed sites from these trials`}
                      style={{ gridColumn: c + 1, gridRow: r + 1, ...(row ? { backgroundColor: `hsl(var(--primary) / ${o})` } : {}) }}
                      className={`aspect-square rounded-sm text-[9px] font-semibold flex items-center justify-center ${row ? (o > 0.55 ? 'text-primary-foreground' : 'text-foreground') : 'bg-muted text-muted-foreground'}`}>
                      {ab}
                    </div>
                  );
                })}
              </div>
            )}
            <p className="mt-2 text-[11px] text-muted-foreground">Darker means more listed sites. Grey means none of these records list a site there.</p>
          </div>

          <div className="min-w-0 overflow-x-auto">
            <table className="w-full text-[12px] sm:text-[13px]">
              <thead>
                <tr className="text-left text-[11px] uppercase tracking-wider text-muted-foreground border-b border-border">
                  <th className="py-2 pr-2">{view === 'state' ? 'State' : 'Census region'}</th>
                  <th className="py-2 pr-2 text-right">Sites</th>
                  <th className="py-2 pr-2 text-right">Recruiting sites</th>
                  <th className="py-2 pr-2 text-right">Trials</th>
                  <th className="py-2">Trials represented</th>
                </tr>
              </thead>
              <tbody>
                {(view === 'state' ? geo.states.map((s) => ({ key: s.state, ...s })) : geo.regions.map((r) => ({ key: r.region, ...r }))).map((r) => (
                  <tr key={r.key} className="border-b border-border/60">
                    <td className="py-2 pr-2 font-medium text-foreground">{r.key}</td>
                    <td className="py-2 pr-2 text-right tabular-nums">{r.siteCount}</td>
                    <td className="py-2 pr-2 text-right tabular-nums">
                      {r.statusUnreported === r.siteCount ? <span className="italic text-muted-foreground">Not reported</span> : r.recruitingSites}
                      {r.statusUnreported > 0 && r.statusUnreported < r.siteCount && <span className="block text-[10px] text-muted-foreground">{r.statusUnreported} status not reported</span>}
                    </td>
                    <td className="py-2 pr-2 text-right tabular-nums">{r.trials.length} of {trials.length}</td>
                    <td className="py-2 font-mono text-[10px] sm:text-[11px] text-muted-foreground break-all">{r.trials.map((n) => <span key={n} className="inline-block mr-1.5">{n}</span>)}</td>
                  </tr>
                ))}
                {geo.states.length === 0 && <tr><td colSpan={5} className="py-3 text-muted-foreground italic">No US sites with a state on these records.</td></tr>}
              </tbody>
            </table>
          </div>
        </div>

        {gaps.length > 0 && (
          <div className="mx-4 mb-4 rounded border border-border bg-muted/40 p-3 text-[12px] text-foreground">
            <p className="font-semibold mb-1">Incomplete facility information</p>
            <ul className="space-y-1">
              {gaps.map((t) => (
                <li key={t.nctId}><span className="font-mono">{t.nctId}</span>: {t.coverage !== 'us' ? COVERAGE_TEXT[t.coverage] : `${t.usSitesWithoutState} US site${t.usSitesWithoutState === 1 ? '' : 's'} listed without a state, not shown on the map.`}
                  {t.nonUsSites > 0 && t.coverage !== 'non_us_only' && ` ${t.nonUsSites} non US site${t.nonUsSites === 1 ? '' : 's'} also listed.`}</li>
              ))}
            </ul>
          </div>
        )}
      </section>

      {/* ── Surrounding population context (ACS) — separate on purpose ── */}
      <section aria-labelledby="geo-acs" className="rounded-md border border-dashed border-border bg-muted/30">
        <header className="p-4 border-b border-dashed border-border">
          <h2 id="geo-acs" className="font-display text-xl font-medium text-foreground flex items-center gap-2"><Users className="h-4 w-4 text-muted-foreground" /> Statewide population context (ACS)</h2>
          <p className="text-[12px] text-muted-foreground mt-1">
            Statewide residents from the US Census American Community Survey (ACS) 5 year estimates, for states with listed sites. This is <strong>not</strong> trial enrollment, patient demographics or disease prevalence.
          </p>
        </header>
        <div className="p-4 overflow-x-auto">
          {geo.states.length === 0 ? (
            <p className="text-sm text-muted-foreground italic">No states to describe.</p>
          ) : acs.loading ? (
            <p className="text-sm text-muted-foreground flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" /> Loading Census data</p>
          ) : acs.error ? (
            <p className="text-sm text-muted-foreground">
              {acs.error === 'census_key_required'
                ? 'Census population data is not connected yet, so no population context is shown. No values are estimated in its place.'
                : acs.error === 'census_key_invalid'
                ? 'The Census Bureau did not accept the access key, so no population context is shown. No values are estimated in its place.'
                : 'Census population data could not be loaded right now. No values are estimated in its place.'}
            </p>
          ) : (
            <table className="w-full text-[13px] min-w-[640px]">
              <thead>
                <tr className="text-left text-[11px] uppercase tracking-wider text-muted-foreground border-b border-border">
                  <th className="py-2 pr-2">State residents</th>
                  <th className="py-2 pr-2 text-right">Statewide population</th>
                  <th className="py-2 pr-2 text-right">Hispanic or Latino</th>
                  <th className="py-2 pr-2 text-right">Black, non Hispanic</th>
                  <th className="py-2 pr-2 text-right">Asian, non Hispanic</th>
                  <th className="py-2 pr-2 text-right">Age 65+</th>
                  <th className="py-2 text-right">Median household income</th>
                </tr>
              </thead>
              <tbody>
                {acs.rows.map((r) => {
                  const d = r.data; const t = d?.total_population;
                  return (
                    <tr key={r.state} className="border-b border-border/60">
                      <td className="py-2 pr-2 font-medium">{r.state}</td>
                      {r.error || !d ? (
                        <td colSpan={6} className="py-2 italic text-muted-foreground">Not available from Census for this state</td>
                      ) : (
                        <>
                          <td className="py-2 pr-2 text-right tabular-nums">{t?.toLocaleString('en-US') ?? '—'}</td>
                          <td className="py-2 pr-2 text-right tabular-nums">{pct(d.pop_hispanic, t) ?? '—'}</td>
                          <td className="py-2 pr-2 text-right tabular-nums">{pct(d.pop_black_nh, t) ?? '—'}</td>
                          <td className="py-2 pr-2 text-right tabular-nums">{pct(d.pop_asian_nh, t) ?? '—'}</td>
                          <td className="py-2 pr-2 text-right tabular-nums">{pct(d.pop_age_65plus, t) ?? '—'}</td>
                          <td className="py-2 text-right tabular-nums">{d.median_household_income != null ? `$${Number(d.median_household_income).toLocaleString('en-US')}` : '—'}</td>
                        </>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </section>

      {/* ── Sources and limits ── */}
      <section aria-labelledby="geo-notes" className="rounded-md border border-border p-4 text-[12px] text-foreground">
        <h3 id="geo-notes" className="font-semibold flex items-center gap-1.5 mb-2"><Info className="h-3.5 w-3.5 text-primary" /> Data sources and limits</h3>
        <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
          <li><strong className="text-foreground">ClinicalTrials.gov</strong> (API v2, live): facility names, city, state, country and site recruitment status, as entered by each sponsor. Records can be incomplete or out of date.</li>
          <li><strong className="text-foreground">US Census ACS</strong>{acs.year ? ` (${acs.year} 5 year estimates)` : ' (5 year estimates)'}: statewide resident counts, race and ethnicity, age and household income.</li>
          <li><strong className="text-foreground">What cannot be concluded:</strong> who enrolled or will enroll, how diverse any trial's participants are, how many patients each site serves, or whether one trial or site is better. Statewide figures may differ sharply from the area around a specific site.</li>
        </ul>
      </section>
    </div>
  );
}
