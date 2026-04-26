// /cohorts/:id/diversity — Diversity & Access overlay (Module 2)
// Shows cohort-site catchment-area demographics vs national vs disease prevalence.
//
// Pipeline (client-driven so we can show progress):
//  1. Read cohort + cohort_trials + saved indications
//  2. Read existing normalized_locations for those NCT IDs
//  3. If empty: trigger ctg-normalize-locations (owner only)
//  4. Aggregate unique geos (county or zip3) → call acs-demographics
//  5. Read disease_prevalence rows for cohort indications
//  6. Render: cohort catchment vs US baseline vs disease prevalence

import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeft, Loader2, MapPin, Sparkles, Info, AlertTriangle, ExternalLink,
  Users, DollarSign, Activity,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { getSessionId } from '@/lib/searchSession';
import { usePageTitle } from '@/hooks/usePageTitle';
import { toast } from 'sonner';

const NORMALIZE_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ctg-normalize-locations`;
const ACS_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/acs-demographics`;

interface Cohort {
  id: string; session_id: string; name: string;
  refreshed_at: string | null; created_at: string;
}

interface NormLoc {
  id: string; nct_id: string;
  raw_city: string | null; raw_state: string | null; raw_country: string;
  state_code: string | null; county_name: string | null;
  county_fips: string | null; zip3: string | null;
  resolution_method: string; resolution_confidence: number;
}

interface AcsRow {
  geo_type: string; geo_id: string;
  total_population: number | null;
  pop_white_nh: number | null; pop_black_nh: number | null; pop_asian_nh: number | null;
  pop_aian_nh: number | null; pop_nhpi_nh: number | null; pop_other_nh: number | null;
  pop_multi_nh: number | null; pop_hispanic: number | null;
  pop_age_under18: number | null; pop_age_18_64: number | null; pop_age_65plus: number | null;
  median_household_income: number | null;
  source_url: string;
}

interface PrevalenceRow {
  indication_clean: string; population_group: string; prevalence_per_100k: number | null;
  metric_type: string; source_name: string; source_url: string; source_year: number;
}

const RACE_GROUPS = [
  { key: 'white_nh', label: 'White (NH)', color: 'hsl(217 91% 60%)' },
  { key: 'black_nh', label: 'Black (NH)', color: 'hsl(263 70% 55%)' },
  { key: 'hispanic', label: 'Hispanic', color: 'hsl(38 92% 50%)' },
  { key: 'asian_nh', label: 'Asian (NH)', color: 'hsl(142 71% 45%)' },
  { key: 'aian_nh', label: 'AIAN (NH)', color: 'hsl(0 84% 60%)' },
  { key: 'nhpi_nh', label: 'NHPI (NH)', color: 'hsl(280 65% 60%)' },
  { key: 'multi_nh', label: 'Multiracial', color: 'hsl(189 94% 43%)' },
  { key: 'other_nh', label: 'Other', color: 'hsl(220 9% 60%)' },
] as const;

// Geo resolution is County-only — Census ACS does not natively support ZIP3.
// (Earlier ZIP3 toggle was misleading and silently failed; removed.)
const GEO_MODE = 'county' as const;

const CohortDiversity = () => {
  const { id } = useParams<{ id: string }>();
  const [cohort, setCohort] = useState<Cohort | null>(null);
  const [indications, setIndications] = useState<string[]>([]);
  const [locs, setLocs] = useState<NormLoc[]>([]);
  const [acs, setAcs] = useState<Record<string, AcsRow>>({});
  const [prevalence, setPrevalence] = useState<PrevalenceRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [normalizing, setNormalizing] = useState(false);
  const [acsLoading, setAcsLoading] = useState(false);
  usePageTitle(cohort ? `${cohort.name} — Diversity & Access` : 'Diversity & Access');

  const isOwner = !!cohort && cohort.session_id === getSessionId();

  useEffect(() => {
    if (!id) return;
    void loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // Load ACS whenever locations change
  useEffect(() => {
    if (locs.length === 0) return;
    void loadAcs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [locs]);

  const loadAll = async () => {
    if (!id) return;
    setLoading(true);
    const [{ data: c }, { data: t }] = await Promise.all([
      supabase.from('saved_cohorts').select('id, session_id, name, refreshed_at, created_at')
        .eq('id', id).maybeSingle(),
      supabase.from('cohort_trials').select('nct_id, conditions_clean')
        .eq('cohort_id', id),
    ]);
    setCohort((c as Cohort) ?? null);
    const nctIds = ((t ?? []) as any[]).map((r) => r.nct_id);
    const inds = Array.from(new Set(((t ?? []) as any[]).flatMap((r) => r.conditions_clean ?? []).filter(Boolean))) as string[];
    setIndications(inds);

    // Locations + prevalence in parallel
    const [{ data: l }, { data: prev }] = await Promise.all([
      nctIds.length > 0
        ? supabase.from('normalized_locations').select('*').in('nct_id', nctIds)
        : Promise.resolve({ data: [] as NormLoc[] }),
      inds.length > 0
        ? supabase.from('disease_prevalence').select('*').in('indication_clean', inds)
        : Promise.resolve({ data: [] as PrevalenceRow[] }),
    ]);
    setLocs(((l ?? []) as NormLoc[]));
    setPrevalence((prev ?? []) as PrevalenceRow[]);
    setLoading(false);
  };

  const loadAcs = async () => {
    setAcsLoading(true);
    const usGeos = locs.filter((l) => l.raw_country.toLowerCase() === 'united states' || l.raw_country === 'US');
    const ids = Array.from(new Set(
      usGeos.map((l) => geoMode === 'county' ? l.county_fips : l.zip3).filter(Boolean)
    )) as string[];

    const geos: Array<{ type: string; id: string }> = [{ type: 'national', id: 'US' }];
    ids.slice(0, 28).forEach((gid) => geos.push({ type: geoMode, id: gid }));

    try {
      const res = await fetch(ACS_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ geos }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error || `ACS ${res.status}`);
      const map: Record<string, AcsRow> = {};
      for (const r of body.results ?? []) {
        if (r.data) map[`${r.geo.type}:${r.geo.id}`] = r.data;
      }
      setAcs(map);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to load demographics');
    } finally {
      setAcsLoading(false);
    }
  };

  const handleNormalize = async () => {
    if (!cohort || !isOwner) return;
    setNormalizing(true);
    try {
      const res = await fetch(NORMALIZE_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ cohortId: cohort.id, sessionId: getSessionId() }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error || `Normalize ${res.status}`);
      toast.success(
        `Resolved ${body.resolvedLocations}/${body.totalLocations} sites across ${body.processedTrials} trial${body.processedTrials === 1 ? '' : 's'}.`,
      );
      await loadAll();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Normalization failed');
    } finally {
      setNormalizing(false);
    }
  };

  // Aggregate cohort-catchment population sums across visible US geos
  const cohortAcs = useMemo(() => {
    const usLocs = locs.filter((l) => l.raw_country.toLowerCase() === 'united states' || l.raw_country === 'US');
    const ids = Array.from(new Set(
      usLocs.map((l) => geoMode === 'county' ? l.county_fips : l.zip3).filter(Boolean)
    )) as string[];
    if (ids.length === 0) return null;

    const sums = {
      total: 0, white_nh: 0, black_nh: 0, hispanic: 0, asian_nh: 0,
      aian_nh: 0, nhpi_nh: 0, multi_nh: 0, other_nh: 0,
      under18: 0, age_18_64: 0, age_65plus: 0,
    };
    let incomeWeighted = 0, incomeWeight = 0;
    let matched = 0;
    for (const gid of ids) {
      const row = acs[`${geoMode}:${gid}`];
      if (!row || !row.total_population) continue;
      matched++;
      sums.total += row.total_population;
      sums.white_nh += row.pop_white_nh ?? 0;
      sums.black_nh += row.pop_black_nh ?? 0;
      sums.hispanic += row.pop_hispanic ?? 0;
      sums.asian_nh += row.pop_asian_nh ?? 0;
      sums.aian_nh += row.pop_aian_nh ?? 0;
      sums.nhpi_nh += row.pop_nhpi_nh ?? 0;
      sums.multi_nh += row.pop_multi_nh ?? 0;
      sums.other_nh += row.pop_other_nh ?? 0;
      sums.under18 += row.pop_age_under18 ?? 0;
      sums.age_18_64 += row.pop_age_18_64 ?? 0;
      sums.age_65plus += row.pop_age_65plus ?? 0;
      if (row.median_household_income) {
        incomeWeighted += row.median_household_income * row.total_population;
        incomeWeight += row.total_population;
      }
    }
    if (matched === 0) return null;
    return {
      ...sums,
      median_income: incomeWeight > 0 ? Math.round(incomeWeighted / incomeWeight) : null,
      uniqueGeos: matched,
    };
  }, [locs, acs, geoMode]);

  const national = acs['national:US'];

  // Convert disease prevalence (per 100k) into normalized "expected share" for chart comparison.
  // For each indication, compute expected pct_of_diagnoses by group = group_rate * group_pop / Σ.
  const expectedFromPrevalence = useMemo(() => {
    if (!national || prevalence.length === 0) return null;
    // Pick most data-rich indication
    const byIndication = new Map<string, PrevalenceRow[]>();
    prevalence.forEach((p) => {
      const arr = byIndication.get(p.indication_clean) ?? [];
      arr.push(p);
      byIndication.set(p.indication_clean, arr);
    });
    const best = Array.from(byIndication.entries()).sort((a, b) => b[1].length - a[1].length)[0];
    if (!best) return null;
    const [indication, rows] = best;
    const groupPop: Record<string, number> = {
      white_nh: national.pop_white_nh ?? 0,
      black_nh: national.pop_black_nh ?? 0,
      asian_nh: national.pop_asian_nh ?? 0,
      hispanic: national.pop_hispanic ?? 0,
      aian_nh: national.pop_aian_nh ?? 0,
    };
    const expected: Record<string, number> = {};
    let denom = 0;
    rows.forEach((r) => {
      const pop = groupPop[r.population_group];
      if (pop && r.prevalence_per_100k) {
        const cases = (r.prevalence_per_100k / 100_000) * pop;
        expected[r.population_group] = cases;
        denom += cases;
      }
    });
    if (denom === 0) return null;
    return {
      indication,
      sources: Array.from(new Set(rows.map((r) => `${r.source_name} (${r.source_year})`))),
      sourceUrls: Array.from(new Set(rows.map((r) => r.source_url))),
      shares: Object.fromEntries(Object.entries(expected).map(([k, v]) => [k, v / denom])),
    };
  }, [prevalence, national]);

  const usSiteCount = useMemo(() =>
    locs.filter((l) => (l.raw_country.toLowerCase() === 'united states' || l.raw_country === 'US') &&
      (geoMode === 'county' ? l.county_fips : l.zip3)).length,
  [locs, geoMode]);

  if (loading) {
    return (
      <div className="bg-background min-h-screen flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }
  if (!cohort) {
    return (
      <div className="bg-background min-h-screen flex flex-col items-center justify-center px-6 text-center">
        <p className="font-display text-2xl text-foreground mb-2">Cohort not found</p>
        <Button asChild><Link to="/cohorts">Back to cohorts</Link></Button>
      </div>
    );
  }

  return (
    <div className="bg-background min-h-screen">
      {/* Header */}
      <section className="px-6 md:px-10 lg:px-16 pt-12 pb-6 border-b border-border/50">
        <div className="max-w-5xl mx-auto">
          <Link to={`/cohorts/${cohort.id}`}
            className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors mb-5">
            <ArrowLeft className="h-3.5 w-3.5" /> Back to cohort
          </Link>
          <h1 className="font-display text-3xl md:text-4xl font-medium leading-tight text-foreground">
            Diversity & Access — {cohort.name}
          </h1>
          <p className="mt-3 text-[14px] text-muted-foreground max-w-3xl leading-relaxed">
            US Census ACS 5-year ({national ? 2022 : '—'}) demographics for the catchment areas of this cohort's
            sites, compared against the US national average and disease-prevalence benchmarks.
          </p>
          <div className="flex flex-wrap items-center gap-3 mt-4">
            <Tabs value={geoMode} onValueChange={(v) => setGeoMode(v as GeoMode)}>
              <TabsList>
                <TabsTrigger value="county">County (FIPS)</TabsTrigger>
                <TabsTrigger value="zip3">ZIP3</TabsTrigger>
              </TabsList>
            </Tabs>
            {acsLoading && <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />}
            <Badge variant="outline" className="text-[10px]">
              {usSiteCount} US site{usSiteCount === 1 ? '' : 's'} resolved
            </Badge>
            {cohortAcs && (
              <Badge variant="outline" className="text-[10px]">
                {cohortAcs.uniqueGeos} unique {geoMode}{cohortAcs.uniqueGeos === 1 ? '' : 's'}
              </Badge>
            )}
            {indications.length > 0 && (
              <Badge variant="outline" className="text-[10px]">
                {indications.length} indication{indications.length === 1 ? '' : 's'}
              </Badge>
            )}
          </div>
        </div>
      </section>

      {/* No locations yet — prompt normalization */}
      {locs.length === 0 && (
        <section className="px-6 md:px-10 lg:px-16 py-10">
          <div className="max-w-2xl mx-auto rounded-xl border border-border/60 bg-card p-6 text-center">
            <MapPin className="h-8 w-8 text-muted-foreground/60 mx-auto mb-3" />
            <p className="font-display text-xl text-foreground">Site locations not yet resolved</p>
            <p className="text-sm text-muted-foreground mt-2 max-w-md mx-auto">
              We need to fetch each trial's site list from CTG.gov and resolve city + state to county FIPS codes
              via the US Census Geocoder. This runs once per cohort and caches the result.
            </p>
            {isOwner ? (
              <Button onClick={handleNormalize} disabled={normalizing} className="mt-5 gap-2">
                {normalizing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                Resolve site locations
              </Button>
            ) : (
              <p className="text-[11px] text-muted-foreground mt-4">
                Only the cohort owner can run normalization.
              </p>
            )}
          </div>
        </section>
      )}

      {/* Diversity comparisons */}
      {locs.length > 0 && (
        <>
          <section className="px-6 md:px-10 lg:px-16 py-8 border-b border-border/50 bg-muted/20">
            <div className="max-w-5xl mx-auto">
              <h2 className="font-display text-xl font-medium text-foreground mb-1 flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" /> Race & Ethnicity
              </h2>
              <p className="text-[12px] text-muted-foreground mb-4">
                Distribution of population across cohort site catchment areas vs. US national vs.
                {expectedFromPrevalence ? ` "${expectedFromPrevalence.indication}" disease prevalence` : ' disease prevalence (no data)'}.
                Source: ACS Table B03002. {expectedFromPrevalence && expectedFromPrevalence.sources.join(' · ')}
              </p>
              {!cohortAcs ? (
                <div className="text-center py-10 text-sm text-muted-foreground border border-dashed border-border/60 rounded-xl">
                  {acsLoading ? 'Loading demographics…' : `No US ${geoMode} data resolved yet.`}
                </div>
              ) : (
                <RaceComparisonChart
                  cohort={cohortAcs}
                  national={national}
                  prevalence={expectedFromPrevalence}
                />
              )}
            </div>
          </section>

          <section className="px-6 md:px-10 lg:px-16 py-8 border-b border-border/50">
            <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6">
              <AgeCard cohort={cohortAcs} national={national} />
              <IncomeCard cohort={cohortAcs} national={national} />
            </div>
          </section>

          {/* Resolved locations table */}
          <section className="px-6 md:px-10 lg:px-16 py-8">
            <div className="max-w-5xl mx-auto">
              <h2 className="font-display text-lg font-medium text-foreground mb-3 flex items-center gap-2">
                <MapPin className="h-4 w-4 text-primary" /> Resolved sites ({locs.length})
              </h2>
              <p className="text-[11px] text-muted-foreground mb-3">
                Source: <code className="font-mono">protocolSection.contactsLocationsModule.locations[]</code> →
                US Census Geocoder.
              </p>
              <div className="rounded-xl border border-border/60 bg-card overflow-hidden">
                <table className="w-full text-[12px]">
                  <thead className="bg-muted/30 text-[10px] uppercase tracking-wider text-muted-foreground">
                    <tr>
                      <th className="text-left px-3 py-2 font-semibold">NCT</th>
                      <th className="text-left px-3 py-2 font-semibold">City, State</th>
                      <th className="text-left px-3 py-2 font-semibold">Country</th>
                      <th className="text-left px-3 py-2 font-semibold">County (FIPS)</th>
                      <th className="text-left px-3 py-2 font-semibold">ZIP3</th>
                      <th className="text-right px-3 py-2 font-semibold">Confidence</th>
                    </tr>
                  </thead>
                  <tbody>
                    {locs.slice(0, 100).map((l) => (
                      <tr key={l.id} className="border-t border-border/40">
                        <td className="px-3 py-2 font-mono text-[10px] text-primary">{l.nct_id}</td>
                        <td className="px-3 py-2">{[l.raw_city, l.raw_state].filter(Boolean).join(', ') || '—'}</td>
                        <td className="px-3 py-2 text-muted-foreground">{l.raw_country}</td>
                        <td className="px-3 py-2">
                          {l.county_name ? (
                            <span>{l.county_name} <span className="text-muted-foreground/60">({l.county_fips})</span></span>
                          ) : (
                            <span className="text-muted-foreground italic">unresolved</span>
                          )}
                        </td>
                        <td className="px-3 py-2 font-mono">{l.zip3 ?? '—'}</td>
                        <td className="px-3 py-2 text-right text-muted-foreground">{l.resolution_confidence}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {locs.length > 100 && (
                  <p className="text-[10px] text-muted-foreground p-2 border-t border-border/40">
                    Showing first 100 of {locs.length}.
                  </p>
                )}
              </div>
              {isOwner && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleNormalize}
                  disabled={normalizing}
                  className="mt-3 gap-2"
                >
                  {normalizing ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />}
                  Resolve more trials
                </Button>
              )}
            </div>
          </section>
        </>
      )}
    </div>
  );
};

// ── Race & ethnicity stacked-bar comparison ──
interface CohortAggregate {
  total: number;
  white_nh: number; black_nh: number; hispanic: number; asian_nh: number;
  aian_nh: number; nhpi_nh: number; multi_nh: number; other_nh: number;
  under18: number; age_18_64: number; age_65plus: number;
  median_income: number | null;
  uniqueGeos: number;
}

const RaceComparisonChart = ({
  cohort, national, prevalence,
}: {
  cohort: CohortAggregate;
  national?: AcsRow;
  prevalence: { indication: string; sources: string[]; sourceUrls: string[]; shares: Record<string, number> } | null;
}) => {
  const cohortShares = {
    white_nh: cohort.white_nh / cohort.total,
    black_nh: cohort.black_nh / cohort.total,
    hispanic: cohort.hispanic / cohort.total,
    asian_nh: cohort.asian_nh / cohort.total,
    aian_nh: cohort.aian_nh / cohort.total,
    nhpi_nh: cohort.nhpi_nh / cohort.total,
    multi_nh: cohort.multi_nh / cohort.total,
    other_nh: cohort.other_nh / cohort.total,
  };
  const nationalShares = national && national.total_population ? {
    white_nh: (national.pop_white_nh ?? 0) / national.total_population,
    black_nh: (national.pop_black_nh ?? 0) / national.total_population,
    hispanic: (national.pop_hispanic ?? 0) / national.total_population,
    asian_nh: (national.pop_asian_nh ?? 0) / national.total_population,
    aian_nh: (national.pop_aian_nh ?? 0) / national.total_population,
    nhpi_nh: (national.pop_nhpi_nh ?? 0) / national.total_population,
    multi_nh: (national.pop_multi_nh ?? 0) / national.total_population,
    other_nh: (national.pop_other_nh ?? 0) / national.total_population,
  } : null;

  const bars = [
    { label: 'Cohort sites (catchment)', shares: cohortShares, sub: `${cohort.total.toLocaleString()} ppl across ${cohort.uniqueGeos} geos` },
    nationalShares ? { label: 'US national (ACS)', shares: nationalShares, sub: `${national!.total_population!.toLocaleString()} ppl` } : null,
    prevalence ? { label: `Disease prevalence — ${prevalence.indication}`, shares: prevalence.shares, sub: prevalence.sources.join(' · ') } : null,
  ].filter(Boolean) as Array<{ label: string; shares: Record<string, number>; sub: string }>;

  // Gap callouts — find biggest under/over rep vs national
  const callouts: string[] = [];
  if (nationalShares) {
    for (const g of RACE_GROUPS) {
      const cohortPct = (cohortShares as any)[g.key] ?? 0;
      const natPct = (nationalShares as any)[g.key] ?? 0;
      const gap = (cohortPct - natPct) * 100;
      if (Math.abs(gap) >= 3) {
        callouts.push(
          `${g.label}: ${gap > 0 ? '+' : ''}${gap.toFixed(1)}pp vs US national (${(cohortPct * 100).toFixed(1)}% vs ${(natPct * 100).toFixed(1)}%)`,
        );
      }
    }
    callouts.sort((a, b) => Math.abs(parseFloat(b.split(': ')[1])) - Math.abs(parseFloat(a.split(': ')[1])));
  }

  return (
    <div className="space-y-5">
      {/* Legend */}
      <div className="flex flex-wrap gap-3 text-[11px]">
        {RACE_GROUPS.map((g) => (
          <div key={g.key} className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-sm" style={{ background: g.color }} />
            <span className="text-foreground">{g.label}</span>
          </div>
        ))}
      </div>

      {/* Stacked bars */}
      <div className="space-y-3">
        {bars.map((b, i) => (
          <motion.div
            key={b.label}
            initial={{ opacity: 0, x: -4 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.05 }}
          >
            <div className="flex items-baseline justify-between mb-1">
              <p className="text-[12px] font-medium text-foreground">{b.label}</p>
              <p className="text-[10px] text-muted-foreground">{b.sub}</p>
            </div>
            <div className="flex h-6 w-full overflow-hidden rounded-md border border-border/60">
              {RACE_GROUPS.map((g) => {
                const pct = (b.shares as any)[g.key] ?? 0;
                if (pct <= 0) return null;
                return (
                  <div
                    key={g.key}
                    style={{ width: `${pct * 100}%`, background: g.color }}
                    title={`${g.label}: ${(pct * 100).toFixed(1)}%`}
                  />
                );
              })}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Gap callouts */}
      {callouts.length > 0 && (
        <div className="rounded-md border border-amber-500/30 bg-amber-50/40 dark:bg-amber-950/20 p-3 text-[12px]">
          <p className="font-semibold text-foreground mb-1.5 flex items-center gap-1.5">
            <AlertTriangle className="h-3.5 w-3.5 text-amber-600" /> Representation gaps vs US national
          </p>
          <ul className="space-y-0.5 text-foreground">
            {callouts.slice(0, 4).map((c) => <li key={c}>· {c}</li>)}
          </ul>
        </div>
      )}

      {prevalence && (
        <p className="text-[10px] text-muted-foreground/80 leading-relaxed border-t border-border/40 pt-2">
          <Info className="inline h-3 w-3 mr-1" />
          Disease-prevalence shares are estimated as <code>(group_prevalence × group_population) / Σ</code>,
          using the most data-rich indication in this cohort. Sources:{' '}
          {prevalence.sourceUrls.map((u, i) => (
            <span key={u}>
              {i > 0 && ' · '}
              <a href={u} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline inline-flex items-center gap-0.5">
                {prevalence.sources[i]} <ExternalLink className="h-2.5 w-2.5" />
              </a>
            </span>
          ))}.
        </p>
      )}
    </div>
  );
};

const AgeCard = ({ cohort, national }: { cohort: CohortAggregate | null; national?: AcsRow }) => {
  if (!cohort) return null;
  const cTotal = cohort.under18 + cohort.age_18_64 + cohort.age_65plus;
  const nTotal = national ? (national.pop_age_under18 ?? 0) + (national.pop_age_18_64 ?? 0) + (national.pop_age_65plus ?? 0) : 0;
  const fmt = (n: number, d: number) => d > 0 ? `${((n / d) * 100).toFixed(1)}%` : '—';

  return (
    <div className="rounded-xl border border-border/60 bg-card p-5">
      <div className="flex items-center gap-2 mb-3">
        <Activity className="h-4 w-4 text-primary" />
        <p className="text-[11px] font-semibold tracking-wider uppercase text-muted-foreground">Age distribution</p>
      </div>
      <table className="w-full text-[12px]">
        <thead className="text-[10px] uppercase tracking-wider text-muted-foreground/70">
          <tr>
            <th className="text-left pb-2">Group</th>
            <th className="text-right pb-2">Cohort</th>
            <th className="text-right pb-2">US</th>
          </tr>
        </thead>
        <tbody>
          {[
            ['Under 18', cohort.under18, national?.pop_age_under18 ?? 0],
            ['18 – 64', cohort.age_18_64, national?.pop_age_18_64 ?? 0],
            ['65 +', cohort.age_65plus, national?.pop_age_65plus ?? 0],
          ].map(([label, c, n]) => (
            <tr key={label as string} className="border-t border-border/40">
              <td className="py-1.5 text-foreground">{label}</td>
              <td className="py-1.5 text-right">{fmt(c as number, cTotal)}</td>
              <td className="py-1.5 text-right text-muted-foreground">{fmt(n as number, nTotal)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="text-[10px] text-muted-foreground/60 mt-3 pt-2 border-t border-border/40 font-mono">
        Source: ACS Table B01001
      </p>
    </div>
  );
};

const IncomeCard = ({ cohort, national }: { cohort: CohortAggregate | null; national?: AcsRow }) => {
  if (!cohort) return null;
  const ci = cohort.median_income;
  const ni = national?.median_household_income ?? null;
  const gap = ci != null && ni != null ? ((ci - ni) / ni) * 100 : null;

  return (
    <div className="rounded-xl border border-border/60 bg-card p-5">
      <div className="flex items-center gap-2 mb-3">
        <DollarSign className="h-4 w-4 text-primary" />
        <p className="text-[11px] font-semibold tracking-wider uppercase text-muted-foreground">
          Median household income
        </p>
      </div>
      <div className="grid grid-cols-2 gap-4 mb-3">
        <div>
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground/70">Cohort sites</p>
          <p className="font-display text-2xl text-foreground tabular-nums mt-1">
            {ci != null ? `$${ci.toLocaleString()}` : '—'}
          </p>
        </div>
        <div>
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground/70">US national</p>
          <p className="font-display text-2xl text-muted-foreground tabular-nums mt-1">
            {ni != null ? `$${ni.toLocaleString()}` : '—'}
          </p>
        </div>
      </div>
      {gap != null && (
        <p className={`text-[12px] font-medium ${gap >= 0 ? 'text-primary' : 'text-amber-700'}`}>
          {gap >= 0 ? '+' : ''}{gap.toFixed(1)}% vs US median
        </p>
      )}
      <p className="text-[10px] text-muted-foreground/60 mt-3 pt-2 border-t border-border/40 font-mono">
        Source: ACS Table B19013, population-weighted
      </p>
    </div>
  );
};

export default CohortDiversity;
