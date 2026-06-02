// ── Clinical Trials Dashboard ──
// Live data from ClinicalTrials.gov API v2 via Supabase edge function proxy.
// Real NCT IDs, real investigators, real sites — never fabricated.

import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { ExternalLink, FlaskConical, MapPin, Users, Building2, Calendar, RefreshCw, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { usePageTitle } from '@/hooks/usePageTitle';

type AreaKey = 'glp1' | 'nsclc' | 'alzheimer';

const AREAS: { key: AreaKey; label: string; condition: string; blurb: string }[] = [
  {
    key: 'glp1',
    label: 'GLP-1 (Obesity & T2D)',
    condition: 'GLP-1 OR semaglutide OR tirzepatide OR liraglutide',
    blurb: 'Trials studying GLP-1 receptor agonists across obesity, type 2 diabetes, and emerging cardiometabolic indications.',
  },
  {
    key: 'nsclc',
    label: 'NSCLC',
    condition: 'non-small cell lung cancer',
    blurb: 'Non-small cell lung cancer trials across targeted therapy, immunotherapy, and combination regimens.',
  },
  {
    key: 'alzheimer',
    label: "Alzheimer's Disease",
    condition: "Alzheimer's Disease",
    blurb: "Disease-modifying and symptomatic Alzheimer's trials including anti-amyloid and tau-directed therapies.",
  },
];

interface CtgStudy {
  protocolSection?: {
    identificationModule?: { nctId?: string; briefTitle?: string; officialTitle?: string };
    statusModule?: { overallStatus?: string; startDateStruct?: { date?: string }; primaryCompletionDateStruct?: { date?: string } };
    sponsorCollaboratorsModule?: { leadSponsor?: { name?: string; class?: string } };
    designModule?: { phases?: string[]; studyType?: string; enrollmentInfo?: { count?: number } };
    conditionsModule?: { conditions?: string[] };
    armsInterventionsModule?: { interventions?: { type?: string; name?: string }[] };
    contactsLocationsModule?: {
      overallOfficials?: { name?: string; affiliation?: string; role?: string }[];
      locations?: { facility?: string; city?: string; state?: string; country?: string; status?: string }[];
    };
  };
}

interface CtgResponse {
  studies?: CtgStudy[];
  nextPageToken?: string;
  totalCount?: number;
}

const STATUS_COLORS: Record<string, string> = {
  RECRUITING: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30',
  ACTIVE_NOT_RECRUITING: 'bg-blue-500/10 text-blue-600 border-blue-500/30',
  COMPLETED: 'bg-muted text-muted-foreground border-border/40',
  TERMINATED: 'bg-red-500/10 text-red-600 border-red-500/30',
  WITHDRAWN: 'bg-red-500/10 text-red-600 border-red-500/30',
  NOT_YET_RECRUITING: 'bg-amber-500/10 text-amber-600 border-amber-500/30',
  ENROLLING_BY_INVITATION: 'bg-purple-500/10 text-purple-600 border-purple-500/30',
};

function formatStatus(s?: string) {
  return s ? s.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, c => c.toUpperCase()) : '—';
}

function formatPhase(phases?: string[]) {
  if (!phases || phases.length === 0) return 'N/A';
  return phases.map(p => p.replace('PHASE', 'Phase ')).join(' / ');
}

const ClinicalTrials = () => {
  usePageTitle('Clinical Trials Dashboard');
  const [activeArea, setActiveArea] = useState<AreaKey>('glp1');
  const [data, setData] = useState<Record<AreaKey, CtgResponse | null>>({ glp1: null, nsclc: null, alzheimer: null });
  const [loading, setLoading] = useState<Record<AreaKey, boolean>>({ glp1: false, nsclc: false, alzheimer: false });
  const [error, setError] = useState<Record<AreaKey, string | null>>({ glp1: null, nsclc: null, alzheimer: null });

  async function fetchArea(area: AreaKey) {
    const cfg = AREAS.find(a => a.key === area)!;
    setLoading(s => ({ ...s, [area]: true }));
    setError(s => ({ ...s, [area]: null }));
    try {
      const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
      const url = `https://${projectId}.supabase.co/functions/v1/ctg-trials?condition=${encodeURIComponent(cfg.condition)}&pageSize=50&countryUS=true`;
      const res = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
        },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      setData(s => ({ ...s, [area]: json }));
    } catch (e) {
      setError(s => ({ ...s, [area]: e instanceof Error ? e.message : 'Failed to load' }));
    } finally {
      setLoading(s => ({ ...s, [area]: false }));
    }
  }

  useEffect(() => {
    if (!data[activeArea] && !loading[activeArea]) {
      fetchArea(activeArea);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeArea]);

  const summary = useMemo(() => {
    const r = data[activeArea];
    if (!r?.studies) return null;
    const total = r.totalCount ?? r.studies.length;
    const byStatus = new Map<string, number>();
    const byPhase = new Map<string, number>();
    const sponsors = new Map<string, number>();
    const sites = new Set<string>();
    let enrollment = 0;
    for (const s of r.studies) {
      const ps = s.protocolSection;
      const status = ps?.statusModule?.overallStatus ?? 'UNKNOWN';
      byStatus.set(status, (byStatus.get(status) ?? 0) + 1);
      const phase = formatPhase(ps?.designModule?.phases);
      byPhase.set(phase, (byPhase.get(phase) ?? 0) + 1);
      const spon = ps?.sponsorCollaboratorsModule?.leadSponsor?.name;
      if (spon) sponsors.set(spon, (sponsors.get(spon) ?? 0) + 1);
      enrollment += ps?.designModule?.enrollmentInfo?.count ?? 0;
      for (const loc of ps?.contactsLocationsModule?.locations ?? []) {
        if (loc.facility) sites.add(`${loc.facility}|${loc.city}|${loc.state}`);
      }
    }
    return {
      total,
      shown: r.studies.length,
      byStatus: [...byStatus.entries()].sort((a, b) => b[1] - a[1]),
      byPhase: [...byPhase.entries()].sort((a, b) => b[1] - a[1]),
      topSponsors: [...sponsors.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5),
      uniqueSites: sites.size,
      enrollment,
    };
  }, [data, activeArea]);

  const activeCfg = AREAS.find(a => a.key === activeArea)!;

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-6 py-12 md:py-16 space-y-10">
      <motion.header
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="space-y-4"
      >
        <div className="flex items-center gap-2 text-xs font-bold tracking-[0.2em] uppercase text-primary">
          <FlaskConical className="h-3.5 w-3.5" />
          <span>Live data · ClinicalTrials.gov v2 API</span>
        </div>
        <h1 className="text-3xl md:text-5xl font-extrabold text-foreground tracking-tight">
          Clinical Trials Dashboard
        </h1>
        <p className="text-sm md:text-base text-muted-foreground max-w-3xl leading-relaxed">
          Real interventional and observational trial data pulled directly from the U.S. National Library of Medicine's
          ClinicalTrials.gov registry. Every NCT ID, sponsor, principal investigator, and site below is genuine and
          links back to the official record. Scoped to three therapeutic areas; the underlying API exposes the full
          ~500K-study registry, available to unlock additional modules over time.
        </p>
      </motion.header>

      <Tabs value={activeArea} onValueChange={(v) => setActiveArea(v as AreaKey)} className="space-y-6">
        <TabsList className="grid grid-cols-3 w-full max-w-2xl">
          {AREAS.map(a => (
            <TabsTrigger key={a.key} value={a.key} className="text-xs md:text-sm">
              {a.label}
            </TabsTrigger>
          ))}
        </TabsList>

        {AREAS.map(area => (
          <TabsContent key={area.key} value={area.key} className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-3">
              <p className="text-sm text-muted-foreground max-w-2xl leading-relaxed">{area.blurb}</p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => fetchArea(area.key)}
                disabled={loading[area.key]}
                className="gap-2"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${loading[area.key] ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>

            {error[area.key] && (
              <Card className="p-4 border-red-500/30 bg-red-500/5">
                <div className="flex items-start gap-3 text-sm">
                  <AlertCircle className="h-4 w-4 text-red-500 mt-0.5 shrink-0" />
                  <div>
                    <p className="font-semibold text-red-600">Failed to load trials</p>
                    <p className="text-muted-foreground text-xs mt-1">{error[area.key]}</p>
                  </div>
                </div>
              </Card>
            )}

            {loading[area.key] && !data[area.key] && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Card key={i} className="p-5 animate-pulse h-24 bg-muted/40" />
                ))}
              </div>
            )}

            {summary && area.key === activeArea && (
              <>
                {/* KPI cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <KPI icon={FlaskConical} label="Trials in registry" value={summary.total.toLocaleString()} sub={`${summary.shown} loaded`} />
                  <KPI icon={Users} label="Total enrollment" value={summary.enrollment.toLocaleString()} sub="across loaded trials" />
                  <KPI icon={MapPin} label="Unique US sites" value={summary.uniqueSites.toLocaleString()} sub="distinct facilities" />
                  <KPI icon={Building2} label="Lead sponsors" value={summary.topSponsors.length.toLocaleString()} sub="top 5 shown below" />
                </div>

                {/* Status + Phase breakdown */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card className="p-5 md:col-span-1">
                    <h3 className="text-xs font-bold tracking-[0.15em] uppercase text-muted-foreground mb-3">By Status</h3>
                    <div className="space-y-2">
                      {summary.byStatus.map(([s, n]) => (
                        <div key={s} className="flex items-center justify-between text-sm">
                          <Badge variant="outline" className={STATUS_COLORS[s] ?? ''}>{formatStatus(s)}</Badge>
                          <span className="font-semibold tabular-nums">{n}</span>
                        </div>
                      ))}
                    </div>
                  </Card>
                  <Card className="p-5 md:col-span-1">
                    <h3 className="text-xs font-bold tracking-[0.15em] uppercase text-muted-foreground mb-3">By Phase</h3>
                    <div className="space-y-2">
                      {summary.byPhase.map(([p, n]) => (
                        <div key={p} className="flex items-center justify-between text-sm">
                          <span className="text-foreground">{p}</span>
                          <span className="font-semibold tabular-nums">{n}</span>
                        </div>
                      ))}
                    </div>
                  </Card>
                  <Card className="p-5 md:col-span-1">
                    <h3 className="text-xs font-bold tracking-[0.15em] uppercase text-muted-foreground mb-3">Top Sponsors</h3>
                    <div className="space-y-2">
                      {summary.topSponsors.map(([s, n]) => (
                        <div key={s} className="flex items-center justify-between text-sm gap-2">
                          <span className="text-foreground truncate">{s}</span>
                          <span className="font-semibold tabular-nums shrink-0">{n}</span>
                        </div>
                      ))}
                    </div>
                  </Card>
                </div>

                {/* Trial list */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg font-bold text-foreground">Live Trials ({summary.shown})</h2>
                    <span className="text-xs text-muted-foreground">Sourced from ClinicalTrials.gov · refreshed live</span>
                  </div>
                  <div className="space-y-3">
                    {data[area.key]?.studies?.map((study, i) => (
                      <TrialCard key={study.protocolSection?.identificationModule?.nctId ?? i} study={study} />
                    ))}
                  </div>
                </div>
              </>
            )}
          </TabsContent>
        ))}
      </Tabs>

      <footer className="pt-8 border-t border-border/40 text-xs text-muted-foreground space-y-1">
        <p>
          Data source: <a href="https://clinicaltrials.gov/data-api/api" target="_blank" rel="noreferrer" className="underline hover:text-foreground">ClinicalTrials.gov REST API v2</a> — a service of the U.S. National Library of Medicine.
        </p>
        <p>
          All NCT identifiers, sponsors, principal investigators, sites, and locations shown are real and verifiable on ClinicalTrials.gov. No synthetic substitutes are used on this page.
        </p>
      </footer>
    </div>
  );
};

function KPI({ icon: Icon, label, value, sub }: { icon: typeof FlaskConical; label: string; value: string; sub?: string }) {
  return (
    <Card className="p-4 md:p-5 space-y-2">
      <div className="flex items-center gap-2 text-muted-foreground">
        <Icon className="h-3.5 w-3.5" />
        <span className="text-[10px] md:text-xs font-bold tracking-[0.15em] uppercase">{label}</span>
      </div>
      <div className="text-2xl md:text-3xl font-extrabold text-foreground tabular-nums">{value}</div>
      {sub && <div className="text-[11px] text-muted-foreground">{sub}</div>}
    </Card>
  );
}

function TrialCard({ study }: { study: CtgStudy }) {
  const ps = study.protocolSection;
  const nct = ps?.identificationModule?.nctId;
  const title = ps?.identificationModule?.briefTitle ?? ps?.identificationModule?.officialTitle ?? 'Untitled';
  const status = ps?.statusModule?.overallStatus;
  const phase = formatPhase(ps?.designModule?.phases);
  const sponsor = ps?.sponsorCollaboratorsModule?.leadSponsor?.name;
  const enrollment = ps?.designModule?.enrollmentInfo?.count;
  const start = ps?.statusModule?.startDateStruct?.date;
  const officials = ps?.contactsLocationsModule?.overallOfficials ?? [];
  const locations = ps?.contactsLocationsModule?.locations ?? [];
  const interventions = ps?.armsInterventionsModule?.interventions ?? [];

  return (
    <Card className="p-5 hover:border-primary/40 transition-colors">
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3 mb-3">
        <div className="space-y-1.5 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            {nct && (
              <a
                href={`https://clinicaltrials.gov/study/${nct}`}
                target="_blank"
                rel="noreferrer"
                className="text-xs font-mono font-bold text-primary hover:underline inline-flex items-center gap-1"
              >
                {nct} <ExternalLink className="h-3 w-3" />
              </a>
            )}
            {status && (
              <Badge variant="outline" className={STATUS_COLORS[status] ?? ''}>{formatStatus(status)}</Badge>
            )}
            <Badge variant="secondary" className="text-[10px]">{phase}</Badge>
          </div>
          <h3 className="text-sm md:text-base font-bold text-foreground leading-snug">{title}</h3>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
        <div className="space-y-1">
          <div className="flex items-center gap-1.5 text-muted-foreground font-semibold uppercase tracking-wider text-[10px]">
            <Building2 className="h-3 w-3" /> Sponsor
          </div>
          <p className="text-foreground">{sponsor ?? '—'}</p>
          {interventions.length > 0 && (
            <p className="text-muted-foreground text-[11px] mt-1">
              <span className="font-semibold">Intervention:</span>{' '}
              {interventions.slice(0, 3).map(i => i.name).filter(Boolean).join(', ')}
            </p>
          )}
        </div>
        <div className="space-y-1">
          <div className="flex items-center gap-1.5 text-muted-foreground font-semibold uppercase tracking-wider text-[10px]">
            <Users className="h-3 w-3" /> Investigators
          </div>
          {officials.length > 0 ? (
            <ul className="space-y-0.5">
              {officials.slice(0, 3).map((o, i) => (
                <li key={i} className="text-foreground">
                  {o.name}
                  {o.affiliation && <span className="text-muted-foreground"> · {o.affiliation}</span>}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-muted-foreground">Not listed</p>
          )}
          {enrollment != null && (
            <p className="text-muted-foreground text-[11px] mt-1">
              Enrollment: <span className="text-foreground font-semibold">{enrollment.toLocaleString()}</span>
            </p>
          )}
        </div>
        <div className="space-y-1">
          <div className="flex items-center gap-1.5 text-muted-foreground font-semibold uppercase tracking-wider text-[10px]">
            <MapPin className="h-3 w-3" /> Sites ({locations.length})
          </div>
          {locations.slice(0, 3).map((l, i) => (
            <p key={i} className="text-foreground text-[11px]">
              {l.facility}
              {l.city && <span className="text-muted-foreground"> · {l.city}{l.state ? `, ${l.state}` : ''}</span>}
            </p>
          ))}
          {locations.length > 3 && (
            <p className="text-muted-foreground text-[11px]">+{locations.length - 3} more</p>
          )}
          {start && (
            <p className="text-muted-foreground text-[11px] mt-1 inline-flex items-center gap-1">
              <Calendar className="h-3 w-3" /> Started {start}
            </p>
          )}
        </div>
      </div>
    </Card>
  );
}

export default ClinicalTrials;
