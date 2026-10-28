// /cohorts/:id/barriers — Module 3: Barriers & Access (Phase 1)
// Scores each US trial site on two access barriers, both from Census ACS
// 2022 5-year (real, citable):
//   - Language access — members of limited English speaking households,
//     pop 5+ (ACS Table C16002)
//   - Socioeconomic strain — income below poverty level (ACS Table B17001)
// Composite barrier score is relative to the US national rate.
// Sites without a resolved county (or outside the US) are NOT scored —
// no values are ever fabricated.

import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  ArrowLeft, Loader2, MapPin, Sparkles, Languages, PiggyBank, AlertTriangle, Info,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { getSessionId } from '@/lib/searchSession';
import { useSeo } from '@/hooks/useSeo';
import { toast } from 'sonner';
import BarrierScoreBadge from '@/components/BarrierScoreBadge';
import { computeBarrierScore } from '@/lib/barrierScore';

const COMPUTE_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ctg-barriers-compute`;

interface Cohort { id: string; session_id: string; name: string; created_at: string; }
interface NormLoc {
  id: string; nct_id: string;
  raw_facility: string | null; raw_city: string | null; raw_state: string | null; raw_country: string;
  county_name: string | null; county_fips: string | null;
  resolution_method: string;
}
interface SiteBarrier {
  id: string; nct_id: string; normalized_location_id: string; county_fips: string;
  lep_pct: number | null; poverty_pct: number | null; barrier_score: number | null;
  computed_at: string; expires_at: string;
}
interface NationalBarrier { lep_pct: number | null; poverty_pct: number | null; source_url: string | null; }

const isUS = (l: NormLoc) => l.raw_country.toLowerCase() === 'united states' || l.raw_country === 'US';

const CohortBarriers = () => {
  const { id } = useParams<{ id: string }>();
  const [cohort, setCohort] = useState<Cohort | null>(null);
  const [locs, setLocs] = useState<NormLoc[]>([]);
  const [barriers, setBarriers] = useState<SiteBarrier[]>([]);
  const [national, setNational] = useState<NationalBarrier | null>(null);
  const [loading, setLoading] = useState(true);
  const [computing, setComputing] = useState(false);
  const [keyMissing, setKeyMissing] = useState(false);

  useSeo({
    title: cohort ? `${cohort.name} | Barriers & Access` : 'Barriers & Access',
    description: cohort
      ? `Access barriers for ${cohort.name} trial sites: limited English speaking households and poverty from US Census ACS, scored against the national rate.`
      : 'Access barriers for trial sites from US Census ACS data.',
    noindex: true,
  });

  const isOwner = !!cohort && cohort.session_id === getSessionId();

  useEffect(() => {
    if (!id) return;
    void loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const loadAll = async () => {
    if (!id) return;
    setLoading(true);
    setKeyMissing(false);
    const [{ data: c }, { data: t }] = await Promise.all([
      supabase.from('saved_cohorts').select('id, session_id, name, created_at').eq('id', id).maybeSingle(),
      supabase.from('cohort_trials').select('nct_id').eq('cohort_id', id),
    ]);
    setCohort((c as Cohort) ?? null);
    const nctIds = ((t ?? []) as any[]).map((r) => r.nct_id);

    const [{ data: l }, { data: b }] = await Promise.all([
      nctIds.length > 0
        ? supabase.from('normalized_locations').select('*').in('nct_id', nctIds)
        : Promise.resolve({ data: [] as NormLoc[] }),
      supabase.from('site_barriers').select('*').eq('cohort_id', id),
    ]);
    setLocs(((l ?? []) as NormLoc[]));
    setBarriers(((b ?? []) as SiteBarrier[]));

    const { data: nat } = await supabase
      .from('acs_barriers_cache')
      .select('lep_pct, poverty_pct, source_url')
      .eq('geo_type', 'national').eq('geo_id', 'US').eq('acs_year', 2022)
      .gt('expires_at', new Date().toISOString())
      .maybeSingle();
    if (nat) {
      setNational({
        lep_pct: nat.lep_pct != null ? Number(nat.lep_pct) : null,
        poverty_pct: nat.poverty_pct != null ? Number(nat.poverty_pct) : null,
        source_url: nat.source_url,
      });
    }
    setLoading(false);
  };

  const handleCompute = async () => {
    if (!cohort || !isOwner) return;
    setComputing(true);
    setKeyMissing(false);
    try {
      const res = await fetch(COMPUTE_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ cohortId: cohort.id, sessionId: getSessionId() }),
      });
      const body = await res.json();
      if (!res.ok) {
        if (body?.error === 'census_key_required') {
          setKeyMissing(true);
          throw new Error('Census data source is not configured yet; barrier scoring needs a Census API key. Ask the site owner to add it.');
        }
        throw new Error(body?.error ?? `Compute ${res.status}`);
      }
      toast.success(
        `Scored ${body.scored} site${body.scored === 1 ? '' : 's'} across ${body.countiesFetched} count${body.countiesFetched === 1 ? 'y' : 'ies'}.`,
      );
      await loadAll();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Barrier scoring failed');
    } finally {
      setComputing(false);
    }
  };

  // Join locations ↔ barrier rows
  const rows = useMemo(() => {
    const byLoc = new Map(barriers.map((b) => [b.normalized_location_id, b]));
    const scored = locs
      .filter((l) => isUS(l) && l.county_fips && byLoc.has(l.id))
      .map((l) => ({ loc: l, b: byLoc.get(l.id)! }))
      .sort((a, z) => (z.b.barrier_score ?? -1) - (a.b.barrier_score ?? -1));
    const unscored = locs.filter((l) => !byLoc.has(l.id));
    return { scored, unscored };
  }, [locs, barriers]);

  const distribution = useMemo(() => {
    const d = { high: 0, moderate: 0, low: 0, unknown: 0 };
    for (const { b } of rows.scored) {
      if (b.barrier_score == null) d.unknown++;
      else if (b.barrier_score >= 150) d.high++;
      else if (b.barrier_score >= 100) d.moderate++;
      else d.low++;
    }
    return d;
  }, [rows.scored]);

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
      <section className="px-4 md:px-6 lg:px-16 pt-12 pb-6 border-b border-border/50">
        <div className="max-w-5xl mx-auto">
          <Link to={`/cohorts/${cohort.id}`}
            className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors mb-5">
            <ArrowLeft className="h-3.5 w-3.5" /> Back to cohort
          </Link>
          <h1 className="font-display text-3xl md:text-4xl font-medium leading-tight text-foreground">
            Barriers &amp; Access: {cohort.name}
          </h1>
          <p className="mt-3 text-[14px] text-muted-foreground max-w-3xl leading-relaxed">
            How hard it may be for people near each trial site to take part, measured from
            US Census ACS 2022 5-year data: limited English speaking households (Table C16002)
            and income below the poverty level (Table B17001), each compared with the US national rate.
            A site scores High when its county rate is at least 1.5× the national rate.
          </p>
          <div className="flex flex-wrap items-center gap-3 mt-4">
            <Badge variant="outline" className="text-[10px]">
              {rows.scored.length} site{rows.scored.length === 1 ? '' : 's'} scored
            </Badge>
            {rows.scored.length > 0 && (
              <>
                <Badge variant="outline" className="text-[10px]">{distribution.high} high</Badge>
                <Badge variant="outline" className="text-[10px]">{distribution.moderate} moderate</Badge>
                <Badge variant="outline" className="text-[10px]">{distribution.low} low</Badge>
              </>
            )}
            {national && national.lep_pct != null && (
              <Badge variant="outline" className="text-[10px]">
                US baseline: {national.lep_pct}% LEP · {national.poverty_pct}% poverty
              </Badge>
            )}
          </div>
          {keyMissing && (
            <div className="mt-4 flex items-start gap-2 rounded-md border border-border/60 bg-accent/30 p-3 text-[12px] text-foreground">
              <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0 text-muted-foreground" />
              <span>
                Live Census data is not configured yet. Barrier scores need a Census API key added
                by the site owner; nothing is estimated in the meantime.
              </span>
            </div>
          )}
        </div>
      </section>

      {/* Empty state — no normalized locations */}
      {locs.length === 0 && (
        <section className="px-4 md:px-6 lg:px-16 py-10">
          <div className="max-w-2xl mx-auto rounded-xl border border-border/60 bg-card p-6 text-center">
            <MapPin className="h-8 w-8 text-muted-foreground/60 mx-auto mb-3" />
            <p className="font-display text-xl text-foreground">Site locations not yet resolved</p>
            <p className="text-sm text-muted-foreground mt-2 max-w-md mx-auto">
              Barrier scoring uses the same site locations as the diversity overlay. Resolve
              locations there first, then return here.
            </p>
            <Button asChild variant="outline" className="mt-5">
              <Link to={`/cohorts/${cohort.id}/diversity`}>Go to Diversity &amp; Access</Link>
            </Button>
          </div>
        </section>
      )}

      {locs.length > 0 && (
        <>
          {/* Compute CTA */}
          <section className="px-4 md:px-6 lg:px-16 pt-8">
            <div className="max-w-5xl mx-auto flex flex-wrap items-center gap-3">
              {isOwner ? (
                <Button onClick={handleCompute} disabled={computing} className="gap-2">
                  {computing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                  {rows.scored.length > 0 ? 'Refresh barrier scores' : 'Score access barriers'}
                </Button>
              ) : (
                <p className="text-[11px] text-muted-foreground">
                  Only the cohort owner can run barrier scoring.
                </p>
              )}
              <p className="text-[11px] text-muted-foreground flex items-center gap-1.5">
                <Info className="h-3 w-3" />
                Scores compare each county with the US national rate from the same Census tables.
              </p>
            </div>
          </section>

          {/* Scored sites table */}
          <section className="px-4 md:px-6 lg:px-16 py-8">
            <div className="max-w-5xl mx-auto">
              <h2 className="font-display text-lg font-medium text-foreground mb-1">
                Scored sites ({rows.scored.length})
              </h2>
              <p className="text-[11px] text-muted-foreground mb-3">
                LEP = share of residents 5+ in limited English speaking households (ACS C16002).
                Poverty = share below the poverty level (ACS B17001). Score = county rate relative
                to national, averaged across the two components, capped at 100 each.
              </p>
              {rows.scored.length === 0 ? (
                <div className="rounded-xl border border-dashed border-border/60 bg-card p-8 text-center text-sm text-muted-foreground">
                  No barrier scores yet. {isOwner ? 'Run scoring above.' : 'Ask the cohort owner to run scoring.'}
                </div>
              ) : (
                <div className="rounded-xl border border-border/60 bg-card overflow-x-auto">
                  <table className="w-full text-[12px]">
                    <thead className="bg-muted/30 text-[10px] uppercase tracking-wider text-muted-foreground">
                      <tr>
                        <th className="text-left px-3 py-2 font-semibold">NCT</th>
                        <th className="text-left px-3 py-2 font-semibold">Site</th>
                        <th className="text-left px-3 py-2 font-semibold">County</th>
                        <th className="text-right px-3 py-2 font-semibold">LEP %</th>
                        <th className="text-right px-3 py-2 font-semibold">Poverty %</th>
                        <th className="text-right px-3 py-2 font-semibold">Language</th>
                        <th className="text-right px-3 py-2 font-semibold">Economic</th>
                        <th className="text-right px-3 py-2 font-semibold">Score</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rows.scored.slice(0, 100).map(({ loc, b }) => {
                        const comp = computeBarrierScore(
                          { pct: b.lep_pct, nationalPct: national?.lep_pct ?? null },
                          { pct: b.poverty_pct, nationalPct: national?.poverty_pct ?? null },
                        );
                        return (
                          <tr key={b.id} className="border-t border-border/40">
                            <td className="px-3 py-2 font-mono text-[10px] text-primary">{b.nct_id}</td>
                            <td className="px-3 py-2 max-w-[220px] truncate" title={[loc.raw_facility, loc.raw_city, loc.raw_state].filter(Boolean).join(' · ')}>
                              {[loc.raw_city, loc.raw_state].filter(Boolean).join(', ') || '—'}
                            </td>
                            <td className="px-3 py-2">{loc.county_name ?? loc.county_fips}</td>
                            <td className="px-3 py-2 text-right tabular-nums">{b.lep_pct != null ? `${b.lep_pct}%` : '—'}</td>
                            <td className="px-3 py-2 text-right tabular-nums">{b.poverty_pct != null ? `${b.poverty_pct}%` : '—'}</td>
                            <td className="px-3 py-2 text-right"><BarrierScoreBadge component={comp.languageAccess} /></td>
                            <td className="px-3 py-2 text-right"><BarrierScoreBadge component={comp.socioeconomicStrain} /></td>
                            <td className="px-3 py-2 text-right"><BarrierScoreBadge score={b.barrier_score} /></td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                  {rows.scored.length > 100 && (
                    <p className="text-[10px] text-muted-foreground p-2 border-t border-border/40">
                      Showing first 100 of {rows.scored.length}.
                    </p>
                  )}
                </div>
              )}
            </div>
          </section>

          {/* Unscored sites */}
          {rows.unscored.length > 0 && (
            <section className="px-4 md:px-6 lg:px-16 pb-10">
              <div className="max-w-5xl mx-auto">
                <h2 className="font-display text-lg font-medium text-foreground mb-3">
                  Not scored ({rows.unscored.length})
                </h2>
                <p className="text-[11px] text-muted-foreground mb-3">
                  These sites have no resolved US county, so no barrier score is possible.
                  Values are never estimated.
                </p>
                <div className="rounded-xl border border-border/60 bg-card overflow-hidden max-h-72 overflow-y-auto">
                  <table className="w-full text-[12px]">
                    <tbody>
                      {rows.unscored.slice(0, 100).map((l) => (
                        <tr key={l.id} className="border-t border-border/40">
                          <td className="px-3 py-2 font-mono text-[10px] text-primary">{l.nct_id}</td>
                          <td className="px-3 py-2">{[l.raw_city, l.raw_state].filter(Boolean).join(', ') || '—'}</td>
                          <td className="px-3 py-2 text-muted-foreground">{l.raw_country}</td>
                          <td className="px-3 py-2 text-right text-muted-foreground italic">
                            {isUS(l) ? 'Location unresolved' : 'Non-US site'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </section>
          )}

          {/* Method footer */}
          <section className="px-4 md:px-6 lg:px-16 pb-12">
            <div className="max-w-5xl mx-auto rounded-xl border border-border/60 bg-muted/20 p-5 text-[11px] text-muted-foreground space-y-1.5">
              <p className="flex items-center gap-1.5 font-semibold text-foreground text-[12px]">
                <Languages className="h-3.5 w-3.5 text-primary" /> Language access
                <span className="font-normal text-muted-foreground">·</span>
                <PiggyBank className="h-3.5 w-3.5 text-primary" /> Socioeconomic strain
              </p>
              <p>
                Source: US Census Bureau, American Community Survey 5-year estimates (2022),
                Tables C16002 and B17001, retrieved live via api.census.gov and cached for 30 days.
                {national?.source_url && (
                  <> Baseline query: <a className="text-primary underline" href={national.source_url} target="_blank" rel="noopener noreferrer">Census API</a>.</>
                )}
              </p>
              <p>
                Measures are county-level observed rates (labeled Inferred when applied to a site's
                catchment). They describe access context around a site, not any individual's
                eligibility. Drive-time, broadband, transit, and disability barriers are Phase 2.
              </p>
            </div>
          </section>
        </>
      )}
    </div>
  );
};

export default CohortBarriers;
