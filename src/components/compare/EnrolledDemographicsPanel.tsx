import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { fetchEnrolledDemographics, type DemoMeasure, type EnrolledDemographics } from '@/lib/enrolledDemographics';
import type { CompareTrial } from '@/lib/trialCompare';

type State = { status: 'loading' } | { status: 'error' } | { status: 'ok'; data: EnrolledDemographics };

const pct = (s: number) => `${(s * 100).toFixed(1)}%`;

function MeasureTable({ m }: { m: DemoMeasure }) {
  return (
    <div>
      <p className="text-xs font-semibold text-foreground">{m.title} <span className="font-normal text-muted-foreground">({m.total.toLocaleString()} participants)</span></p>
      <ul className="mt-1 space-y-1">
        {m.categories.map((c) => (
          <li key={c.label} className="text-xs">
            <div className="flex justify-between gap-2"><span>{c.label}</span><span className="tabular-nums text-muted-foreground">{c.count.toLocaleString()} · {pct(c.share)}</span></div>
            <div className="mt-0.5 h-1.5 rounded bg-muted"><div className="h-1.5 rounded bg-primary" style={{ width: pct(c.share) }} /></div>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function EnrolledDemographicsPanel({ trials }: { trials: CompareTrial[] }) {
  const [state, setState] = useState<Record<string, State>>({});
  const key = trials.map((t) => t.nctId).join(',');

  useEffect(() => {
    const ctrl = new AbortController();
    setState(Object.fromEntries(trials.map((t) => [t.nctId, { status: 'loading' } as State])));
    trials.forEach((t) => {
      fetchEnrolledDemographics(t.nctId, ctrl.signal)
        .then((data) => setState((s) => ({ ...s, [t.nctId]: { status: 'ok', data } })))
        .catch(() => { if (!ctrl.signal.aborted) setState((s) => ({ ...s, [t.nctId]: { status: 'error' } })); });
    });
    return () => ctrl.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  return (
    <section className="mt-8 rounded-md border bg-card p-4 sm:p-6" aria-labelledby="enrolled-demo-title">
      <h2 id="enrolled-demo-title" className="text-lg font-semibold">Who actually enrolled</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Race and ethnicity of enrolled participants, taken from the baseline results each sponsor posted on ClinicalTrials.gov. Trials without posted results show no figures; nothing is estimated. Compare these shares with the Census population context below.
      </p>
      <div className="mt-4 grid gap-4 md:grid-cols-2">
        {trials.map((t) => {
          const s = state[t.nctId];
          return (
            <div key={t.nctId} className="rounded border p-3">
              <a href={`https://clinicaltrials.gov/study/${t.nctId}?tab=results`} target="_blank" rel="noopener noreferrer" className="text-sm font-semibold text-primary underline">{t.nctId}</a>
              <p className="mb-2 line-clamp-2 text-xs text-muted-foreground">{t.briefTitle}</p>
              {!s || s.status === 'loading' ? (
                <p className="flex items-center gap-2 text-xs text-muted-foreground"><Loader2 className="h-3 w-3 animate-spin" /> Loading posted results</p>
              ) : s.status === 'error' ? (
                <p className="text-xs text-destructive">Posted results could not be loaded. Check the record directly.</p>
              ) : !s.data.race && !s.data.ethnicity ? (
                <p className="text-xs text-muted-foreground">No race or ethnicity results posted for this trial.</p>
              ) : (
                <div className="space-y-3">
                  {s.data.race && <MeasureTable m={s.data.race} />}
                  {s.data.ethnicity && <MeasureTable m={s.data.ethnicity} />}
                </div>
              )}
            </div>
          );
        })}
      </div>
      <p className="mt-3 text-[11px] text-muted-foreground">Source: ClinicalTrials.gov API v2, resultsSection.baselineCharacteristicsModule, Total group. Shares use the reported category counts as the denominator.</p>
    </section>
  );
}
