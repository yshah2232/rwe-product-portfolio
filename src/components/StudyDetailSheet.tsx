// Study Detail Sheet — pulls full trial detail from ctg-trial-detail edge fn,
// shows eligibility, sponsor, locations, interventions, with TrustDrawer on
// canonicalized fields. Deep links to the authoritative CTG.gov page.
//
// When PlainMode is ON, also fetches the AI-rewritten plain-language version
// from ctg-plain-language and shows it at the top with a switch to view raw.

import { useEffect, useState } from 'react';
import { ExternalLink, Loader2, MapPin, Users, Calendar, FlaskConical, AlertCircle, Sparkles } from 'lucide-react';
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription,
} from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import TrustDrawer from '@/components/TrustDrawer';
import { cleanSponsor, cleanIndication, cleanAsset } from '@/lib/canonicalize';
import { usePlainMode } from '@/contexts/PlainModeContext';
import { usePlainTrial } from '@/lib/usePlainTrial';

interface TrialDetail {
  nctId: string;
  briefTitle: string;
  officialTitle: string;
  briefSummary: string;
  detailedDescription: string;
  status: string;
  whyStopped: string | null;
  phase: string[];
  studyType: string;
  conditions: string[];
  keywords: string[];
  interventions: { type: string; name: string; description: string }[];
  eligibility: {
    criteria: string;
    sex: string;
    minAge: string;
    maxAge: string;
    healthyVolunteers: boolean;
  };
  enrollment: number | null;
  enrollmentType: string;
  startDate: string;
  completionDate: string;
  primaryCompletionDate: string;
  leadSponsor: { name: string; class: string };
  collaborators: { name: string; class: string }[];
  locations: { facility: string; city: string; state: string; country: string; zip: string; status: string }[];
  countries: string[];
  ctgUrl: string;
}

const DETAIL_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ctg-trial-detail`;

interface Props {
  nctId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const StudyDetailSheet = ({ nctId, open, onOpenChange }: Props) => {
  const [data, setData] = useState<TrialDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { plainMode } = usePlainMode();
  const [showRaw, setShowRaw] = useState(false);
  const { data: plain, loading: plainLoading } = usePlainTrial(nctId, plainMode && open);
  const usePlain = plainMode && !showRaw && !!plain;

  useEffect(() => {
    if (!open || !nctId) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    setData(null);
    fetch(`${DETAIL_URL}?nctId=${encodeURIComponent(nctId)}`, {
      headers: { Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}` },
    })
      .then((r) => r.json().then((b) => ({ ok: r.ok, body: b })))
      .then(({ ok, body }) => {
        if (cancelled) return;
        if (!ok) setError(body.error ?? 'Failed to load trial');
        else setData(body);
      })
      .catch((e) => !cancelled && setError(e instanceof Error ? e.message : 'Network error'))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [nctId, open]);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-2xl overflow-y-auto">
        <SheetHeader className="text-left">
          <SheetTitle className="font-display text-xl pr-8">
            {usePlain && plain
              ? plain.plain_title
              : data?.briefTitle ?? (loading ? 'Loading…' : nctId ?? 'Trial')}
          </SheetTitle>
          <SheetDescription>
            <span className="font-mono text-xs text-primary">{nctId}</span>
            {!usePlain && data?.officialTitle && data.officialTitle !== data.briefTitle && (
              <span className="block mt-1 text-[12px]">{data.officialTitle}</span>
            )}
          </SheetDescription>

          {/* Plain mode banner + raw toggle */}
          {plainMode && (
            <div className="mt-3 rounded-sm border p-3 flex items-start gap-2.5"
                 style={{ backgroundColor: 'hsl(var(--accent))', borderColor: 'hsl(var(--primary) / 0.3)' }}>
              <Sparkles className="h-4 w-4 mt-0.5 shrink-0" style={{ color: 'hsl(var(--primary))' }} />
              <div className="flex-1 min-w-0">
                <p className="text-[12px] font-semibold" style={{ color: 'hsl(var(--primary))' }}>
                  Plain language — auto-translated by AI
                </p>
                <p className="text-[11.5px] text-foreground/75 leading-snug mt-0.5">
                  Numbers and eligibility paraphrased from the public registry. Always verify on{' '}
                  <a href={data?.ctgUrl ?? `https://clinicaltrials.gov/study/${nctId}`}
                     target="_blank" rel="noreferrer" className="underline">
                    ClinicalTrials.gov
                  </a>{' '}before acting.
                </p>
              </div>
              {plain && (
                <button
                  onClick={() => setShowRaw((v) => !v)}
                  className="text-[11px] font-semibold underline shrink-0 mt-0.5"
                  style={{ color: 'hsl(var(--primary))' }}
                >
                  {showRaw ? 'Show plain' : 'Show clinical'}
                </button>
              )}
              {plainLoading && (
                <Loader2 className="h-3.5 w-3.5 animate-spin shrink-0 mt-0.5" style={{ color: 'hsl(var(--primary))' }} />
              )}
            </div>
          )}
        </SheetHeader>

        {loading && (
          <div className="flex items-center justify-center py-20 text-muted-foreground">
            <Loader2 className="h-6 w-6 animate-spin mr-2" /> Pulling from CTG.gov…
          </div>
        )}

        {error && (
          <div className="flex items-start gap-3 p-4 rounded-lg bg-destructive/10 border border-destructive/30 my-4">
            <AlertCircle className="h-4 w-4 text-destructive mt-0.5 shrink-0" />
            <p className="text-sm text-destructive">{error}</p>
          </div>
        )}

        {data && !loading && (
          <div className="mt-6 space-y-6">
            {/* Status row */}
            <div className="flex flex-wrap items-center gap-2">
              {data.status && (
                <Badge variant="outline" className="text-[11px]">
                  {data.status.replace(/_/g, ' ')}
                </Badge>
              )}
              {data.phase.map((p) => (
                <Badge key={p} variant="secondary" className="text-[11px]">
                  {p.replace('PHASE', 'Phase ')}
                </Badge>
              ))}
              {data.studyType && (
                <Badge variant="outline" className="text-[11px]">
                  {data.studyType}
                </Badge>
              )}
            </div>

            {data.whyStopped && (
              <div className="rounded-lg p-3 bg-amber-50 border border-amber-200 text-[13px] text-amber-900">
                <span className="font-semibold">Why stopped: </span>
                {data.whyStopped}
              </div>
            )}

            {/* Brief summary — plain or clinical */}
            {usePlain && plain ? (
              <section className="space-y-4">
                <div>
                  <p className="text-[11px] font-semibold tracking-wider uppercase mb-2" style={{ color: 'hsl(var(--primary))' }}>
                    What this study is asking
                  </p>
                  <p className="text-[14px] text-foreground leading-relaxed">
                    {plain.plain_summary}
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {plain.plain_condition && (
                    <div className="rounded-sm border border-border bg-card p-3">
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">Health problem</p>
                      <p className="text-[13px] text-foreground leading-snug">{plain.plain_condition}</p>
                    </div>
                  )}
                  {plain.plain_intervention && (
                    <div className="rounded-sm border border-border bg-card p-3">
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">What's being tested</p>
                      <p className="text-[13px] text-foreground leading-snug">{plain.plain_intervention}</p>
                    </div>
                  )}
                  {plain.plain_design && (
                    <div className="rounded-sm border border-border bg-card p-3">
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">How the study works</p>
                      <p className="text-[13px] text-foreground leading-snug">{plain.plain_design}</p>
                    </div>
                  )}
                  {plain.plain_time_commitment && (
                    <div className="rounded-sm border border-border bg-card p-3">
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">Time commitment</p>
                      <p className="text-[13px] text-foreground leading-snug">{plain.plain_time_commitment}</p>
                    </div>
                  )}
                </div>

                {plain.plain_what_happens && (
                  <div>
                    <p className="text-[11px] font-semibold tracking-wider uppercase mb-2" style={{ color: 'hsl(var(--primary))' }}>
                      What participants actually do
                    </p>
                    <p className="text-[13.5px] text-foreground leading-relaxed">{plain.plain_what_happens}</p>
                  </div>
                )}

                {plain.plain_eligibility && (
                  <div>
                    <p className="text-[11px] font-semibold tracking-wider uppercase mb-2" style={{ color: 'hsl(var(--primary))' }}>
                      Who can join
                    </p>
                    <p className="text-[13.5px] text-foreground leading-relaxed">{plain.plain_eligibility}</p>
                  </div>
                )}

                {plain.key_numbers.length > 0 && (
                  <div>
                    <p className="text-[11px] font-semibold tracking-wider uppercase mb-2" style={{ color: 'hsl(var(--primary))' }}>
                      Key numbers
                    </p>
                    <ul className="space-y-1.5 text-[13px] text-foreground/85">
                      {plain.key_numbers.map((n, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <span className="text-primary mt-1">•</span>
                          <span>{n}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </section>
            ) : (
              data.briefSummary && (
                <section>
                  <p className="text-[11px] font-semibold tracking-wider uppercase text-muted-foreground/80 mb-2">
                    Brief summary
                  </p>
                  <p className="text-[13.5px] text-foreground leading-relaxed whitespace-pre-line">
                    {data.briefSummary}
                  </p>
                </section>
              )
            )}

            {/* Sponsor */}
            <section>
              <p className="text-[11px] font-semibold tracking-wider uppercase text-muted-foreground/80 mb-2">
                Sponsor & collaborators
              </p>
              <div className="space-y-1.5 text-[13px]">
                <div className="flex items-center">
                  <span className="text-foreground font-medium">
                    {cleanSponsor(data.leadSponsor.name).clean || '—'}
                  </span>
                  <TrustDrawer
                    field="Lead sponsor"
                    fieldType="sponsor"
                    hit={cleanSponsor(data.leadSponsor.name)}
                    sourceField="protocolSection.sponsorCollaboratorsModule.leadSponsor.name"
                  />
                  {data.leadSponsor.class && (
                    <Badge variant="outline" className="text-[10px] ml-2 py-0 h-5">
                      {data.leadSponsor.class}
                    </Badge>
                  )}
                </div>
                {data.collaborators.length > 0 && (
                  <p className="text-muted-foreground text-[12px]">
                    + {data.collaborators.map((c) => c.name).join(', ')}
                  </p>
                )}
              </div>
            </section>

            {/* Conditions */}
            {data.conditions.length > 0 && (
              <section>
                <p className="text-[11px] font-semibold tracking-wider uppercase text-muted-foreground/80 mb-2">
                  Conditions
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {data.conditions.map((c) => {
                    const hit = cleanIndication(c);
                    return (
                      <span key={c} className="inline-flex items-center text-[12px] px-2 py-1 rounded-md bg-accent/40 border border-border/40">
                        <span className="text-foreground">{hit.clean}</span>
                        <TrustDrawer
                          field="Condition"
                          fieldType="indication"
                          hit={hit}
                          sourceField="protocolSection.conditionsModule.conditions[]"
                        />
                      </span>
                    );
                  })}
                </div>
              </section>
            )}

            {/* Interventions */}
            {data.interventions.length > 0 && (
              <section>
                <p className="text-[11px] font-semibold tracking-wider uppercase text-muted-foreground/80 mb-2 flex items-center gap-1.5">
                  <FlaskConical className="h-3 w-3" /> Interventions
                </p>
                <ul className="space-y-2">
                  {data.interventions.map((iv, i) => {
                    const hit = cleanAsset(iv.name);
                    return (
                      <li key={i} className="text-[13px] border-l-2 border-primary/20 pl-3">
                        <div className="flex items-center">
                          <span className="font-medium text-foreground">{hit.clean}</span>
                          <TrustDrawer
                            field="Intervention"
                            fieldType="asset"
                            hit={hit}
                            sourceField="protocolSection.armsInterventionsModule.interventions[].name"
                          />
                          {iv.type && (
                            <Badge variant="outline" className="text-[10px] ml-2 py-0 h-5">
                              {iv.type}
                            </Badge>
                          )}
                        </div>
                        {iv.description && (
                          <p className="text-[12px] text-muted-foreground mt-0.5">{iv.description}</p>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </section>
            )}

            <Separator />

            {/* Eligibility */}
            <section>
              <p className="text-[11px] font-semibold tracking-wider uppercase text-muted-foreground/80 mb-2 flex items-center gap-1.5">
                <Users className="h-3 w-3" /> Eligibility
              </p>
              <div className="grid grid-cols-3 gap-3 text-[12px] mb-3">
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground/70">Sex</p>
                  <p className="text-foreground">{data.eligibility.sex || '—'}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground/70">Age range</p>
                  <p className="text-foreground">
                    {data.eligibility.minAge || '—'} → {data.eligibility.maxAge || '—'}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground/70">Healthy volunteers</p>
                  <p className="text-foreground">{data.eligibility.healthyVolunteers ? 'Yes' : 'No'}</p>
                </div>
              </div>
              {data.eligibility.criteria && (
                <details className="text-[12px]">
                  <summary className="cursor-pointer text-primary hover:underline mb-2">
                    Show eligibility criteria
                  </summary>
                  <pre className="whitespace-pre-wrap font-sans text-[12px] text-muted-foreground bg-muted/30 p-3 rounded-md max-h-72 overflow-y-auto">
                    {data.eligibility.criteria}
                  </pre>
                </details>
              )}
            </section>

            <Separator />

            {/* Enrollment + dates */}
            <section className="grid grid-cols-2 md:grid-cols-4 gap-3 text-[12px]">
              <div>
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground/70">Enrollment</p>
                <p className="text-foreground font-medium">
                  {data.enrollment?.toLocaleString() ?? '—'}
                  {data.enrollmentType && (
                    <span className="text-muted-foreground text-[11px] ml-1">({data.enrollmentType})</span>
                  )}
                </p>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground/70">Start</p>
                <p className="text-foreground">{data.startDate || '—'}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground/70">Primary completion</p>
                <p className="text-foreground">{data.primaryCompletionDate || '—'}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground/70">Completion</p>
                <p className="text-foreground">{data.completionDate || '—'}</p>
              </div>
            </section>

            <Separator />

            {/* Locations */}
            {data.locations.length > 0 && (
              <section>
                <p className="text-[11px] font-semibold tracking-wider uppercase text-muted-foreground/80 mb-2 flex items-center gap-1.5">
                  <MapPin className="h-3 w-3" /> Locations ({data.locations.length})
                </p>
                <div className="max-h-72 overflow-y-auto space-y-1.5 pr-2">
                  {data.locations.slice(0, 50).map((l, i) => (
                    <div key={i} className="text-[12px] flex items-start justify-between gap-3 py-1.5 border-b border-border/30 last:border-0">
                      <div className="min-w-0 flex-1">
                        <p className="text-foreground truncate">{l.facility || '—'}</p>
                        <p className="text-muted-foreground text-[11px]">
                          {[l.city, l.state, l.country].filter(Boolean).join(', ')}
                        </p>
                      </div>
                      {l.status && (
                        <Badge variant="outline" className="text-[10px] py-0 h-5 shrink-0">
                          {l.status.replace(/_/g, ' ')}
                        </Badge>
                      )}
                    </div>
                  ))}
                </div>
                {data.locations.length > 50 && (
                  <p className="text-[11px] text-muted-foreground mt-2 italic">
                    Showing first 50 of {data.locations.length}. Full list on CTG.gov.
                  </p>
                )}
              </section>
            )}

            {/* CTG.gov link */}
            <div className="pt-4 border-t border-border/40">
              <Button asChild className="w-full gap-2">
                <a href={data.ctgUrl} target="_blank" rel="noopener noreferrer">
                  Open original record on ClinicalTrials.gov <ExternalLink className="h-4 w-4" />
                </a>
              </Button>
              <p className="text-[11px] text-muted-foreground text-center mt-2">
                <Calendar className="h-3 w-3 inline-block mr-1" />
                Authoritative source. Use to verify eligibility and contact info.
              </p>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
};

export default StudyDetailSheet;
