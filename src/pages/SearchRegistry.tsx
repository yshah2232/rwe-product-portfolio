import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Search, Loader2, ExternalLink, Sparkles, AlertCircle, Info, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { usePageTitle } from '@/hooks/usePageTitle';
import { track } from '@/lib/track';

interface RankedTrial {
  nctId: string;
  briefTitle: string;
  officialTitle: string;
  status: string;
  phase: string[];
  conditions: string[];
  interventions: string[];
  leadSponsor: string;
  enrollment: number | null;
  startDate: string;
  countries: string[];
  semanticScore: number;
  semanticReason: string;
}

interface SearchResponse {
  query: string;
  totalCount: number;
  candidatesFetched: number;
  results: RankedTrial[];
  fallback?: boolean;
  usage: { rateLimitRemaining: number };
}

const SEARCH_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ctg-search`;

const exampleQueries = [
  'elderly patients with advanced lung tumors who already had chemo',
  'GLP-1 weight loss in patients with cardiovascular risk',
  'early Alzheimer disease trials testing memory preservation',
  'pediatric leukemia immunotherapy',
];

const SearchRegistry = () => {
  usePageTitle('Search Registry — Semantic search across ClinicalTrials.gov');

  const [query, setQuery] = useState('');
  const [phase, setPhase] = useState<string>('any');
  const [status, setStatus] = useState<string>('any');
  const [countryUS, setCountryUS] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<SearchResponse | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const runSearch = async (q: string) => {
    if (q.trim().length < 3) {
      setError('Query must be at least 3 characters.');
      return;
    }
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setLoading(true);
    setError(null);

    const params = new URLSearchParams({ q: q.trim() });
    if (phase !== 'any') params.set('phase', phase);
    if (status !== 'any') params.set('status', status);
    if (countryUS) params.set('countryUS', 'true');

    try {
      const res = await fetch(`${SEARCH_URL}?${params.toString()}`, {
        signal: controller.signal,
        headers: {
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
      });
      const body = await res.json();
      if (!res.ok) {
        setError(body.error ?? `Request failed (${res.status})`);
        setData(null);
      } else {
        setData(body);
        track('search_registry_query', { query: q, results: body.results?.length ?? 0 });
      }
    } catch (e) {
      if ((e as Error).name !== 'AbortError') {
        setError(e instanceof Error ? e.message : 'Network error');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    runSearch(query);
  };

  const handleExample = (q: string) => {
    setQuery(q);
    runSearch(q);
  };

  useEffect(() => () => abortRef.current?.abort(), []);

  return (
    <div className="bg-background min-h-screen">
      {/* Header */}
      <section className="px-6 md:px-10 lg:px-16 pt-16 md:pt-20 pb-10 border-b border-border/50">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <p className="text-[11px] font-semibold tracking-[0.32em] uppercase text-primary/80 mb-5">
              <span className="inline-flex items-center gap-2">
                <span className="h-[1px] w-6 bg-primary/60" />
                Capability 01 · Search the Registry
                <span className="h-[1px] w-6 bg-primary/60" />
              </span>
            </p>
            <h1 className="font-display text-4xl md:text-[56px] font-medium leading-[1.05] tracking-[-0.02em] text-foreground">
              Search ClinicalTrials.gov
              <br />
              <span className="italic text-primary font-normal">by meaning, not just keywords.</span>
            </h1>
            <p className="mt-6 text-base md:text-lg text-muted-foreground leading-relaxed max-w-3xl">
              Type a clinical scenario in plain language. We pull live candidates from the CTG.gov v2 API and
              re-rank them semantically — so &ldquo;elderly lung tumor&rdquo; finds NSCLC trials in patients ≥65
              even when those exact words never appear in the protocol.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Search */}
      <section className="px-6 md:px-10 lg:px-16 py-10 border-b border-border/50">
        <div className="max-w-5xl mx-auto">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="e.g. elderly patients with advanced lung tumors who already had chemo"
                  className="pl-10 h-12 text-[15px]"
                  maxLength={200}
                />
              </div>
              <Button type="submit" size="lg" disabled={loading} className="gap-2 px-6">
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                {loading ? 'Searching' : 'Search'}
              </Button>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Filter className="h-3.5 w-3.5" /> Filters:
              </div>
              <Select value={phase} onValueChange={setPhase}>
                <SelectTrigger className="h-9 w-[150px] text-xs">
                  <SelectValue placeholder="Phase" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="any">Any phase</SelectItem>
                  <SelectItem value="PHASE1">Phase 1</SelectItem>
                  <SelectItem value="PHASE2">Phase 2</SelectItem>
                  <SelectItem value="PHASE3">Phase 3</SelectItem>
                  <SelectItem value="PHASE4">Phase 4</SelectItem>
                </SelectContent>
              </Select>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger className="h-9 w-[180px] text-xs">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="any">Any status</SelectItem>
                  <SelectItem value="RECRUITING">Recruiting</SelectItem>
                  <SelectItem value="ACTIVE_NOT_RECRUITING">Active, not recruiting</SelectItem>
                  <SelectItem value="COMPLETED">Completed</SelectItem>
                  <SelectItem value="NOT_YET_RECRUITING">Not yet recruiting</SelectItem>
                </SelectContent>
              </Select>
              <label className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer">
                <input
                  type="checkbox"
                  checked={countryUS}
                  onChange={(e) => setCountryUS(e.target.checked)}
                  className="rounded border-border"
                />
                US sites only
              </label>
            </div>
          </form>

          {/* Examples */}
          {!data && !loading && (
            <div className="mt-6">
              <p className="text-[11px] font-semibold tracking-[0.2em] uppercase text-muted-foreground mb-3">
                Try a semantic query
              </p>
              <div className="flex flex-wrap gap-2">
                {exampleQueries.map((ex) => (
                  <button
                    key={ex}
                    onClick={() => handleExample(ex)}
                    className="text-xs px-3 py-1.5 rounded-full border border-border/60 bg-card hover:border-primary/50 hover:bg-accent/40 transition-colors text-muted-foreground hover:text-foreground"
                  >
                    {ex}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Demo mode banner */}
          <div className="mt-6 flex items-start gap-3 p-4 rounded-lg bg-accent/30 border border-border/40">
            <Info className="h-4 w-4 text-primary mt-0.5 shrink-0" />
            <div className="text-[13px] text-muted-foreground leading-relaxed">
              <span className="font-semibold text-foreground">Demo limits in effect:</span> 30 searches per IP per
              day, 6 per minute, 25 candidates fetched, top 10 returned. Each query uses one cached LLM call to
              keep costs near zero — identical queries within the hour are served from edge cache.
            </div>
          </div>
        </div>
      </section>

      {/* Results */}
      <section className="px-6 md:px-10 lg:px-16 py-10">
        <div className="max-w-5xl mx-auto">
          {error && (
            <div className="flex items-start gap-3 p-4 rounded-lg bg-destructive/10 border border-destructive/30 mb-6">
              <AlertCircle className="h-4 w-4 text-destructive mt-0.5 shrink-0" />
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}

          {loading && (
            <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
              <Loader2 className="h-8 w-8 animate-spin mb-4 text-primary" />
              <p className="text-sm">Pulling from CTG.gov, then semantically re-ranking…</p>
            </div>
          )}

          {data && !loading && (
            <>
              <div className="flex flex-wrap items-baseline justify-between gap-3 mb-6">
                <div>
                  <h2 className="font-display text-2xl font-medium text-foreground">
                    {data.results.length} re-ranked results
                  </h2>
                  <p className="text-xs text-muted-foreground mt-1">
                    From {data.candidatesFetched} candidates · {data.totalCount.toLocaleString()} total matching the
                    keyword in the registry
                    {data.fallback && ' · semantic re-rank unavailable, showing CTG default order'}
                  </p>
                </div>
                <p className="text-[11px] text-muted-foreground">
                  {data.usage.rateLimitRemaining} searches remaining today
                </p>
              </div>

              <div className="space-y-3">
                {data.results.map((trial) => (
                  <motion.div
                    key={trial.nctId}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                    className="rounded-xl border border-border/60 bg-card p-5 hover:border-primary/40 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-4 mb-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1.5">
                          <a
                            href={`https://clinicaltrials.gov/study/${trial.nctId}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs font-mono font-semibold text-primary hover:underline inline-flex items-center gap-1"
                          >
                            {trial.nctId}
                            <ExternalLink className="h-3 w-3" />
                          </a>
                          {trial.status && (
                            <Badge variant="outline" className="text-[10px] py-0 h-5">
                              {trial.status.replace(/_/g, ' ')}
                            </Badge>
                          )}
                          {trial.phase.map((p) => (
                            <Badge key={p} variant="secondary" className="text-[10px] py-0 h-5">
                              {p.replace('PHASE', 'Phase ')}
                            </Badge>
                          ))}
                        </div>
                        <h3 className="font-display text-[17px] font-medium text-foreground leading-snug">
                          {trial.briefTitle}
                        </h3>
                      </div>
                      <div className="shrink-0 text-right">
                        <div
                          className={`inline-flex items-center justify-center w-12 h-12 rounded-lg font-display text-lg font-semibold ${
                            trial.semanticScore >= 80
                              ? 'bg-primary/15 text-primary'
                              : trial.semanticScore >= 60
                              ? 'bg-accent text-foreground'
                              : 'bg-muted text-muted-foreground'
                          }`}
                        >
                          {trial.semanticScore}
                        </div>
                        <p className="text-[10px] text-muted-foreground mt-1 uppercase tracking-wider">
                          Relevance
                        </p>
                      </div>
                    </div>

                    <p className="text-[13px] text-muted-foreground italic leading-relaxed mb-3 pl-3 border-l-2 border-primary/30">
                      {trial.semanticReason}
                    </p>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-[12px]">
                      <div>
                        <p className="text-[10px] uppercase tracking-wider text-muted-foreground/70 mb-0.5">
                          Sponsor
                        </p>
                        <p className="text-foreground truncate" title={trial.leadSponsor}>
                          {trial.leadSponsor || '—'}
                        </p>
                      </div>
                      <div>
                        <p className="text-[10px] uppercase tracking-wider text-muted-foreground/70 mb-0.5">
                          Conditions
                        </p>
                        <p className="text-foreground truncate" title={trial.conditions.join('; ')}>
                          {trial.conditions.slice(0, 2).join(', ') || '—'}
                        </p>
                      </div>
                      <div>
                        <p className="text-[10px] uppercase tracking-wider text-muted-foreground/70 mb-0.5">
                          Enrollment
                        </p>
                        <p className="text-foreground">
                          {trial.enrollment ? trial.enrollment.toLocaleString() : '—'}
                        </p>
                      </div>
                      <div>
                        <p className="text-[10px] uppercase tracking-wider text-muted-foreground/70 mb-0.5">
                          Countries
                        </p>
                        <p className="text-foreground truncate" title={trial.countries.join(', ')}>
                          {trial.countries.slice(0, 2).join(', ') || '—'}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>

              {data.results.length === 0 && (
                <div className="text-center py-16 text-muted-foreground">
                  <p className="text-sm">No trials matched. Try broadening the query or removing filters.</p>
                </div>
              )}
            </>
          )}
        </div>
      </section>
    </div>
  );
};

export default SearchRegistry;
