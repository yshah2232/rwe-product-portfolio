import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Search, Loader2, ExternalLink, Sparkles, AlertCircle, Info, Filter,
  ThumbsUp, ThumbsDown, Star, Save, Layers,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { usePageTitle } from '@/hooks/usePageTitle';
import { track } from '@/lib/track';
import { getSessionId, sendSignal } from '@/lib/searchSession';
import { toast } from 'sonner';
import StudyDetailSheet from '@/components/StudyDetailSheet';
import TrustDrawer from '@/components/TrustDrawer';
import SaveCohortDialog from '@/components/SaveCohortDialog';
import { cleanSponsor } from '@/lib/canonicalize';

interface RankedTrial {
  nctId: string;
  briefTitle: string;
  officialTitle: string;
  status: string;
  phase: string[];
  conditions: string[];
  conditionsClean?: string[];
  interventions: string[];
  interventionsClean?: string[];
  leadSponsor: string;
  leadSponsorClean?: string;
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
  sessionId?: string;
  searchEventId?: string | null;
  usage: { rateLimitRemaining: number };
}

const SEARCH_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ctg-search`;

const exampleQueries = [
  'elderly patients with advanced lung tumors who already had chemo',
  'GLP-1 weight loss in patients with cardiovascular risk',
  'early Alzheimer disease trials testing memory preservation',
  'pediatric leukemia immunotherapy',
];

const ctgUrl = (nct: string) => `https://clinicaltrials.gov/study/${nct}`;

const SearchRegistry = () => {
  usePageTitle('Search Registry — Semantic search across ClinicalTrials.gov');

  const [query, setQuery] = useState('');
  const [phase, setPhase] = useState<string>('any');
  const [status, setStatus] = useState<string>('any');
  const [countryUS, setCountryUS] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<SearchResponse | null>(null);
  const [feedbackGiven, setFeedbackGiven] = useState<Record<string, 'up' | 'down'>>({});

  // Study detail sheet
  const [openNct, setOpenNct] = useState<string | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);

  // Cohort save flow
  const [selectedNcts, setSelectedNcts] = useState<Set<string>>(new Set());
  const [saveOpen, setSaveOpen] = useState(false);

  // Outcome modal state
  const [outcomeOpen, setOutcomeOpen] = useState(false);
  const [outcomeShown, setOutcomeShown] = useState(false);
  const [outcomeRating, setOutcomeRating] = useState<number>(0);
  const [outcomeText, setOutcomeText] = useState('');
  const [outcomeRole, setOutcomeRole] = useState('');
  const [outcomeConsent, setOutcomeConsent] = useState(false);

  const abortRef = useRef<AbortController | null>(null);
  const dwellRef = useRef<Map<string, number>>(new Map());
  const sessionSearchCount = useRef(0);
  const lastSearchRef = useRef<{ id: string | null; query: string; at: number } | null>(null);
  const sessionId = getSessionId();

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
    setFeedbackGiven({});
    setSelectedNcts(new Set()); // reset selection on new search

    const params = new URLSearchParams({ q: q.trim(), sid: sessionId });
    if (phase !== 'any') params.set('phase', phase);
    if (status !== 'any') params.set('status', status);
    if (countryUS) params.set('countryUS', 'true');

    try {
      const res = await fetch(`${SEARCH_URL}?${params.toString()}`, {
        signal: controller.signal,
        headers: { Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}` },
      });
      const body: SearchResponse = await res.json();
      if (!res.ok) {
        setError((body as any).error ?? `Request failed (${res.status})`);
        setData(null);
      } else {
        setData(body);
        sessionSearchCount.current += 1;
        track('search_registry_query', { query: q, results: body.results?.length ?? 0 });

        // Refinement detection — if this query came within 3 minutes of the prior one,
        // treat it as a pivot/refinement signal.
        const prior = lastSearchRef.current;
        const now = Date.now();
        if (prior && now - prior.at < 180_000 && prior.query !== q.trim()) {
          sendSignal({
            type: 'refinement',
            sessionId,
            priorSearchEventId: prior.id,
            nextSearchEventId: body.searchEventId ?? null,
            priorQuery: prior.query,
            nextQuery: q.trim(),
            secondsBetween: Math.round((now - prior.at) / 1000),
          });
        }
        lastSearchRef.current = { id: body.searchEventId ?? null, query: q.trim(), at: now };

        // Trigger the outcome modal once after the 2nd search of a session
        if (sessionSearchCount.current >= 2 && !outcomeShown) {
          setOutcomeShown(true);
          setTimeout(() => setOutcomeOpen(true), 4000);
        }
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

  // ── Signal helpers ──
  const trackInteraction = (
    trial: RankedTrial,
    rankPosition: number,
    eventType: 'card_click' | 'ctg_link_click' | 'dwell',
    dwellMs?: number,
  ) => {
    sendSignal({
      type: 'interaction',
      sessionId,
      searchEventId: data?.searchEventId ?? null,
      nctId: trial.nctId,
      rankPosition,
      semanticScore: trial.semanticScore,
      eventType,
      dwellMs,
    });
  };

  const handleCardEnter = (nctId: string) => {
    dwellRef.current.set(nctId, Date.now());
  };
  const handleCardLeave = (trial: RankedTrial, rank: number) => {
    const start = dwellRef.current.get(trial.nctId);
    if (!start) return;
    const dwell = Date.now() - start;
    dwellRef.current.delete(trial.nctId);
    if (dwell > 1500) trackInteraction(trial, rank, 'dwell', dwell);
  };

  const handleFeedback = (trial: RankedTrial, rank: number, rating: 'up' | 'down') => {
    setFeedbackGiven((prev) => ({ ...prev, [trial.nctId]: rating }));
    sendSignal({
      type: 'feedback',
      sessionId,
      searchEventId: data?.searchEventId ?? null,
      nctId: trial.nctId,
      rating,
    });
    toast.success(rating === 'up' ? 'Thanks — noted as a good match' : 'Thanks — noted as off-topic');
  };

  const submitOutcome = async () => {
    if (outcomeRating < 1) return;
    await sendSignal({
      type: 'outcome',
      sessionId,
      rating: outcomeRating,
      testimonial: outcomeText || undefined,
      role: outcomeRole || undefined,
      consentToShow: outcomeConsent,
    });
    toast.success('Thanks for the feedback');
    setOutcomeOpen(false);
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
              even when those exact words never appear in the protocol. Every result deep-links to the
              authoritative CTG.gov page so you can verify in one click.
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

          <div className="mt-6 flex items-start gap-3 p-4 rounded-lg bg-accent/30 border border-border/40">
            <Info className="h-4 w-4 text-primary mt-0.5 shrink-0" />
            <div className="text-[13px] text-muted-foreground leading-relaxed">
              <span className="font-semibold text-foreground">Demo limits in effect:</span> 30 searches per IP per
              day, 6 per minute, 25 candidates fetched, top 10 returned. Identical queries within the hour are
              served from edge cache. Anonymous interaction signals (clicks, dwell, thumbs up/down) are stored to
              improve future ranking — no IP or PII retained.
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
                    keyword on CTG.gov
                    {data.fallback && ' · semantic re-rank unavailable, showing CTG default order'}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <a
                    href={`https://clinicaltrials.gov/search?cond=${encodeURIComponent(data.query)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[11px] text-primary hover:underline inline-flex items-center gap-1"
                  >
                    Cross-check on CTG.gov <ExternalLink className="h-3 w-3" />
                  </a>
                  <p className="text-[11px] text-muted-foreground">
                    {data.usage.rateLimitRemaining} searches left today
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                {data.results.map((trial, idx) => {
                  const checked = selectedNcts.has(trial.nctId);
                  return (
                  <motion.div
                    key={trial.nctId}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                    onMouseEnter={() => handleCardEnter(trial.nctId)}
                    onMouseLeave={() => handleCardLeave(trial, idx + 1)}
                    className={`rounded-xl border bg-card p-5 transition-colors ${
                      checked ? 'border-primary/60 ring-1 ring-primary/20' : 'border-border/60 hover:border-primary/40'
                    }`}
                  >
                    <div className="flex items-start gap-3 mb-2">
                      <Checkbox
                        checked={checked}
                        onCheckedChange={(v) => {
                          setSelectedNcts((prev) => {
                            const next = new Set(prev);
                            if (v) next.add(trial.nctId);
                            else next.delete(trial.nctId);
                            return next;
                          });
                        }}
                        aria-label={`Select ${trial.nctId} for cohort`}
                        className="mt-1"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                          <button
                            onClick={() => {
                              setOpenNct(trial.nctId);
                              setSheetOpen(true);
                              trackInteraction(trial, idx + 1, 'card_click');
                            }}
                            className="text-xs font-mono font-semibold text-primary hover:underline"
                          >
                            {trial.nctId}
                          </button>
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
                        <button
                          onClick={() => {
                            setOpenNct(trial.nctId);
                            setSheetOpen(true);
                            trackInteraction(trial, idx + 1, 'card_click');
                          }}
                          className="font-display text-[17px] font-medium text-foreground leading-snug text-left hover:text-primary transition-colors"
                        >
                          {trial.briefTitle}
                        </button>
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

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-[12px] mb-4">
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

                    {/* Action row: explicit CTG button + feedback */}
                    <div className="flex items-center justify-between gap-3 pt-3 border-t border-border/40">
                      <Button
                        asChild
                        size="sm"
                        variant="outline"
                        className="gap-1.5 h-8 text-xs"
                        onClick={() => trackInteraction(trial, idx + 1, 'ctg_link_click')}
                      >
                        <a href={ctgUrl(trial.nctId)} target="_blank" rel="noopener noreferrer">
                          View on CTG.gov <ExternalLink className="h-3 w-3" />
                        </a>
                      </Button>

                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] uppercase tracking-wider text-muted-foreground/70 mr-1">
                          Was this match useful?
                        </span>
                        <button
                          onClick={() => handleFeedback(trial, idx + 1, 'up')}
                          disabled={!!feedbackGiven[trial.nctId]}
                          className={`p-1.5 rounded-md border transition-colors ${
                            feedbackGiven[trial.nctId] === 'up'
                              ? 'border-primary bg-primary/15 text-primary'
                              : 'border-border/60 hover:border-primary/40 text-muted-foreground hover:text-foreground'
                          } disabled:opacity-60`}
                          aria-label="Mark as good match"
                        >
                          <ThumbsUp className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => handleFeedback(trial, idx + 1, 'down')}
                          disabled={!!feedbackGiven[trial.nctId]}
                          className={`p-1.5 rounded-md border transition-colors ${
                            feedbackGiven[trial.nctId] === 'down'
                              ? 'border-destructive/60 bg-destructive/10 text-destructive'
                              : 'border-border/60 hover:border-destructive/40 text-muted-foreground hover:text-foreground'
                          } disabled:opacity-60`}
                          aria-label="Mark as off-topic"
                        >
                          <ThumbsDown className="h-3.5 w-3.5" />
                        </button>
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

      {/* End-of-session outcome modal */}
      <Dialog open={outcomeOpen} onOpenChange={setOutcomeOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Quick check — is this useful?</DialogTitle>
            <DialogDescription>
              Two-second rating helps the platform learn. Optional testimonial helps us prioritize what to build next.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label className="text-xs uppercase tracking-wider text-muted-foreground mb-2 block">
                Overall rating
              </Label>
              <div className="flex gap-1.5">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button
                    key={n}
                    onClick={() => setOutcomeRating(n)}
                    className={`p-2 rounded-md border transition-colors ${
                      outcomeRating >= n
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-border/60 text-muted-foreground hover:border-primary/40'
                    }`}
                    aria-label={`${n} star${n > 1 ? 's' : ''}`}
                  >
                    <Star className="h-4 w-4" fill={outcomeRating >= n ? 'currentColor' : 'none'} />
                  </button>
                ))}
              </div>
            </div>

            <div>
              <Label htmlFor="role" className="text-xs uppercase tracking-wider text-muted-foreground">
                Your role (optional)
              </Label>
              <Input
                id="role"
                value={outcomeRole}
                onChange={(e) => setOutcomeRole(e.target.value)}
                placeholder="e.g. Feasibility lead at mid-cap biotech"
                className="mt-1.5"
                maxLength={80}
              />
            </div>

            <div>
              <Label htmlFor="testimonial" className="text-xs uppercase tracking-wider text-muted-foreground">
                Anything specific worth sharing? (optional)
              </Label>
              <Textarea
                id="testimonial"
                value={outcomeText}
                onChange={(e) => setOutcomeText(e.target.value)}
                placeholder="e.g. Surfaced 3 trials our keyword search missed."
                className="mt-1.5 text-sm"
                rows={3}
                maxLength={500}
              />
            </div>

            <label className="flex items-start gap-2 cursor-pointer">
              <Checkbox
                checked={outcomeConsent}
                onCheckedChange={(v) => setOutcomeConsent(!!v)}
                id="consent"
              />
              <span className="text-xs text-muted-foreground leading-relaxed">
                You can quote me anonymously (role only, no name) on the public impact page.
              </span>
            </label>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="ghost" onClick={() => setOutcomeOpen(false)}>
              Skip
            </Button>
            <Button onClick={submitOutcome} disabled={outcomeRating < 1}>
              Submit
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SearchRegistry;
