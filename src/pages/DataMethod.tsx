import { motion } from 'framer-motion';
import { usePageTitle } from '@/hooks/usePageTitle';
import { Database, Filter, Layers, MapPin, RefreshCw, ShieldCheck, ExternalLink, ArrowRight, Search, Check, X, Sparkles, Wand2, Brain, GitMerge } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';

const anim = (delay: number) => ({
  initial: { opacity: 0, y: 14 },
  animate: { opacity: 1, y: 0 },
  transition: { delay, duration: 0.5, ease: [0.22, 1, 0.36, 1] as const },
});

// Mirrors the actual edge-function query (supabase/functions/ctg-trials/index.ts)
const apiParams = [
  { key: 'query.cond', value: 'condition string', desc: 'Therapeutic-area query (e.g. "GLP-1 OR semaglutide OR tirzepatide", "non-small cell lung cancer", "Alzheimer\'s Disease").' },
  { key: 'pageSize', value: '50 (capped 1–200)', desc: 'How many studies to return per request. Tuned to balance latency and coverage.' },
  { key: 'format', value: 'json', desc: 'Response format. We always request structured JSON.' },
  { key: 'countTotal', value: 'true', desc: 'Include the total matching study count for pagination & sizing.' },
  { key: 'filter.advanced', value: 'AREA[OverallStatus] / AREA[Phase] / AREA[LocationCountry]', desc: 'Optional advanced filters joined with AND — used when the studio narrows by status, phase, or country.' },
  { key: 'pageToken', value: 'opaque cursor', desc: 'Used to walk additional pages of results without losing the query context.' },
  { key: 'fields', value: 'pipe-separated paths', desc: 'Restricts the response to only the fields the studio renders — keeps payloads small.' },
];

const fields = [
  { group: 'Identity', items: ['NCTId', 'BriefTitle', 'OfficialTitle'] },
  { group: 'Status & design', items: ['OverallStatus', 'Phase', 'StudyType', 'EnrollmentCount'] },
  { group: 'Condition & intervention', items: ['Condition', 'InterventionName', 'InterventionType'] },
  { group: 'Sponsorship', items: ['LeadSponsorName', 'LeadSponsorClass'] },
  { group: 'Timeline', items: ['StartDate', 'PrimaryCompletionDate', 'CompletionDate'] },
  { group: 'Sites & geography', items: ['LocationFacility', 'LocationCity', 'LocationState', 'LocationCountry', 'LocationStatus'] },
  { group: 'Investigators', items: ['OverallOfficialName', 'OverallOfficialAffiliation', 'OverallOfficialRole'] },
];

const conditions = [
  { label: 'GLP-1 (Obesity & T2D)', query: 'GLP-1 OR semaglutide OR tirzepatide OR liraglutide' },
  { label: 'NSCLC', query: 'non-small cell lung cancer' },
  { label: "Alzheimer's Disease", query: "Alzheimer's Disease" },
];

const pipeline = [
  { icon: Database, label: 'Source', body: 'ClinicalTrials.gov v2 REST API — the U.S. National Library of Medicine\'s public registry of ~500K studies.' },
  { icon: Filter, label: 'Edge proxy', body: 'A server-side function calls the registry, applies country/phase/status filters, and trims to only the fields the studio renders.' },
  { icon: RefreshCw, label: 'Cache', body: 'Edge cache: 1-hour s-maxage with 24-hour stale-while-revalidate. Trial data does not change second-by-second.' },
  { icon: Layers, label: 'Shape', body: 'Studies are grouped by therapeutic area, then aggregated for KPIs (enrollment, status mix, phase mix) and detail views.' },
  { icon: MapPin, label: 'Display', body: 'Real NCT IDs, sponsors, principal investigators, and site locations are surfaced exactly as the registry reports them.' },
];

const DataMethod = () => {
  const navigate = useNavigate();
  usePageTitle('Data & Method — Clinical Trial Diversity Studio');

  return (
    <div className="bg-background">
      {/* HERO */}
      <section className="px-6 md:px-10 lg:px-16 pt-16 md:pt-24 pb-14 md:pb-20 border-b border-border/50">
        <div className="max-w-5xl mx-auto">
          <motion.p {...anim(0.05)} className="text-[11px] font-semibold tracking-[0.28em] uppercase text-primary/80 mb-5">
            Data & Method
          </motion.p>
          <motion.h1
            {...anim(0.12)}
            className="font-display text-[40px] md:text-[60px] font-medium leading-[1.05] tracking-[-0.02em] text-foreground"
          >
            Every number in the studio
            <br />
            <span className="italic text-primary font-normal">comes from the public registry.</span>
          </motion.h1>
          <motion.p {...anim(0.2)} className="mt-7 text-base md:text-lg text-muted-foreground leading-[1.7] max-w-3xl">
            The Clinical Trial Diversity Studio reads directly from the ClinicalTrials.gov v2 API. This page documents
            the exact source, the parameters we send, the fields we display, and how often the data refreshes — so any
            recommendation surfaced in the studio is fully traceable.
          </motion.p>

          <motion.a
            {...anim(0.28)}
            href="https://clinicaltrials.gov/data-api/api"
            target="_blank"
            rel="noopener noreferrer"
            className="mt-8 inline-flex items-center gap-2 text-sm font-semibold text-primary hover:gap-3 transition-all"
          >
            ClinicalTrials.gov API documentation <ExternalLink className="h-3.5 w-3.5" />
          </motion.a>
        </div>
      </section>

      {/* CTG.gov vs Search Registry — why this is better */}
      <section className="px-6 md:px-10 lg:px-16 py-20 md:py-24 border-b border-border/50 bg-muted/30">
        <div className="max-w-5xl mx-auto">
          <motion.div {...anim(0.05)} className="mb-12 max-w-2xl">
            <p className="text-[11px] font-semibold tracking-[0.28em] uppercase text-primary/80 mb-3">
              CTG.gov vs Search Registry
            </p>
            <h2 className="font-display text-3xl md:text-[40px] font-medium leading-[1.1] tracking-[-0.01em] text-foreground">
              Same source. Better question-answering.
            </h2>
            <p className="mt-4 text-sm md:text-base text-muted-foreground leading-relaxed">
              The Search Registry pulls from the exact same authoritative source as the public CTG.gov website —
              the v2 API. The difference is in the layer on top: how the query is understood, how results are
              ranked, and how the platform learns from use.
            </p>
          </motion.div>

          {/* Worked example */}
          <motion.div
            {...anim(0.1)}
            className="rounded-xl border border-border/60 bg-card p-5 md:p-7 mb-8"
          >
            <p className="text-[10px] font-semibold tracking-[0.22em] uppercase text-primary/80 mb-3">
              Worked example
            </p>
            <p className="font-mono text-[13px] md:text-[14px] text-foreground bg-muted/40 rounded-lg p-4 leading-relaxed">
              "elderly patients with advanced lung tumors who already had chemo"
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <div className="rounded-lg border border-border/50 bg-muted/30 p-4">
                <div className="flex items-center gap-2 mb-2">
                  <X className="h-4 w-4 text-destructive" strokeWidth={2.5} />
                  <p className="text-[12px] font-semibold uppercase tracking-wider text-muted-foreground">
                    CTG.gov keyword search
                  </p>
                </div>
                <p className="text-[13px] text-muted-foreground leading-relaxed">
                  Returns <span className="font-semibold text-foreground">0 trials</span> — no protocol uses the
                  literal phrase "elderly" or "lung tumor". The user has to translate clinical intent into
                  registry vocabulary first.
                </p>
              </div>
              <div className="rounded-lg border border-primary/40 bg-primary/5 p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="h-4 w-4 text-primary" strokeWidth={2.5} />
                  <p className="text-[12px] font-semibold uppercase tracking-wider text-primary">
                    Search Registry
                  </p>
                </div>
                <p className="text-[13px] text-muted-foreground leading-relaxed">
                  Strips filler, fetches NSCLC candidates, then re-ranks by full intent — surfacing{' '}
                  <span className="font-semibold text-foreground">Phase 2/3 NSCLC trials in patients ≥65 with
                  prior chemotherapy exposure</span>, ranked by semantic match with a one-line rationale on each.
                </p>
              </div>
            </div>
          </motion.div>

          {/* Comparison table */}
          <motion.div {...anim(0.18)} className="rounded-xl border border-border/60 bg-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/40">
                  <tr>
                    <th className="text-left py-3.5 px-5 md:px-6 font-semibold text-[11px] uppercase tracking-wider text-muted-foreground">
                      Capability
                    </th>
                    <th className="text-left py-3.5 px-5 font-semibold text-[11px] uppercase tracking-wider text-muted-foreground">
                      CTG.gov public site
                    </th>
                    <th className="text-left py-3.5 px-5 md:px-6 font-semibold text-[11px] uppercase tracking-wider text-primary">
                      Search Registry
                    </th>
                  </tr>
                </thead>
                <tbody className="text-[13px]">
                  {[
                    {
                      cap: 'Query understanding',
                      ctg: 'Keyword + boolean. Natural-language phrases often return zero hits.',
                      ours: 'Plain-language scenarios. Stopwords stripped, intent preserved.',
                    },
                    {
                      cap: 'Ranking',
                      ctg: 'Recency + keyword frequency.',
                      ours: 'Semantic relevance to clinical intent (LLM-as-reranker, 0–100).',
                    },
                    {
                      cap: 'Why this trial?',
                      ctg: 'No rationale.',
                      ours: 'One-sentence reason on every result, citing the matching condition / intervention.',
                    },
                    {
                      cap: 'Synonyms & abbreviations',
                      ctg: 'Manual — user must include both "NSCLC" and "non-small cell lung cancer".',
                      ours: 'Handled implicitly by the semantic layer.',
                    },
                    {
                      cap: 'Cross-verification',
                      ctg: 'N/A — it is the source.',
                      ours: 'Every result deep-links back to CTG.gov in one click. Header link cross-checks the same query.',
                    },
                    {
                      cap: 'Learning loop',
                      ctg: 'Static.',
                      ours: 'Captures clicks, dwell, thumbs up/down, refinements, and outcome ratings — feeds future ranking.',
                    },
                    {
                      cap: 'Cost guardrails',
                      ctg: 'N/A.',
                      ours: 'Per-IP rate limits + 1-hour edge cache + single LLM call per query.',
                    },
                  ].map((row) => (
                    <tr key={row.cap} className="border-t border-border/40 align-top">
                      <td className="py-4 px-5 md:px-6 font-semibold text-foreground whitespace-nowrap">
                        {row.cap}
                      </td>
                      <td className="py-4 px-5 text-muted-foreground leading-relaxed">
                        <span className="inline-flex items-start gap-1.5">
                          <X className="h-3.5 w-3.5 text-muted-foreground/60 mt-0.5 shrink-0" />
                          {row.ctg}
                        </span>
                      </td>
                      <td className="py-4 px-5 md:px-6 text-foreground leading-relaxed">
                        <span className="inline-flex items-start gap-1.5">
                          <Check className="h-3.5 w-3.5 text-primary mt-0.5 shrink-0" />
                          {row.ours}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>

          <motion.p {...anim(0.26)} className="mt-6 text-[12.5px] text-muted-foreground italic">
            We are not replacing CTG.gov — we sit on top of it. Same trials, same NCT IDs, faster path from a
            clinical question to a defensible shortlist.
          </motion.p>

          <motion.div {...anim(0.32)} className="mt-8">
            <Button
              size="lg"
              onClick={() => navigate('/search-registry')}
              className="gap-2 text-sm font-semibold shadow-md"
            >
              <Search className="h-4 w-4" /> Try the Search Registry <ArrowRight className="h-4 w-4" />
            </Button>
          </motion.div>
        </div>
      </section>

      {/* PIPELINE */}
      <section className="px-6 md:px-10 lg:px-16 py-20 md:py-24">
        <div className="max-w-5xl mx-auto">
          <motion.div {...anim(0.05)} className="mb-12">
            <p className="text-[11px] font-semibold tracking-[0.28em] uppercase text-primary/80 mb-3">Pipeline</p>
            <h2 className="font-display text-3xl md:text-[40px] font-medium leading-[1.1] tracking-[-0.01em] text-foreground">
              From the registry to the screen.
            </h2>
          </motion.div>

          <ol className="space-y-3">
            {pipeline.map((step, i) => (
              <motion.li
                key={step.label}
                {...anim(0.1 + i * 0.05)}
                className="grid grid-cols-[auto_auto_1fr] items-start gap-5 rounded-xl border border-border/60 bg-card p-5 md:p-6"
              >
                <span className="font-display text-2xl font-medium text-muted-foreground/60 w-8 leading-none pt-1">
                  0{i + 1}
                </span>
                <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-accent">
                  <step.icon className="h-5 w-5 text-primary" strokeWidth={1.75} />
                </div>
                <div>
                  <p className="font-display text-[18px] font-medium text-foreground leading-tight">{step.label}</p>
                  <p className="mt-1.5 text-[13.5px] text-muted-foreground leading-relaxed">{step.body}</p>
                </div>
              </motion.li>
            ))}
          </ol>
        </div>
      </section>

      {/* API REQUEST */}
      <section className="px-6 md:px-10 lg:px-16 py-20 md:py-24 border-t border-border/50 bg-muted/30">
        <div className="max-w-5xl mx-auto">
          <motion.div {...anim(0.05)} className="mb-10 max-w-2xl">
            <p className="text-[11px] font-semibold tracking-[0.28em] uppercase text-primary/80 mb-3">The request</p>
            <h2 className="font-display text-3xl md:text-[40px] font-medium leading-[1.1] tracking-[-0.01em] text-foreground">
              Exactly what we ask the registry.
            </h2>
            <p className="mt-4 text-sm md:text-base text-muted-foreground leading-relaxed">
              The studio's edge function calls a single endpoint per query. No scraping, no third-party feeds, no manual
              CSVs.
            </p>
          </motion.div>

          {/* Endpoint card */}
          <motion.div {...anim(0.1)} className="rounded-xl border border-border/60 bg-card p-5 md:p-6 mb-8 overflow-hidden">
            <div className="flex items-center gap-3 mb-3">
              <span className="text-[10px] font-semibold tracking-[0.2em] uppercase text-primary">Endpoint</span>
            </div>
            <pre className="font-mono text-[12.5px] md:text-[13px] text-foreground bg-muted/40 rounded-lg p-4 overflow-x-auto leading-relaxed whitespace-pre">
{`GET https://clinicaltrials.gov/api/v2/studies
    ?query.cond=<condition>
    &pageSize=50
    &format=json
    &countTotal=true
    &filter.advanced=AREA[LocationCountry]United States
    &fields=NCTId|BriefTitle|OverallStatus|Phase|...`}
            </pre>
          </motion.div>

          {/* Params table */}
          <motion.div {...anim(0.16)} className="rounded-xl border border-border/60 bg-card overflow-hidden">
            <div className="px-5 md:px-6 py-4 border-b border-border/60">
              <p className="font-display text-[18px] font-medium text-foreground">Parameters we send</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/40">
                  <tr>
                    <th className="text-left py-3 px-5 md:px-6 font-semibold text-[11px] uppercase tracking-wider text-muted-foreground">
                      Param
                    </th>
                    <th className="text-left py-3 px-5 font-semibold text-[11px] uppercase tracking-wider text-muted-foreground">
                      Value
                    </th>
                    <th className="text-left py-3 px-5 md:px-6 font-semibold text-[11px] uppercase tracking-wider text-muted-foreground">
                      Why
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {apiParams.map((p) => (
                    <tr key={p.key} className="border-t border-border/40 align-top">
                      <td className="py-3.5 px-5 md:px-6 font-mono text-[12.5px] text-foreground whitespace-nowrap">{p.key}</td>
                      <td className="py-3.5 px-5 font-mono text-[12px] text-primary/90">{p.value}</td>
                      <td className="py-3.5 px-5 md:px-6 text-[13px] text-muted-foreground leading-relaxed">{p.desc}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        </div>
      </section>

      {/* FIELDS RETURNED */}
      <section className="px-6 md:px-10 lg:px-16 py-20 md:py-24 border-t border-border/50">
        <div className="max-w-5xl mx-auto">
          <motion.div {...anim(0.05)} className="mb-10 max-w-2xl">
            <p className="text-[11px] font-semibold tracking-[0.28em] uppercase text-primary/80 mb-3">The response</p>
            <h2 className="font-display text-3xl md:text-[40px] font-medium leading-[1.1] tracking-[-0.01em] text-foreground">
              The fields we display.
            </h2>
            <p className="mt-4 text-sm md:text-base text-muted-foreground leading-relaxed">
              Each field below is requested explicitly and rendered as-is. Anything the studio shows about a study can
              be traced back to one of these registry fields.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-border/60 border border-border/60 rounded-2xl overflow-hidden">
            {fields.map((g, i) => (
              <motion.div key={g.group} {...anim(0.1 + i * 0.04)} className="bg-card p-6">
                <p className="text-[10px] font-semibold tracking-[0.22em] uppercase text-primary/80 mb-3">{g.group}</p>
                <div className="flex flex-wrap gap-1.5">
                  {g.items.map((item) => (
                    <span
                      key={item}
                      className="font-mono text-[12px] px-2.5 py-1 rounded-md bg-muted/60 text-foreground border border-border/50"
                    >
                      {item}
                    </span>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CONDITIONS WE SEED */}
      <section className="px-6 md:px-10 lg:px-16 py-20 md:py-24 border-t border-border/50 bg-muted/30">
        <div className="max-w-5xl mx-auto">
          <motion.div {...anim(0.05)} className="mb-10 max-w-2xl">
            <p className="text-[11px] font-semibold tracking-[0.28em] uppercase text-primary/80 mb-3">Seeded cohorts</p>
            <h2 className="font-display text-3xl md:text-[40px] font-medium leading-[1.1] tracking-[-0.01em] text-foreground">
              The exact queries powering each tab.
            </h2>
          </motion.div>

          <div className="space-y-3">
            {conditions.map((c, i) => (
              <motion.div
                key={c.label}
                {...anim(0.1 + i * 0.05)}
                className="rounded-xl border border-border/60 bg-card p-5 md:p-6 flex flex-col md:flex-row md:items-center gap-3 md:gap-6"
              >
                <p className="font-display text-[18px] font-medium text-foreground md:w-64 shrink-0">{c.label}</p>
                <code className="font-mono text-[12.5px] text-primary/90 bg-muted/50 rounded-md px-3 py-2 flex-1 overflow-x-auto">
                  query.cond = {c.query}
                </code>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* GUARANTEES */}
      <section className="px-6 md:px-10 lg:px-16 py-20 md:py-24 border-t border-border/50">
        <div className="max-w-5xl mx-auto">
          <motion.div {...anim(0.05)} className="grid grid-cols-1 lg:grid-cols-3 gap-px bg-border/60 border border-border/60 rounded-2xl overflow-hidden">
            <div className="bg-card p-7">
              <ShieldCheck className="h-5 w-5 text-primary mb-4" strokeWidth={1.75} />
              <p className="font-display text-[20px] font-medium text-foreground leading-snug">No fabricated data</p>
              <p className="mt-2 text-[13px] text-muted-foreground leading-relaxed">
                Every NCT ID, sponsor, investigator, and site location is read directly from the registry. The studio
                never invents providers or counts.
              </p>
            </div>
            <div className="bg-card p-7">
              <ShieldCheck className="h-5 w-5 text-primary mb-4" strokeWidth={1.75} />
              <p className="font-display text-[20px] font-medium text-foreground leading-snug">No PHI</p>
              <p className="mt-2 text-[13px] text-muted-foreground leading-relaxed">
                ClinicalTrials.gov publishes study-level metadata only. No patient-level records are fetched, stored,
                or displayed.
              </p>
            </div>
            <div className="bg-card p-7">
              <ShieldCheck className="h-5 w-5 text-primary mb-4" strokeWidth={1.75} />
              <p className="font-display text-[20px] font-medium text-foreground leading-snug">Auditable</p>
              <p className="mt-2 text-[13px] text-muted-foreground leading-relaxed">
                Click any study in the studio to jump back to its canonical record on ClinicalTrials.gov for
                independent verification.
              </p>
            </div>
          </motion.div>

          <motion.div {...anim(0.2)} className="mt-12 flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <Button
              size="lg"
              onClick={() => navigate('/search-registry')}
              className="gap-2 text-sm font-semibold shadow-md"
            >
              <Search className="h-4 w-4" /> Try the Search Registry <ArrowRight className="h-4 w-4" />
            </Button>
            <a
              href="https://clinicaltrials.gov/data-api/api"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors"
            >
              Read the registry's API docs <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default DataMethod;
