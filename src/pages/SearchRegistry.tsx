import { useState, useEffect, useRef } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { suggestCorrection } from '@/lib/typoSuggest';
import { motion } from 'framer-motion';
import {
  Search, Loader2, ExternalLink, Sparkles, AlertCircle, Info, Filter,
  ThumbsUp, ThumbsDown, Star, Columns2, LayoutGrid, Map as MapIcon,
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
import { useSeo } from '@/hooks/useSeo';
import { track } from '@/lib/track';
import { getSessionId, sendSignal } from '@/lib/searchSession';
import { toast } from 'sonner';
import StudyDetailSheet from '@/components/StudyDetailSheet';
import TrustDrawer from '@/components/TrustDrawer';
import { useTrialComparison } from '@/contexts/TrialComparisonContext';
import { MAX_COMPARE, MIN_COMPARE } from '@/lib/trialCompare';
import TrialMap from '@/components/TrialMap';
import { cleanSponsor, cleanIndication } from '@/lib/canonicalize';
import { usePlainMode } from '@/contexts/PlainModeContext';
import { SearchDiagnostics, EvidenceList, type SearchInterpretation, type SearchRetrieval, type SearchWarning, type Evidence } from '@/components/SearchDiagnostics';

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
  semanticScore: number | null;
  semanticReason: string;
  matchLabels?: string[];
  locationEvidence?: { location: string; confirmed: boolean; matchedSites: number; recruitingSites: number } | null;
  reasonSource?: 'llm_verified' | 'registry_fields';
  evidence?: Evidence[];
  notFound?: { concept: string; type: string }[];
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
  interpretation?: SearchInterpretation;
  retrieval?: SearchRetrieval;
  warnings?: SearchWarning[];
  challenge?: 'turnstile' | null;
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
  useSeo({
    title: 'Search Registry — Clinical Trial Diversity Studio',
    description: 'Plain-language search across live ClinicalTrials.gov. Filter by condition, phase, status, sponsor, and geography with AI-rewritten summaries.',
    canonical: '/search-registry',
  });
  const { plainMode } = usePlainMode();
  const [query, setQuery] = useState('');
  const [phase, setPhase] = useState<string>('any');
  const [status, setStatus] = useState<string>('any');
  const [countryUS, setCountryUS] = useState(false);
  const [loading, setLoading] = useState(false);
  const [stage, setStage] = useState(0);
  useEffect(() => {
    if (!loading) { setStage(0); return; }
    const t1 = setTimeout(() => setStage(1), 2500);
    const t2 = setTimeout(() => setStage(2), 6000);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [loading]);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<SearchResponse | null>(null);
  const [feedbackGiven, setFeedbackGiven] = useState<Record<string, 'up' | 'down'>>({});

  // Study detail sheet
  const [openNct, setOpenNct] = useState<string | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);

  // Cohort save flow
  const { selected, toggle: toggleTrial, clear: clearTrials } = useTrialComparison();
  const selectedNcts = new Set(selected);
  const [view, setView] = useState<'cards' | 'map'>('cards');

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

    const params = new URLSearchParams({ q: q.trim(), sid: sessionId });
    if (phase !== 'any') params.set('phase', phase);
    // Plain mode forces "Recruiting only" so non-clinical visitors don't see closed trials.
    const effectiveStatus = plainMode ? 'RECRUITING' : status;
    if (effectiveStatus !== 'any') params.set('status', effectiveStatus);
    if (countryUS) params.set('countryUS', 'true');
    // Browser language region only (e.g. en-US), sent as a ranking hint and never stored.
    if (/-US$/i.test(navigator.language || '')) params.set('region', 'US');

    try {
      const res = await fetch(`${SEARCH_URL}?${params.toString()}`, {
        signal: controller.signal,
        headers: { Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}` },
      });
      const body: SearchResponse = await res.json();
      if (!res.ok || body.challenge) {
        setError((body as any).error ?? (body.challenge ? 'Search was blocked by abuse protection. No registry search was performed. Reload the page and try again.' : `Request failed (${res.status})`));
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

        // Visitor outcome collection is disabled under the no retention policy.
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

  // Deep-link from homepage hero search: ?q=...
  const [searchParams, setSearchParams] = useSearchParams();
  const didConsumeQuery = useRef(false);
  useEffect(() => {
    if (didConsumeQuery.current) return;
    const q = searchParams.get('q');
    if (q && q.trim().length >= 3) {
      didConsumeQuery.current = true;
      setQuery(q);
      runSearch(q);
      // Clean the URL so a refresh doesn't re-fire
      const next = new URLSearchParams(searchParams);
      next.delete('q');
      setSearchParams(next, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  // "Did you mean?" — only when results are sparse or zero.
  const correction =
    data && data.results.length <= 2 ? suggestCorrection(data.query) : null;

  return (
    <div className="bg-background min-h-screen">
      {/* Header */}
      <section className="ctg-hero">
        <div className="ctg-hero-inner">
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="max-w-4xl"
          >
            <p className="text-[12px] font-semibold uppercase tracking-wider mb-2" style={{ color: 'hsl(var(--link))' }}>
              Home &nbsp;›&nbsp; Search the Registry
            </p>
            {plainMode ? (
              <div key="hero-plain">
                <h1 className="ctg-hero-title">
                  Find clinical trials in plain language.
                </h1>
                <p className="mt-4 text-[16px] text-foreground/80 leading-[1.6] max-w-3xl">
                  Type the health problem you (or someone you care about) are facing — in everyday words.
                  We'll search the official ClinicalTrials.gov registry and rewrite each study so you can
                  read it without a medical degree. Only studies that are <strong>currently recruiting</strong> are shown.
                </p>
              </div>
            ) : (
              <div key="hero-clinical">
                <h1 className="ctg-hero-title">
                  Search ClinicalTrials.gov by meaning, not just keywords.
                </h1>
                <p className="mt-4 text-[16px] text-foreground/80 leading-[1.6] max-w-3xl">
                  Type a clinical scenario in plain language. We pull live candidates from the CTG.gov v2 API
                  and re-rank them semantically — so &ldquo;elderly lung tumor&rdquo; finds NSCLC trials in
                  patients ≥65 even when those exact words never appear in the protocol. Every result deep-links
                  to the authoritative CTG.gov page.
                </p>
              </div>
            )}
          </motion.div>
        </div>
      </section>

      {/* Search */}
      <section className="px-4 md:px-6 lg:px-16 py-10 border-b border-border/50">
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
              {plainMode ? (
                <span key="status-plain" className="inline-flex items-center gap-1.5 h-9 px-3 rounded-sm border border-primary/30 bg-primary/10 text-[11.5px] font-semibold text-primary">
                  <Sparkles className="h-3 w-3" />
                  Recruiting only (Plain mode)
                </span>
              ) : (
                <Select key="status-clinical" value={status} onValueChange={setStatus}>
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
              )}
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
              day, 6 per minute. Up to 75 registry records are reviewed and 10 results returned.
              Search activity is not saved in our application database. Requests are processed by ClinicalTrials.gov
              and our AI service; their logging practices are separate. Downloads stay on your device.
            </div>
          </div>
        </div>
      </section>

      {/* Results */}
      <section className="px-4 md:px-6 lg:px-16 py-10">
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
              <ol className="space-y-1.5 text-sm" aria-live="polite">
                {['Searching ClinicalTrials.gov', 'Reviewing candidate trials', 'Ranking relevant matches'].map((label, i) => (
                  <li key={label} className={i === stage ? 'text-foreground font-semibold' : i < stage ? 'text-muted-foreground line-through decoration-muted-foreground/40' : 'text-muted-foreground/60'}>
                    {i < stage ? '✓ ' : i === stage ? '• ' : '○ '}{label}
                  </li>
                ))}
              </ol>
            </div>
          )}

          {data && !loading && (
            <>
              <div className="flex flex-wrap items-baseline justify-between gap-4 mb-3">
                <div>
                  <h2 className="font-display text-[26px] md:text-[28px] font-semibold text-foreground tracking-tight">
                    {data.results.length} re-ranked results
                  </h2>
                  <p className="text-[13px] text-muted-foreground mt-1.5">
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
                    className="text-[12px] font-medium text-primary hover:underline inline-flex items-center gap-1"
                  >
                    Cross-check on CTG.gov <ExternalLink className="h-3 w-3" />
                  </a>
                  <p className="text-[12px] text-muted-foreground">
                    {data.usage.rateLimitRemaining} searches left today
                  </p>
                </div>
              </div>

              {/* Did you mean? — typo / fuzzy correction */}
              {correction && (
                <div className="mb-4 flex items-center gap-2 text-[13.5px] text-foreground/85 bg-accent/40 border border-primary/20 rounded-md px-3 py-2">
                  <Sparkles className="h-3.5 w-3.5 text-primary shrink-0" />
                  <span>Did you mean</span>
                  <button
                    onClick={() => {
                      setQuery(correction);
                      runSearch(correction);
                      track('did_you_mean_click', { from: data.query, to: correction });
                    }}
                    className="font-semibold text-primary hover:underline"
                  >
                    {correction}
                  </button>
                  <span className="text-muted-foreground">?</span>
                </div>
              )}

              <SearchDiagnostics interpretation={data.interpretation} retrieval={data.retrieval} warnings={data.warnings} />

              {/* Source + freshness attribution */}
              <p className="text-[11.5px] text-muted-foreground mb-6 flex items-center gap-1.5">
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-primary/60" />
                Source: <a
                  href="https://clinicaltrials.gov/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium text-foreground/80 hover:text-primary underline-offset-2 hover:underline"
                >ClinicalTrials.gov</a> · Live API · Fetched {new Date().toLocaleString()} ·
                Re-ranking is AI-assisted — not a clinical recommendation.
              </p>

              {/* View toggle */}
              <div className="flex items-center gap-1 mb-6 p-1 rounded-lg border border-border/60 bg-muted/40 w-fit">
                <button
                  onClick={() => setView('cards')}
                  className={`text-[12.5px] font-medium px-3.5 py-1.5 rounded-md inline-flex items-center gap-1.5 transition-colors ${
                    view === 'cards'
                      ? 'bg-background text-foreground shadow-sm border border-border/60'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <LayoutGrid className="h-3.5 w-3.5" /> Card view
                </button>
                <button
                  onClick={() => setView('map')}
                  className={`text-[12.5px] font-medium px-3.5 py-1.5 rounded-md inline-flex items-center gap-1.5 transition-colors ${
                    view === 'map'
                      ? 'bg-background text-foreground shadow-sm border border-border/60'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <MapIcon className="h-3.5 w-3.5" /> Map view
                </button>
              </div>

              {view === 'map' && (
                <TrialMap
                  trials={data.results.map((t) => ({ nctId: t.nctId, countries: t.countries }))}
                />
              )}

              {view === 'cards' && (
              <div className="space-y-3.5">
                {data.results.map((trial, idx) => {
                  const checked = selectedNcts.has(trial.nctId);
                  const sponsorHit = cleanSponsor(trial.leadSponsor);
                  return (
                  <motion.div
                    key={trial.nctId}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                    onMouseEnter={() => handleCardEnter(trial.nctId)}
                    onMouseLeave={() => handleCardLeave(trial, idx + 1)}
                    className={`rounded-xl border bg-card p-5 md:p-6 transition-colors ${
                      checked ? 'border-primary/60 ring-1 ring-primary/20' : 'border-border/60 hover:border-primary/40'
                    }`}
                  >
                    <div className="flex items-start gap-3 mb-3">
                      <Checkbox
                        checked={checked}
                        onCheckedChange={() => toggleTrial(trial.nctId)}
                        disabled={!checked && selected.length >= MAX_COMPARE}
                        aria-label={`Select ${trial.nctId} for comparison`}
                        className="mt-1.5"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2 flex-wrap">
                          <button
                            onClick={() => {
                              setOpenNct(trial.nctId);
                              setSheetOpen(true);
                              trackInteraction(trial, idx + 1, 'card_click');
                            }}
                            className="text-[12px] font-mono font-semibold text-primary hover:underline"
                          >
                            {trial.nctId}
                          </button>
                          {trial.status && (
                            <Badge variant="outline" className="text-[10px] py-0 h-5 font-medium">
                              {trial.status.replace(/_/g, ' ')}
                            </Badge>
                          )}
                          {trial.phase.map((p) => (
                            <Badge key={p} variant="secondary" className="text-[10px] py-0 h-5 font-medium">
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
                          className="font-display text-[18px] md:text-[19px] font-semibold text-foreground leading-snug text-left hover:text-primary transition-colors"
                        >
                          {trial.briefTitle}
                        </button>
                        {plainMode && (
                          <button
                            onClick={() => {
                              setOpenNct(trial.nctId);
                              setSheetOpen(true);
                              trackInteraction(trial, idx + 1, 'card_click');
                            }}
                            className="mt-1.5 inline-flex items-center gap-1 text-[11.5px] font-semibold text-primary hover:underline"
                          >
                            <Sparkles className="h-3 w-3" /> Open in plain language
                          </button>
                        )}
                      </div>
                      {trial.semanticScore !== null && (
                      <div className="shrink-0 text-right">
                        <div
                          className={`inline-flex items-center justify-center w-14 h-14 rounded-lg font-display text-xl font-bold ${
                            trial.semanticScore >= 80
                              ? 'bg-primary/15 text-primary'
                              : trial.semanticScore >= 60
                              ? 'bg-accent text-foreground'
                              : 'bg-muted text-muted-foreground'
                          }`}
                          title="Semantic relevance score (0–100). Shown only when scores separate results."
                        >
                          {trial.semanticScore}
                        </div>
                        <p className="text-[10px] text-muted-foreground mt-1.5 uppercase tracking-wider font-medium">
                          Relevance
                        </p>
                      </div>
                      )}
                    </div>

                    {/* Why this scored: rationale from LLM reranker */}
                    <div className="mb-4 pl-3 border-l-2 border-primary/40 bg-primary/[0.03] rounded-r py-2 pr-3">
                      <p className="text-[10px] uppercase tracking-wider text-primary/80 font-semibold mb-1">
                        {trial.semanticScore !== null ? 'Why this score' : 'Why this matched'}
                      </p>
                      {trial.matchLabels && trial.matchLabels.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mb-1.5">
                          {trial.matchLabels.map((l) => (
                            <span key={l} className="text-[11px] font-medium px-1.5 py-0.5 rounded bg-primary/10 text-primary">{l}</span>
                          ))}
                        </div>
                      )}
                      <p className="text-[13px] text-foreground/85 leading-relaxed">
                        {trial.semanticReason}
                      </p>
                      <EvidenceList evidence={trial.evidence} notFound={trial.notFound} />
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-[12.5px] mb-4">
                      <div className="min-w-0">
                        <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-1">
                          Sponsor
                        </p>
                        <p className="text-foreground font-medium leading-snug truncate inline-flex items-center w-full" title={trial.leadSponsor}>
                          <span className="truncate">{sponsorHit.clean || trial.leadSponsor || '—'}</span>
                          {trial.leadSponsor && (
                            <TrustDrawer
                              field="Sponsor"
                              fieldType="sponsor"
                              hit={sponsorHit}
                              sourceField="protocolSection.sponsorCollaboratorsModule.leadSponsor.name"
                            />
                          )}
                        </p>
                        {sponsorHit.source === 'rule' && sponsorHit.clean !== sponsorHit.raw && (
                          <p className="text-[10.5px] text-muted-foreground mt-0.5 truncate" title={`Raw CTG.gov value: ${sponsorHit.raw}`}>
                            raw: <span className="font-mono">{sponsorHit.raw}</span>
                          </p>
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-1">
                          Conditions
                        </p>
                        {trial.conditions.length > 0 ? (
                          <div className="flex flex-col gap-0.5">
                            {trial.conditions.slice(0, 2).map((c) => {
                              const cleanedHit = cleanIndication(c);
                              const changed = cleanedHit.source === 'rule' && cleanedHit.clean !== cleanedHit.raw;
                              return (
                                <span key={c} className="text-foreground font-medium leading-snug inline-flex items-center" title={c}>
                                  <span className="truncate">{cleanedHit.clean}</span>
                                  {changed && (
                                    <TrustDrawer
                                      field="Condition"
                                      fieldType="indication"
                                      hit={cleanedHit}
                                      sourceField="protocolSection.conditionsModule.conditions[]"
                                    />
                                  )}
                                </span>
                              );
                            })}
                            {trial.conditions.length > 2 && (
                              <span className="text-[10.5px] text-muted-foreground">
                                +{trial.conditions.length - 2} more
                              </span>
                            )}
                          </div>
                        ) : (
                          <p className="text-foreground">—</p>
                        )}
                      </div>
                      <div>
                        <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-1">
                          Enrollment
                        </p>
                        <p className="text-foreground font-medium">
                          {trial.enrollment ? trial.enrollment.toLocaleString() : '—'}
                        </p>
                      </div>
                      <div className="min-w-0">
                        <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-1">
                          Countries
                        </p>
                        <p className="text-foreground font-medium truncate" title={trial.countries.join(', ')}>
                          {trial.countries.slice(0, 2).join(', ') || '—'}
                          {trial.countries.length > 2 && (
                            <span className="text-muted-foreground"> +{trial.countries.length - 2}</span>
                          )}
                        </p>
                      </div>
                    </div>

                    {/* Action row: explicit CTG button + feedback */}
                    <div className="flex items-center justify-between gap-3 pt-3 border-t border-border/40">
                      <Button
                        asChild
                        size="sm"
                        variant="outline"
                        className="gap-1.5 h-8 text-xs font-medium"
                        onClick={() => trackInteraction(trial, idx + 1, 'ctg_link_click')}
                      >
                        <a href={ctgUrl(trial.nctId)} target="_blank" rel="noopener noreferrer">
                          View on CTG.gov <ExternalLink className="h-3 w-3" />
                        </a>
                      </Button>

                      <div className="flex items-center gap-1.5">
                        <span className="text-[10.5px] uppercase tracking-wider text-muted-foreground font-semibold mr-1">
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
                  );
                })}
              </div>
              )}

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

      {/* Study detail sheet */}
      <StudyDetailSheet nctId={openNct} open={sheetOpen} onOpenChange={setSheetOpen} />

      {/* Temporary trial comparison */}
      {selectedNcts.size > 0 && (
        <motion.div
          initial={{ y: 80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-card text-foreground border border-border rounded-md shadow-lg px-4 py-3 flex flex-wrap justify-center items-center gap-3 w-max max-w-[calc(100%-2rem)]"
        >
          <span className="text-sm font-medium">
            {selectedNcts.size} of 4 selected
          </span>
          <Button size="sm" variant="ghost" onClick={clearTrials}>
            Clear
          </Button>
          <Button
            size="sm"
            variant="secondary"
            disabled={selected.length < MIN_COMPARE}
            asChild={selected.length >= MIN_COMPARE}
            className="gap-1.5"
          >
            {selected.length >= MIN_COMPARE ? <Link to="/compare-trials"><Columns2 className="h-3.5 w-3.5" /> Compare trials</Link> : <span>Choose at least 2 trials</span>}
          </Button>
        </motion.div>
      )}
    </div>
  );
};

export default SearchRegistry;
