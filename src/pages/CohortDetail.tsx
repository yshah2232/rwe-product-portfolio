// /cohorts/:id — cohort detail with sponsor mix, indication summary, geography
// summary, refresh button, and inspect-trial via StudyDetailSheet.

import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeft, Loader2, RefreshCw, ExternalLink, Trash2, Calendar, MapPin, Building2,
  Stethoscope, FlaskConical, Users,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { supabase } from '@/integrations/supabase/client';
import { getSessionId } from '@/lib/searchSession';
import { useSeo } from '@/hooks/useSeo';
import { toast } from 'sonner';
import StudyDetailSheet from '@/components/StudyDetailSheet';
import TrustDrawer from '@/components/TrustDrawer';
import { cleanSponsor } from '@/lib/canonicalize';

interface Cohort {
  id: string;
  session_id: string;
  name: string;
  notes: string | null;
  query_text: string | null;
  filter_phase: string | null;
  filter_status: string | null;
  filter_country_us: boolean | null;
  trial_count: number;
  refreshed_at: string | null;
  created_at: string;
}

interface CohortTrial {
  id: string;
  nct_id: string;
  brief_title: string | null;
  overall_status: string | null;
  phase: string[] | null;
  sponsor_raw: string | null;
  sponsor_clean: string | null;
  conditions_raw: string[] | null;
  conditions_clean: string[] | null;
  interventions_clean: string[] | null;
  enrollment: number | null;
  countries: string[] | null;
  semantic_score: number | null;
}

const REFRESH_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ctg-cohort-refresh`;

const ctgUrl = (nct: string) => `https://clinicaltrials.gov/study/${nct}`;

const CohortDetail = () => {
  const { id } = useParams<{ id: string }>();
  const [cohort, setCohort] = useState<Cohort | null>(null);
  const [trials, setTrials] = useState<CohortTrial[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [openNct, setOpenNct] = useState<string | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  useSeo({
    title: cohort ? `${cohort.name} — Cohort` : 'Cohort — Clinical Trial Diversity Studio',
    description: cohort
      ? `Cohort detail for ${cohort.name}: trials, sponsors, sites, and diversity overlay built on live ClinicalTrials.gov and U.S. Census data.`
      : 'Cohort detail view with trials, sponsors, sites, and diversity overlay.',
    noindex: true,
  });

  const isOwner = !!cohort && cohort.session_id === getSessionId();

  useEffect(() => {
    if (!id) return;
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const load = async () => {
    if (!id) return;
    setLoading(true);
    const [{ data: c, error: cErr }, { data: t, error: tErr }] = await Promise.all([
      supabase.from('saved_cohorts').select('*').eq('id', id).maybeSingle(),
      supabase
        .from('cohort_trials')
        .select('*')
        .eq('cohort_id', id)
        .order('semantic_score', { ascending: false }),
    ]);
    if (cErr || !c) toast.error('Cohort not found');
    setCohort((c as Cohort) ?? null);
    if (tErr) toast.error('Failed to load trials');
    setTrials((t as CohortTrial[]) ?? []);
    setLoading(false);
  };

  const handleRefresh = async () => {
    if (!cohort || !isOwner) return;
    setRefreshing(true);
    try {
      const res = await fetch(REFRESH_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ cohortId: cohort.id, sessionId: getSessionId() }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error ?? 'Refresh failed');
      toast.success(`Refreshed ${body.refreshed} of ${body.total} trial${body.total === 1 ? '' : 's'}`);
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Refresh failed');
    } finally {
      setRefreshing(false);
    }
  };

  const handleDelete = async () => {
    if (!cohort || !isOwner) return;
    if (!confirm(`Delete cohort "${cohort.name}"? This cannot be undone.`)) return;
    try {
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ctg-cohort-delete`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({ cohortId: cohort.id, sessionId: getSessionId() }),
        },
      );
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error ?? 'Failed to delete');
      toast.success('Deleted');
      window.location.href = '/cohorts';
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to delete');
    }
  };

  // Summaries
  const sponsorMix = useMemo(() => {
    const m = new Map<string, number>();
    trials.forEach((t) => {
      const s = (t.sponsor_clean || t.sponsor_raw || '—').trim();
      m.set(s, (m.get(s) ?? 0) + 1);
    });
    return Array.from(m.entries()).sort((a, b) => b[1] - a[1]).slice(0, 8);
  }, [trials]);

  const indicationMix = useMemo(() => {
    const m = new Map<string, number>();
    trials.forEach((t) => {
      (t.conditions_clean ?? []).forEach((c) => {
        if (c) m.set(c, (m.get(c) ?? 0) + 1);
      });
    });
    return Array.from(m.entries()).sort((a, b) => b[1] - a[1]).slice(0, 8);
  }, [trials]);

  const geoMix = useMemo(() => {
    const m = new Map<string, number>();
    trials.forEach((t) => {
      (t.countries ?? []).forEach((c) => {
        if (c) m.set(c, (m.get(c) ?? 0) + 1);
      });
    });
    return Array.from(m.entries()).sort((a, b) => b[1] - a[1]).slice(0, 8);
  }, [trials]);

  const interventionMix = useMemo(() => {
    const m = new Map<string, number>();
    trials.forEach((t) => {
      (t.interventions_clean ?? []).forEach((c) => {
        if (c) m.set(c, (m.get(c) ?? 0) + 1);
      });
    });
    return Array.from(m.entries()).sort((a, b) => b[1] - a[1]).slice(0, 8);
  }, [trials]);

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
        <p className="text-sm text-muted-foreground mb-6">It may have been deleted.</p>
        <Button asChild>
          <Link to="/cohorts">Back to cohorts</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="bg-background min-h-screen">
      {/* Header */}
      <section className="px-4 md:px-6 lg:px-16 pt-12 pb-8 border-b border-border/50">
        <div className="max-w-5xl mx-auto">
          <Link
            to="/cohorts"
            className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors mb-5"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> All cohorts
          </Link>
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="min-w-0 flex-1">
              <h1 className="font-display text-3xl md:text-4xl font-medium leading-tight text-foreground">
                {cohort.name}
              </h1>
              {cohort.notes && (
                <p className="mt-3 text-[14px] text-muted-foreground max-w-3xl leading-relaxed">{cohort.notes}</p>
              )}
              <div className="flex flex-wrap items-center gap-3 mt-4 text-[11px] text-muted-foreground">
                <Badge variant="outline">{cohort.trial_count} trial{cohort.trial_count === 1 ? '' : 's'}</Badge>
                {cohort.query_text && (
                  <span className="italic">Query: "{cohort.query_text}"</span>
                )}
                {cohort.filter_phase && <span>· {cohort.filter_phase}</span>}
                {cohort.filter_status && <span>· {cohort.filter_status.replace(/_/g, ' ')}</span>}
                {cohort.filter_country_us && <span>· US sites only</span>}
              </div>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-[11px] text-muted-foreground/70">
                <span className="flex items-center gap-1.5">
                  <Calendar className="h-3 w-3" /> Created {new Date(cohort.created_at).toLocaleString()}
                </span>
                {cohort.refreshed_at && (
                  <span className="flex items-center gap-1.5">
                    <RefreshCw className="h-3 w-3" /> Refreshed {new Date(cohort.refreshed_at).toLocaleString()}
                  </span>
                )}
              </div>
            </div>
            {isOwner && (
              <div className="flex items-center gap-2">
                <Button asChild variant="default" className="gap-2">
                  <Link to={`/cohorts/${cohort.id}/diversity`}>
                    <Users className="h-4 w-4" /> Diversity & Access
                  </Link>
                </Button>
                <Button variant="outline" onClick={handleRefresh} disabled={refreshing} className="gap-2">
                  {refreshing ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                  Refresh from CTG.gov
                </Button>
                <Button variant="ghost" size="icon" onClick={handleDelete} aria-label="Delete cohort">
                  <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                </Button>
              </div>
            )}
            {!isOwner && (
              <Button asChild variant="outline" className="gap-2">
                <Link to={`/cohorts/${cohort.id}/diversity`}>
                  <Users className="h-4 w-4" /> View diversity overlay
                </Link>
              </Button>
            )}
          </div>
          {!isOwner && (
            <p className="mt-4 text-[11px] text-muted-foreground bg-accent/30 border border-border/40 rounded-md p-2.5 inline-block">
              You're viewing a cohort created in another session. Refresh and delete are owner-only.
            </p>
          )}
        </div>
      </section>

      {/* Summary cards */}
      <section className="px-4 md:px-6 lg:px-16 py-8 border-b border-border/50 bg-muted/20">
        <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <SummaryCard
            icon={<Building2 className="h-4 w-4 text-primary" />}
            title="Sponsor mix"
            entries={sponsorMix}
            sourceField="protocolSection.sponsorCollaboratorsModule.leadSponsor.name (cleaned)"
          />
          <SummaryCard
            icon={<Stethoscope className="h-4 w-4 text-primary" />}
            title="Indications"
            entries={indicationMix}
            sourceField="protocolSection.conditionsModule.conditions[] (cleaned)"
          />
          <SummaryCard
            icon={<FlaskConical className="h-4 w-4 text-primary" />}
            title="Interventions"
            entries={interventionMix}
            sourceField="protocolSection.armsInterventionsModule.interventions[].name (cleaned)"
          />
          <SummaryCard
            icon={<MapPin className="h-4 w-4 text-primary" />}
            title="Geography"
            entries={geoMix}
            sourceField="protocolSection.contactsLocationsModule.locations[].country"
          />
        </div>
      </section>

      {/* Trials list */}
      <section className="px-4 md:px-6 lg:px-16 py-10">
        <div className="max-w-5xl mx-auto">
          <h2 className="font-display text-2xl font-medium text-foreground mb-4">
            Included trials ({trials.length})
          </h2>
          {trials.length === 0 ? (
            <p className="text-sm text-muted-foreground">No trials in this cohort.</p>
          ) : (
            <ul className="space-y-3">
              {trials.map((t, idx) => {
                const sponsorHit = cleanSponsor(t.sponsor_raw ?? '');
                return (
                  <motion.li
                    key={t.id}
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.02 }}
                    className="rounded-xl border border-border/60 bg-card p-5"
                  >
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <button
                          onClick={() => {
                            setOpenNct(t.nct_id);
                            setSheetOpen(true);
                          }}
                          className="text-xs font-mono font-semibold text-primary hover:underline"
                        >
                          {t.nct_id}
                        </button>
                        {t.overall_status && (
                          <Badge variant="outline" className="text-[10px] py-0 h-5">
                            {t.overall_status.replace(/_/g, ' ')}
                          </Badge>
                        )}
                        {(t.phase ?? []).map((p) => (
                          <Badge key={p} variant="secondary" className="text-[10px] py-0 h-5">
                            {p.replace('PHASE', 'Phase ')}
                          </Badge>
                        ))}
                      </div>
                      <a
                        href={ctgUrl(t.nct_id)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[11px] text-muted-foreground hover:text-primary inline-flex items-center gap-1"
                      >
                        CTG.gov <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>
                    <button
                      onClick={() => {
                        setOpenNct(t.nct_id);
                        setSheetOpen(true);
                      }}
                      className="font-display text-[16px] font-medium text-foreground leading-snug text-left hover:text-primary transition-colors"
                    >
                      {t.brief_title ?? t.nct_id}
                    </button>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-[12px] mt-3">
                      <div>
                        <p className="text-[10px] uppercase tracking-wider text-muted-foreground/70 mb-0.5">Sponsor</p>
                        <p className="text-foreground truncate inline-flex items-center" title={t.sponsor_raw ?? ''}>
                          {t.sponsor_clean ?? t.sponsor_raw ?? '—'}
                          {t.sponsor_raw && (
                            <TrustDrawer
                              field="Sponsor"
                              fieldType="sponsor"
                              hit={sponsorHit}
                              sourceField="protocolSection.sponsorCollaboratorsModule.leadSponsor.name"
                              refreshedAt={cohort.refreshed_at ?? undefined}
                            />
                          )}
                        </p>
                      </div>
                      <div>
                        <p className="text-[10px] uppercase tracking-wider text-muted-foreground/70 mb-0.5">Indications</p>
                        <p className="text-foreground truncate" title={(t.conditions_clean ?? []).join('; ')}>
                          {(t.conditions_clean ?? []).slice(0, 2).join(', ') || '—'}
                        </p>
                      </div>
                      <div>
                        <p className="text-[10px] uppercase tracking-wider text-muted-foreground/70 mb-0.5">Enrollment</p>
                        <p className="text-foreground">{t.enrollment?.toLocaleString() ?? '—'}</p>
                      </div>
                      <div>
                        <p className="text-[10px] uppercase tracking-wider text-muted-foreground/70 mb-0.5">Countries</p>
                        <p className="text-foreground truncate" title={(t.countries ?? []).join(', ')}>
                          {(t.countries ?? []).slice(0, 2).join(', ') || '—'}
                        </p>
                      </div>
                    </div>
                  </motion.li>
                );
              })}
            </ul>
          )}
        </div>
      </section>

      <StudyDetailSheet nctId={openNct} open={sheetOpen} onOpenChange={setSheetOpen} />
    </div>
  );
};

interface SummaryCardProps {
  icon: React.ReactNode;
  title: string;
  entries: [string, number][];
  sourceField: string;
}

const SummaryCard = ({ icon, title, entries, sourceField }: SummaryCardProps) => (
  <div className="rounded-xl border border-border/60 bg-card p-4">
    <div className="flex items-center justify-between mb-3">
      <div className="flex items-center gap-2">
        {icon}
        <p className="text-[11px] font-semibold tracking-wider uppercase text-muted-foreground">{title}</p>
      </div>
    </div>
    {entries.length === 0 ? (
      <p className="text-[12px] text-muted-foreground italic">No data</p>
    ) : (
      <ul className="space-y-1.5">
        {entries.map(([k, n]) => (
          <li key={k} className="flex items-center justify-between gap-2 text-[12px]">
            <span className="text-foreground truncate" title={k}>{k}</span>
            <span className="text-muted-foreground tabular-nums shrink-0">{n}</span>
          </li>
        ))}
      </ul>
    )}
    <p className="text-[10px] text-muted-foreground/60 mt-3 pt-2 border-t border-border/40 font-mono break-all">
      Source: {sourceField}
    </p>
  </div>
);

export default CohortDetail;
