// /cohorts/:id/compare?ncts=NCT1,NCT2 — side by side comparison of 2 to 4
// trials from a saved cohort. Values come live from each NCT record on
// ClinicalTrials.gov. This is an interpretation aid: no ranking, no winner.

import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, ExternalLink, Loader2, Info, Download } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useTrialComparison } from '@/contexts/TrialComparisonContext';
import { buildComparisonReport, downloadReport } from '@/lib/comparisonReport';
import { TrialGeographyPanel } from '@/components/compare/TrialGeographyPanel';
import { useSeo } from '@/hooks/useSeo';
import {
  COMPARE_FIELDS, CompareTrial, MAX_COMPARE, MIN_COMPARE, fieldDiffers, fieldValue,
} from '@/lib/trialCompare';

const DETAIL_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ctg-trial-detail`;

type Slot = { nct: string; data?: CompareTrial; error?: string };

const CohortCompare = () => {
  const { selected: ncts } = useTrialComparison();
  const [slots, setSlots] = useState<Slot[]>([]);
  const [loading, setLoading] = useState(true);
  const [onlyDiff, setOnlyDiff] = useState(false);
  const [report, setReport] = useState<Uint8Array | null>(null);
  const [reportError, setReportError] = useState(false);

  useSeo({ title: 'Compare trials | Clinical Trial Diversity Studio', description: 'Side by side comparison of live ClinicalTrials.gov records.', canonical: '/compare-trials', noindex: true });

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    Promise.all(
      ncts.map(async (nct): Promise<Slot> => {
        try {
          const r = await fetch(`${DETAIL_URL}?nctId=${nct}`, { headers: { Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}` } });
          const b = await r.json();
          return r.ok ? { nct, data: b } : { nct, error: b.error ?? 'Could not load record' };
        } catch {
          return { nct, error: 'Network error' };
        }
      }),
    ).then((s) => { if (!cancelled) { setSlots(s); setLoading(false); } });
    return () => { cancelled = true; };
  }, [ncts]);

  const loaded = useMemo(() => slots.flatMap((slot) => slot.data ? [slot.data] : []), [slots]);
  useEffect(() => {
    let cancelled = false;
    setReport(null);
    setReportError(false);
    if (!loading && loaded.length >= MIN_COMPARE) {
      buildComparisonReport(loaded).then((bytes) => { if (!cancelled) setReport(bytes); })
        .catch(() => { if (!cancelled) setReportError(true); });
    }
    return () => { cancelled = true; };
  }, [loading, loaded]);
  const back = '/search-registry';

  if (ncts.length < MIN_COMPARE) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center">
        <p className="text-sm text-muted-foreground mb-4">Select between {MIN_COMPARE} and {MAX_COMPARE} trials in Search Registry.</p>
        <Button asChild><Link to={back}>Search Registry</Link></Button>
      </div>
    );
  }

  return (
    <div className="bg-background min-h-screen">
      <section className="px-4 md:px-6 lg:px-16 pt-10 pb-6 border-b border-border/50">
        <div className="max-w-6xl mx-auto">
          <Link to={back} className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground mb-4">
            <ArrowLeft className="h-3.5 w-3.5" /> Back to Search Registry
          </Link>
          <h1 className="font-display text-3xl font-medium text-foreground">Compare trials</h1>
          <p className="mt-2 text-[13px] text-muted-foreground max-w-3xl flex gap-2">
            <Info className="h-4 w-4 shrink-0 mt-0.5 text-primary" />
            Values are shown exactly as reported on each ClinicalTrials.gov record. Highlighted rows show where the records differ. This comparison does not rank trials or say one is better, and it is not medical advice.
          </p>
          <div className="mt-4 flex flex-wrap items-center gap-4">
            <label className="inline-flex items-center gap-2 text-[13px] text-foreground cursor-pointer">
              <input type="checkbox" checked={onlyDiff} onChange={(e) => setOnlyDiff(e.target.checked)} className="accent-primary h-4 w-4" />
              Show only rows that differ
            </label>
            <Button
              variant="outline"
              disabled={!report || loading}
              onClick={() => { if (report) downloadReport(report); }}
              className="gap-1.5"
            >
              <Download className="h-3.5 w-3.5" /> Download report (PDF)
            </Button>
            {reportError && <span role="alert" className="text-sm text-destructive">Report could not be prepared. Reload the records and try again.</span>}
          </div>
        </div>
      </section>

      <section className="px-4 md:px-6 lg:px-16 py-8">
        <div className="max-w-6xl mx-auto">
          {loading ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Loading records from ClinicalTrials.gov</div>
          ) : (
            <>
              {slots.some((s) => s.error) && (
                <p className="mb-4 text-[12px] text-destructive">
                  Could not load: {slots.filter((s) => s.error).map((s) => `${s.nct} (${s.error})`).join(', ')}
                </p>
              )}
              <div className="overflow-x-auto rounded-md border border-border" data-testid="compare-scroll">
                <table className="w-full text-[13px] border-collapse" style={{ minWidth: `${160 + loaded.length * 220}px` }}>
                  <thead>
                    <tr className="bg-muted/40">
                      <th className="sticky left-0 z-10 bg-muted text-left p-3 w-40 align-bottom text-[11px] uppercase tracking-wider text-muted-foreground">Field</th>
                      {loaded.map((t) => (
                        <th key={t.nctId} className="text-left p-3 align-top font-normal min-w-[220px]">
                          <a href={t.ctgUrl ?? `https://clinicaltrials.gov/study/${t.nctId}`} target="_blank" rel="noopener noreferrer"
                             className="font-mono text-xs font-semibold text-primary hover:underline inline-flex items-center gap-1">
                            {t.nctId} <ExternalLink className="h-3 w-3" />
                          </a>
                          <p className="mt-1 text-foreground font-medium leading-snug line-clamp-3">{t.briefTitle || '—'}</p>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {COMPARE_FIELDS.map((f) => {
                      const diff = fieldDiffers(loaded, f.key);
                      if (onlyDiff && !diff) return null;
                      return (
                        <tr key={f.key} className={`border-t border-border ${diff ? 'bg-primary/5' : ''}`}>
                          <th scope="row" className={`sticky left-0 z-10 text-left p-3 align-top font-semibold text-foreground ${diff ? 'bg-accent border-l-4 border-l-primary' : 'bg-card'}`}>
                            {f.label}
                            {diff && <Badge variant="outline" className="ml-1 mt-1 text-[10px] h-5 py-0 border-primary text-primary">Differs</Badge>}
                            <span className="block mt-1 text-[10px] font-mono font-normal text-muted-foreground break-all">{f.source}</span>
                          </th>
                          {loaded.map((t) => {
                            const v = fieldValue(t, f.key);
                            return (
                              <td key={t.nctId} className="p-3 align-top text-foreground">
                                {v == null ? (
                                  <span className="italic text-muted-foreground">Not reported on record</span>
                                ) : f.key === 'eligibility' ? (
                                  <details>
                                    <summary className="cursor-pointer text-primary text-[12px]">View criteria ({v.length.toLocaleString()} characters)</summary>
                                    <p className="mt-2 whitespace-pre-line text-[12px] max-h-80 overflow-y-auto">{v}</p>
                                  </details>
                                ) : (
                                  <span className="break-words">{v}</span>
                                )}
                              </td>
                            );
                          })}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <p className="mt-3 text-[11px] text-muted-foreground">Source: ClinicalTrials.gov API v2, fetched live. Follow each NCT link to verify the full record.</p>
              {loaded.length > 0 && <TrialGeographyPanel trials={loaded} />}
            </>
          )}
        </div>
      </section>
    </div>
  );
};

export default CohortCompare;
