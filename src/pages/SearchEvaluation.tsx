import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSeo } from '@/hooks/useSeo';
import { getSessionId } from '@/lib/searchSession';
import { useAdminAccess } from '@/contexts/AdminAccessContext';

type EvalCase = { id: string; query: string; expected_concepts: string[]; notes: string | null; created_at: string };
type EvalRun = { id: string; case_id: string; top5_ncts: string[]; relevant_in_top5: boolean; relevant_rank: number | null; candidates_fetched: number | null; retrieval_passes: number | null; notes: string | null; created_at: string };
type Result = { nctId: string; briefTitle: string; conditions: string[]; interventions: string[]; status: string; phase: string[]; semanticScore: number; semanticReason: string };
type RunState = { loading: boolean; error?: string; results?: Result[]; candidates?: number; passes?: number; warnings?: { code: string; message: string }[] };

const SEARCH_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ctg-search`;
const KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

const mentions = (r: Result, concept: string) =>
  `${r.briefTitle} ${r.conditions.join(' ')} ${r.interventions.join(' ')} ${r.phase.join(' ')} ${r.status}`
    .toLowerCase().replace(/[\s-]+/g, ' ').includes(concept.toLowerCase().replace(/[\s-]+/g, ' '));

const SearchEvaluation = () => {
  useSeo({ title: 'Search Evaluation — Internal', description: 'Internal search quality evaluation.', canonical: '/analytics/search-eval', noindex: true });
  const { request } = useAdminAccess();
  const [loadError, setLoadError] = useState<string | null>(null);
  const [cases, setCases] = useState<EvalCase[]>([]);
  const [runs, setRuns] = useState<EvalRun[]>([]);
  const [newQuery, setNewQuery] = useState('');
  const [newConcepts, setNewConcepts] = useState('');
  const [newNotes, setNewNotes] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [runState, setRunState] = useState<Record<string, RunState>>({});
  const [rankPick, setRankPick] = useState<Record<string, string>>({});

  const call = useCallback(async (method: string, body?: unknown, qs = '') => {
    const res = await request('search-eval', {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: body ? JSON.stringify(body) : undefined,
    }, qs);
    const json = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(typeof json.error === 'string' ? json.error : JSON.stringify(json.error));
    return json;
  }, [request]);

  const load = useCallback(async () => {
    const j = await call('GET');
    setCases(j.cases ?? []);
    setRuns(j.runs ?? []);
  }, [call]);

  useEffect(() => { load().catch((err) => setLoadError(err.message)); }, [load]);

  const latestRun = useMemo(() => {
    const m = new Map<string, EvalRun>();
    runs.forEach((r) => { if (!m.has(r.case_id)) m.set(r.case_id, r); });
    return m;
  }, [runs]);
  const scored = Array.from(latestRun.values());
  const hits = scored.filter((r) => r.relevant_in_top5).length;

  const addCase = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    try {
      await call('POST', {
        action: 'create_case', query: newQuery.trim(),
        expected_concepts: newConcepts.split(',').map((s) => s.trim()).filter(Boolean),
        notes: newNotes.trim() || undefined,
      });
      setNewQuery(''); setNewConcepts(''); setNewNotes('');
      await load();
    } catch (err) { setFormError((err as Error).message); }
  };

  const runCase = async (c: EvalCase) => {
    setRunState((s) => ({ ...s, [c.id]: { loading: true } }));
    try {
      const params = new URLSearchParams({ q: c.query, sid: getSessionId() });
      const res = await fetch(`${SEARCH_URL}?${params}`, { headers: { Authorization: `Bearer ${KEY}` } });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error ?? `Search failed (${res.status})`);
      setRunState((s) => ({ ...s, [c.id]: {
        loading: false, results: (j.results ?? []).slice(0, 5), candidates: j.candidatesFetched,
        passes: j.retrieval?.passes?.length ?? null, warnings: j.warnings,
      } }));
    } catch (err) {
      setRunState((s) => ({ ...s, [c.id]: { loading: false, error: (err as Error).message } }));
    }
  };

  const record = async (c: EvalCase, relevant: boolean) => {
    const st = runState[c.id];
    if (!st?.results) return;
    const rank = relevant && rankPick[c.id] ? Number(rankPick[c.id]) : null;
    await call('POST', {
      action: 'record_run', case_id: c.id, top5_ncts: st.results.map((r) => r.nctId),
      relevant_in_top5: relevant, relevant_rank: rank,
      candidates_fetched: st.candidates ?? null, retrieval_passes: st.passes ?? null,
    });
    setRunState((s) => { const n = { ...s }; delete n[c.id]; return n; });
    await load();
  };

  const removeCase = async (id: string) => {
    await call('DELETE', undefined, `?id=${id}`);
    await load();
  };

  const input = 'w-full border border-border rounded-sm px-2 py-1.5 bg-background text-sm';
  return (
    <div className="max-w-7xl mx-auto px-4 md:px-6 py-8 space-y-6">
      {loadError && <p role="alert" className="text-sm text-destructive">{loadError}</p>}
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Search evaluation</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Run test queries against the live search and record whether a relevant trial appeared in the top five.
          {scored.length > 0 && ` Latest judgement: ${hits} of ${scored.length} queries had a relevant result in the top five (${Math.round((hits / scored.length) * 100)}%).`}
        </p>
      </div>

      <form onSubmit={addCase} className="ctg-panel p-4 grid gap-3 md:grid-cols-3">
        <div className="md:col-span-3">
          <label className="text-sm font-semibold block mb-1" htmlFor="ev-q">Test query</label>
          <input id="ev-q" className={input} value={newQuery} onChange={(e) => setNewQuery(e.target.value)} maxLength={200} required minLength={3} />
        </div>
        <div className="md:col-span-2">
          <label className="text-sm font-semibold block mb-1" htmlFor="ev-c">Expected concepts (comma separated)</label>
          <input id="ev-c" className={input} value={newConcepts} onChange={(e) => setNewConcepts(e.target.value)} placeholder="KRAS G12C, lung cancer, recruiting" />
        </div>
        <div>
          <label className="text-sm font-semibold block mb-1" htmlFor="ev-n">Notes</label>
          <input id="ev-n" className={input} value={newNotes} onChange={(e) => setNewNotes(e.target.value)} maxLength={1000} />
        </div>
        {formError && <p className="text-sm text-destructive md:col-span-3">{formError}</p>}
        <div className="md:col-span-3">
          <button type="submit" className="px-3 py-1.5 rounded-sm text-sm font-semibold bg-primary text-primary-foreground">Add test query</button>
        </div>
      </form>

      {cases.length === 0 && <p className="text-sm text-muted-foreground">No test queries yet.</p>}

      <div className="space-y-4">
        {cases.map((c) => {
          const st = runState[c.id];
          const last = latestRun.get(c.id);
          const history = runs.filter((r) => r.case_id === c.id);
          return (
            <div key={c.id} className="ctg-panel p-4 space-y-3">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-semibold text-foreground">{c.query}</p>
                  {c.expected_concepts.length > 0 && <p className="text-[12.5px] text-muted-foreground">Expected: {c.expected_concepts.join(', ')}</p>}
                  {c.notes && <p className="text-[12.5px] text-muted-foreground">{c.notes}</p>}
                  <p className="text-[12px] text-muted-foreground mt-1">
                    {last
                      ? `Last judged ${new Date(last.created_at).toLocaleString()}: ${last.relevant_in_top5 ? `relevant in top five${last.relevant_rank ? ` (rank ${last.relevant_rank})` : ''}` : 'no relevant result in top five'} · ${history.length} judgement${history.length === 1 ? '' : 's'}`
                      : 'Not judged yet'}
                  </p>
                </div>
                <div className="flex gap-2 shrink-0">
                  <button onClick={() => runCase(c)} disabled={st?.loading} className="px-3 py-1.5 rounded-sm text-sm font-semibold bg-primary text-primary-foreground disabled:opacity-60">
                    {st?.loading ? 'Running…' : 'Run search'}
                  </button>
                  <button onClick={() => removeCase(c.id)} className="px-3 py-1.5 rounded-sm text-sm border border-border">Delete</button>
                </div>
              </div>

              {st?.error && <p className="text-sm text-destructive">{st.error}</p>}
              {st?.results && (
                <div className="space-y-2">
                  <p className="text-[12px] text-muted-foreground">{st.candidates} candidates reviewed across {st.passes ?? 1} registry queries.</p>
                  {st.warnings && st.warnings.length > 0 && (
                    <ul className="ctg-warning rounded-sm p-2 pl-6 list-disc text-[12px]">{st.warnings.map((w) => <li key={w.code}>{w.message}</li>)}</ul>
                  )}
                  {st.results.length === 0 && <p className="text-sm text-muted-foreground">No results returned.</p>}
                  <ol className="space-y-2">
                    {st.results.map((r, idx) => (
                      <li key={r.nctId} className="border border-border rounded-sm p-2 text-[13px]">
                        <p>
                          <span className="font-semibold">{idx + 1}.</span>{' '}
                          <a className="text-primary hover:underline" href={`https://clinicaltrials.gov/study/${r.nctId}`} target="_blank" rel="noopener noreferrer">{r.nctId}</a>{' '}
                          {r.briefTitle} <span className="text-muted-foreground">· score {r.semanticScore}</span>
                        </p>
                        {c.expected_concepts.length > 0 && (
                          <p className="text-[12px] mt-1">
                            {c.expected_concepts.map((k) => (
                              <span key={k} className={`mr-2 ${mentions(r, k) ? 'text-primary font-semibold' : 'text-muted-foreground line-through'}`}>{k}</span>
                            ))}
                          </p>
                        )}
                        <p className="text-[12px] text-muted-foreground mt-1">{r.semanticReason}</p>
                      </li>
                    ))}
                  </ol>
                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    <span className="text-sm font-semibold">Relevant result in top five?</span>
                    <select aria-label="Rank of first relevant result" className="border border-border rounded-sm px-2 py-1 text-sm bg-background"
                      value={rankPick[c.id] ?? ''} onChange={(e) => setRankPick((p) => ({ ...p, [c.id]: e.target.value }))}>
                      <option value="">Rank (optional)</option>
                      {st.results.map((_, i) => <option key={i} value={i + 1}>Rank {i + 1}</option>)}
                    </select>
                    <button onClick={() => record(c, true)} className="px-3 py-1.5 rounded-sm text-sm font-semibold bg-primary text-primary-foreground">Yes</button>
                    <button onClick={() => record(c, false)} className="px-3 py-1.5 rounded-sm text-sm border border-border">No</button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default SearchEvaluation;
