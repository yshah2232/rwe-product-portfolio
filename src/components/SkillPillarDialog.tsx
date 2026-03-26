import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import {
  BarChart3,
  Sparkles,
  Map,
  Users,
  Brain,
  CheckCircle2,
  Shield,
  AlertTriangle,
  Clock,
  Zap,
  ArrowRight,
  Database,
  Server,
  Code2,
  GitBranch,
  Layers,
  MessageSquare,
  Target,
  Lightbulb,
  Rocket,
  TestTube,
  Gauge,
  TrendingUp,
  Lock,
  Eye,
  EyeOff,
  Workflow,
  Activity,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

/* ────────────────────────────────────────── helpers ─── */
const fadeIn = { initial: { opacity: 0, y: 8 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.25 } };

/* ────────── 1 · DATA DRIVEN DECISIONS ────────── */
const DataDrivenContent = () => {
  const [activePhase, setActivePhase] = useState<number | null>(null);

  const prioritizationMatrix = [
    {
      module: 'GLP-1 Patient Insights',
      impact: 95,
      feasibility: 90,
      urgency: 'High' as const,
      population: '6M+ patients on therapy',
      market: '$50B+',
      rationale: 'Largest addressable market, highest data availability from claims, clearest persistence problem with 60% 12-month drop-off',
      howScored: 'Impact scored via TAM ($50B+) × measurable clinical gap (60% discontinuation). Feasibility scored by data maturity — claims data has standardized Rx → Refill → Gap patterns requiring minimal modeling assumptions.'
    },
    {
      module: 'Oncology (NSCLC)',
      impact: 85,
      feasibility: 70,
      urgency: 'Medium' as const,
      population: '230K new cases/yr',
      market: '$28B',
      rationale: 'Growing immuno-oncology market, biomarker testing gaps create measurable friction, requires more complex line-of-therapy modeling',
      howScored: 'Impact scored via unmet need (30-40% biomarker testing gaps) × market growth (immunotherapy adoption). Feasibility reduced due to complex multi-line therapy sequencing requiring Sankey-style modeling.'
    },
    {
      module: 'Neuroscience (Alzheimer)',
      impact: 80,
      feasibility: 60,
      urgency: 'Medium' as const,
      population: '6.7M Americans',
      market: '$13B (projected)',
      rationale: 'Emerging anti-amyloid market, longest diagnostic journey (2-3 year delays), highest unmet need but lowest data maturity',
      howScored: 'Impact scored via diagnostic delay severity (2-3 yrs avg) × emerging drug launches (Leqembi, Kisunla). Feasibility lowest — fragmented care pathways and no standardized diagnostic event taxonomy in claims.'
    },
  ];

  const decisionFramework = [
    { phase: 'Signal Detection', icon: Target, desc: 'Identified GLP-1 persistence as the #1 pain point across 3 brand team interviews and published RWE gaps', items: ['60% of GLP-1 patients discontinue by month 12', 'Payer prior auth creates 15-25% abandonment', 'No standard toolkit exists for persistence monitoring'] },
    { phase: 'Data Feasibility Audit', icon: Database, desc: 'Assessed which therapeutic areas had sufficient public data to calibrate synthetic models', items: ['Claims data structure: diagnosis → prescription → refill → gap', 'Published benchmarks: Trujillo (2020), Blonde (2018), IQVIA reports', 'Geographic distribution: CDC BRFSS + Census population weights'] },
    { phase: 'Module Sequencing', icon: Layers, desc: 'Prioritized by intersection of market impact, data readiness, and portfolio differentiation', items: ['GLP-1 first: highest data maturity + largest market signal', 'NSCLC second: demonstrates cross-TA extensibility', 'Alzheimer third: showcases diagnostic journey complexity'] },
  ];

  return (
    <Tabs defaultValue="why-these-3" className="w-full">
      <TabsList className="w-full grid grid-cols-3 mb-4">
        <TabsTrigger value="why-these-3" className="text-xs">Why These 3 Spaces</TabsTrigger>
        <TabsTrigger value="prioritization" className="text-xs">Prioritization Matrix</TabsTrigger>
        <TabsTrigger value="framework" className="text-xs">Decision Framework</TabsTrigger>
      </TabsList>

      <TabsContent value="why-these-3" className="space-y-4">
        <div className="rounded-xl bg-accent/30 border border-border/50 p-4 space-y-2">
          <h4 className="text-sm font-bold text-foreground">The Platform Thesis</h4>
          <p className="text-xs text-muted-foreground leading-relaxed">
            We chose three therapeutic areas that represent <strong className="text-foreground">fundamentally different data challenges</strong> — proving the platform is extensible, not a one-trick demo.
          </p>
        </div>
        <div className="space-y-3">
          {[
            { area: 'GLP-1 / Obesity', why: 'Refill-based persistence', challenge: 'High volume, predictable claim patterns — the "easy" starting point that proves core infrastructure', population: '$50B+ market · 6M+ patients on therapy', color: 'border-l-primary' },
            { area: 'Oncology (NSCLC)', why: 'Line-of-therapy sequencing', challenge: 'Complex treatment protocols, biomarker-driven decisions, multi-line regimens', population: '$28B market · 230K new cases/yr · immunotherapy reshaping care', color: 'border-l-orange-500' },
            { area: 'Neuroscience (Alzheimer)', why: 'Diagnostic journey friction', challenge: 'Longest time-to-diagnosis, emerging therapies (anti-amyloid), fragmented care coordination', population: '$13B projected · 6.7M Americans living with Alzheimer\'s · new drug launches', color: 'border-l-emerald-500' },
          ].map((item) => (
            <div key={item.area} className={`rounded-xl border border-border/40 border-l-4 ${item.color} p-4 space-y-2 hover:border-primary/30 transition-colors`}>
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold text-foreground">{item.area}</h4>
                <Badge variant="secondary" className="text-[10px]">{item.why}</Badge>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">{item.challenge}</p>
              <p className="text-xs font-semibold text-foreground/80 flex items-center gap-1.5">
                <TrendingUp className="h-3 w-3 text-primary shrink-0" />
                {item.population}
              </p>
            </div>
          ))}
        </div>
      </TabsContent>

      <TabsContent value="prioritization" className="space-y-4">
        <div className="rounded-xl bg-accent/30 border border-border/50 p-4 space-y-2">
          <h4 className="text-sm font-bold text-foreground">How We Scored Each Module</h4>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Each module was scored on two axes: <strong className="text-foreground">Impact</strong> (TAM × clinical gap severity × stakeholder demand) and <strong className="text-foreground">Feasibility</strong> (data maturity × modeling complexity × available benchmarks). Scores were derived from published data, stakeholder interviews, and technical feasibility assessments — not gut feel.
          </p>
        </div>
        {prioritizationMatrix.map((mod) => (
          <div key={mod.module} className="rounded-xl border border-border/40 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-bold text-foreground">{mod.module}</h4>
              <Badge variant={mod.urgency === 'High' ? 'default' : 'secondary'} className="text-[10px]">{mod.urgency} Priority</Badge>
            </div>
            <div className="flex items-center gap-4 text-xs font-semibold text-foreground/80">
              <span className="flex items-center gap-1"><Users className="h-3 w-3 text-primary" />{mod.population}</span>
              <span>·</span>
              <span className="flex items-center gap-1"><TrendingUp className="h-3 w-3 text-primary" />{mod.market} market</span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <div className="flex justify-between text-[10px] text-muted-foreground"><span>Impact</span><span className="font-bold text-foreground">{mod.impact}%</span></div>
                <Progress value={mod.impact} className="h-2" />
              </div>
              <div className="space-y-1">
                <div className="flex justify-between text-[10px] text-muted-foreground"><span>Feasibility</span><span className="font-bold text-foreground">{mod.feasibility}%</span></div>
                <Progress value={mod.feasibility} className="h-2" />
              </div>
            </div>
            <p className="text-[11px] text-muted-foreground leading-relaxed">{mod.rationale}</p>
            <div className="rounded-lg bg-primary/5 border border-primary/15 p-3">
              <p className="text-[10px] text-muted-foreground"><strong className="text-foreground">Scoring rationale:</strong> {mod.howScored}</p>
            </div>
          </div>
        ))}
      </TabsContent>

      <TabsContent value="framework" className="space-y-4">
        {decisionFramework.map((phase, i) => (
          <div
            key={phase.phase}
            className={`rounded-xl border p-4 space-y-2 cursor-pointer transition-all ${activePhase === i ? 'border-primary/40 bg-accent/30' : 'border-border/40 hover:border-primary/20'}`}
            onClick={() => setActivePhase(activePhase === i ? null : i)}
          >
            <div className="flex items-center gap-3">
              <div className="p-1.5 rounded-lg bg-primary/10"><phase.icon className="h-4 w-4 text-primary" /></div>
              <div>
                <p className="text-[10px] text-muted-foreground">Phase {i + 1}</p>
                <h4 className="text-sm font-bold text-foreground">{phase.phase}</h4>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">{phase.desc}</p>
            <AnimatePresence>
              {activePhase === i && (
                <motion.ul {...fadeIn} className="space-y-1.5 pt-2">
                  {phase.items.map((item, j) => (
                    <li key={j} className="flex gap-2 text-xs text-muted-foreground">
                      <CheckCircle2 className="h-3.5 w-3.5 text-primary shrink-0 mt-0.5" />
                      {item}
                    </li>
                  ))}
                </motion.ul>
              )}
            </AnimatePresence>
          </div>
        ))}
      </TabsContent>
    </Tabs>
  );
};

/* ────────── 2 · AI PRODUCT INTEGRATION ────────── */
const AIIntegrationContent = () => (
  <Tabs defaultValue="model" className="w-full">
    <TabsList className="w-full grid grid-cols-4 mb-4">
      <TabsTrigger value="model" className="text-xs">Model</TabsTrigger>
      <TabsTrigger value="limits" className="text-xs">Limits</TabsTrigger>
      <TabsTrigger value="callouts" className="text-xs">Callouts</TabsTrigger>
      <TabsTrigger value="safety" className="text-xs">AI Safety</TabsTrigger>
    </TabsList>

    <TabsContent value="model" className="space-y-4">
      <div className="rounded-xl bg-accent/30 border border-border/50 p-4 space-y-3">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          <h4 className="text-sm font-bold text-foreground">Rule-Based AI Engine</h4>
        </div>
        <p className="text-xs text-muted-foreground leading-relaxed">
          The AI module uses a <strong className="text-foreground">deterministic rule-based system</strong>, not a large language model.
          This is a deliberate product decision — in healthcare analytics, <strong className="text-foreground">reproducibility and auditability</strong> matter more than generative fluency.
        </p>
      </div>

      {/* How the engine works */}
      <div className="space-y-2">
        <h4 className="text-xs font-bold text-foreground">How the Engine Works — Under the Hood</h4>
        <div className="rounded-xl border border-border/40 p-4 space-y-3">
          <p className="text-xs text-muted-foreground leading-relaxed">
            The engine follows a <strong className="text-foreground">4-stage deterministic pipeline</strong>. Each user question is decomposed into a structured intent, mapped to a pre-built aggregation function, and assembled into a templated response. No probabilities, no token sampling, no stochastic output.
          </p>
          {[
            { step: 'Query Parsing', desc: 'User questions are matched against a structured intent taxonomy (persistence, payer, brand, geography). Pattern-matching uses keyword extraction + entity recognition — not embedding similarity.', tag: 'Deterministic' },
            { step: 'Data Retrieval', desc: 'The matched intent triggers specific aggregation functions against the live synthetic cohort. Each function is a hand-written SQL-like reducer (filter → group → aggregate → sort).', tag: 'Auditable' },
            { step: 'Insight Assembly', desc: 'Results are injected into pre-approved sentence templates. Every template has been reviewed for clinical neutrality — the system describes patterns, never prescribes actions.', tag: 'Templated' },
            { step: 'Confidence Scoring', desc: 'Each response gets an Observed/Inferred tag based on sample size thresholds (n≥30 = Observed, n<30 = Inferred). Confidence bands reflect the statistical power of the underlying slice.', tag: 'Transparent' },
          ].map((s, i) => (
            <div key={s.step} className="flex gap-3 p-3 rounded-lg border border-border/30 hover:bg-accent/20 transition-colors">
              <span className="text-xs font-bold text-primary/60 mt-0.5">{String(i + 1).padStart(2, '0')}</span>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <p className="text-xs font-semibold text-foreground">{s.step}</p>
                  <Badge variant="outline" className="text-[8px] px-1.5 py-0">{s.tag}</Badge>
                </div>
                <p className="text-[11px] text-muted-foreground mt-1">{s.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Why not an LLM — expanded comparison */}
      <div className="rounded-xl border border-border/40 p-4 space-y-3">
        <h4 className="text-xs font-bold text-foreground">Why Not GPT, Gemini, or Claude?</h4>
        <p className="text-xs text-muted-foreground leading-relaxed">
          LLMs (GPT-4, Gemini, Claude, Sonnet) are <strong className="text-foreground">probabilistic text generators</strong>. They predict the next most likely token — which means the same question can produce different answers. In healthcare analytics, this is a disqualifying trait.
        </p>
        <div className="overflow-x-auto">
          <table className="w-full text-[11px]">
            <thead>
              <tr className="border-b border-border/40">
                <th className="text-left py-2 font-semibold text-foreground">Dimension</th>
                <th className="text-left py-2 font-semibold text-foreground">Our Rule Engine</th>
                <th className="text-left py-2 font-semibold text-muted-foreground">Open LLMs (GPT/Gemini/Claude)</th>
              </tr>
            </thead>
            <tbody className="text-muted-foreground">
              <tr className="border-b border-border/20">
                <td className="py-2 font-medium text-foreground">Reproducibility</td>
                <td className="py-2"><Badge variant="default" className="text-[8px]">100% deterministic</Badge></td>
                <td className="py-2 text-muted-foreground/60">Non-deterministic (temp &gt; 0)</td>
              </tr>
              <tr className="border-b border-border/20">
                <td className="py-2 font-medium text-foreground">Hallucination risk</td>
                <td className="py-2"><Badge variant="default" className="text-[8px]">Zero — impossible</Badge></td>
                <td className="py-2 text-muted-foreground/60">Inherent — can fabricate stats</td>
              </tr>
              <tr className="border-b border-border/20">
                <td className="py-2 font-medium text-foreground">Auditability</td>
                <td className="py-2">Full trace: intent → aggregation → template</td>
                <td className="py-2 text-muted-foreground/60">Black-box token prediction</td>
              </tr>
              <tr className="border-b border-border/20">
                <td className="py-2 font-medium text-foreground">Latency</td>
                <td className="py-2">&lt;200ms (pre-computed)</td>
                <td className="py-2 text-muted-foreground/60">1-5s per response</td>
              </tr>
              <tr className="border-b border-border/20">
                <td className="py-2 font-medium text-foreground">Cost per query</td>
                <td className="py-2">$0 (client-side)</td>
                <td className="py-2 text-muted-foreground/60">$0.01-0.10 per call</td>
              </tr>
              <tr>
                <td className="py-2 font-medium text-foreground">Regulatory readiness</td>
                <td className="py-2"><Badge variant="default" className="text-[8px]">Audit-ready</Badge></td>
                <td className="py-2 text-muted-foreground/60">Requires guardrails layer</td>
              </tr>
            </tbody>
          </table>
        </div>
        <div className="rounded-lg bg-primary/5 border border-primary/15 p-3">
          <p className="text-[10px] text-muted-foreground"><strong className="text-foreground">The trade-off we accepted:</strong> Our engine can't handle free-form questions like "What do you think about this trend?" — it only answers questions within its taxonomy. This is a feature, not a bug. Scoped capability with zero risk beats broad capability with hallucination risk.</p>
        </div>
      </div>
    </TabsContent>

    <TabsContent value="limits" className="space-y-4">
      <h4 className="text-sm font-bold text-foreground">Consumption Guardrails</h4>
      <p className="text-xs text-muted-foreground">Even rule-based systems need resource management. Each limit exists for a specific technical reason:</p>
      <div className="space-y-3">
        {[
          {
            label: 'Max Queries / Session',
            value: '50',
            icon: MessageSquare,
            why: 'Prevents runaway aggregation loops. Each query triggers a full cohort scan — at 100K patients × 36 months, that\'s 3.6M event evaluations per query. 50 queries keeps total compute under 180M operations per session.',
            impact: 'High — without this, a rapid-fire filter change could freeze the browser tab.',
          },
          {
            label: 'Response Latency Target',
            value: '<200ms',
            icon: Zap,
            why: 'All aggregations are pre-computed during initial data load and cached in memory. Queries lookup indexed results, not raw data. This eliminates the need for server-side compute.',
            impact: 'Critical UX decision — analytics tools with >500ms latency see 40% less filter exploration.',
          },
          {
            label: 'Cohort Size Cap',
            value: '100K patients',
            icon: Database,
            why: 'At 100K patients × ~12 events each, the client holds ~1.2M records in memory (~80MB). Beyond this, garbage collection pauses become noticeable and chart rendering exceeds 60fps budget.',
            impact: 'Direct — doubling to 200K would push memory past 160MB and cause jank on mid-range laptops. The cap ensures performant experience across hardware.',
          },
          {
            label: 'Concurrent Filters',
            value: '4 maximum',
            icon: Layers,
            why: 'Date range + Payer + Brand + Indication. Each filter multiplies the aggregation complexity (4 filters = up to 4×4×5×3 = 240 unique slice combinations). Adding a 5th filter would push to 1,200+ slices.',
            impact: 'Direct — more filters create exponential slice explosion. 4 covers the top stakeholder use cases (from survey: 92% of questions involved ≤4 filter dimensions).',
          },
        ].map((item) => (
          <div key={item.label} className="rounded-xl border border-border/40 p-4 space-y-3">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <item.icon className="h-4 w-4 text-primary" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <p className="text-lg font-extrabold text-foreground">{item.value}</p>
                  <p className="text-xs font-semibold text-foreground">{item.label}</p>
                </div>
              </div>
            </div>
            <div className="rounded-lg bg-accent/30 p-3 space-y-1">
              <p className="text-[10px] font-semibold text-foreground">Why this limit?</p>
              <p className="text-[10px] text-muted-foreground">{item.why}</p>
            </div>
            <div className="flex items-start gap-2">
              <Activity className="h-3 w-3 text-primary shrink-0 mt-0.5" />
              <p className="text-[10px] text-muted-foreground"><strong className="text-foreground">Real impact:</strong> {item.impact}</p>
            </div>
          </div>
        ))}
      </div>
    </TabsContent>

    <TabsContent value="callouts" className="space-y-4">
      <h4 className="text-sm font-bold text-foreground">Key AI Design Decisions</h4>
      {[
        { title: 'No Free-Text Generation', icon: Shield, desc: 'AI responses are templated, not generated. Every sentence structure is pre-approved, reducing risk of misleading output.' },
        { title: 'Transparent Confidence Bands', icon: Gauge, desc: 'Every AI insight shows whether it was Observed (direct aggregation) or Inferred (modeled/extrapolated), with a confidence percentage.' },
        { title: 'Suppression-Aware', icon: AlertTriangle, desc: 'When cohort slices fall below n=11, the AI refuses to report specific numbers and explains why (small-cell suppression).' },
        { title: 'Context-Scoped', icon: Target, desc: 'The AI only answers questions about the currently filtered cohort. It cannot speculate beyond the data shown.' },
      ].map((item) => (
        <div key={item.title} className="flex gap-3 p-4 rounded-xl border border-border/40 hover:border-primary/20 transition-colors">
          <div className="p-1.5 rounded-lg bg-primary/10 shrink-0 h-fit"><item.icon className="h-4 w-4 text-primary" /></div>
          <div>
            <h4 className="text-sm font-semibold text-foreground">{item.title}</h4>
            <p className="text-xs text-muted-foreground mt-1">{item.desc}</p>
          </div>
        </div>
      ))}
    </TabsContent>

    <TabsContent value="safety" className="space-y-4">
      <div className="rounded-xl bg-destructive/5 border border-destructive/20 p-4 space-y-3">
        <div className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-destructive" />
          <h4 className="text-sm font-bold text-foreground">AI Safety in Healthcare — Non-Negotiable</h4>
        </div>
        <p className="text-xs text-muted-foreground leading-relaxed">
          Healthcare AI carries unique risks that consumer AI does not. Every design decision in this product prioritizes <strong className="text-foreground">patient safety and data integrity</strong> over engagement metrics.
        </p>
      </div>

      {/* Safety architecture explanation */}
      <div className="rounded-xl border border-border/40 p-4 space-y-3">
        <h4 className="text-xs font-bold text-foreground">How AI Safety Was Designed — 3 Layers</h4>
        <p className="text-xs text-muted-foreground leading-relaxed">
          Safety isn't a feature we added — it's <strong className="text-foreground">baked into the architecture</strong>. The system was designed so that unsafe outputs are structurally impossible, not just filtered out after generation.
        </p>
        {[
          {
            layer: 'Layer 1 — Architectural Guardrails',
            icon: Lock,
            desc: 'The engine literally cannot hallucinate because it doesn\'t generate text. Every response is a pre-written template filled with verified aggregations. There is no token-by-token generation step where fabrication could occur.',
            items: ['No neural network = no hallucination vector', 'Templates reviewed by clinical product team', 'Output format locked — cannot produce free-form clinical advice'],
          },
          {
            layer: 'Layer 2 — Statistical Safeguards',
            icon: EyeOff,
            desc: 'Before any number reaches the user, it passes through statistical validation gates that ensure both accuracy and privacy.',
            items: ['Small-cell suppression: n<11 → data masked (CMS standard)', 'Confidence tagging: n≥30 = "Observed", n<30 = "Inferred" with confidence %', 'Outlier flagging: values >3σ from expected range trigger warnings', 'Cross-validation: aggregations checked against pre-computed benchmarks'],
          },
          {
            layer: 'Layer 3 — Scope Enforcement',
            icon: Target,
            desc: 'The system enforces strict boundaries on what it will and won\'t answer, making scope creep impossible.',
            items: ['Intent taxonomy is closed — unrecognized questions get "I can\'t answer that" + explanation of supported topics', 'No clinical recommendations ever — the system describes patterns, users decide', 'No speculative forecasting — only reports what the current filtered data shows', 'No comparative effectiveness claims between treatments'],
          },
        ].map((layer) => (
          <div key={layer.layer} className="rounded-lg border border-border/30 p-4 space-y-2">
            <div className="flex items-center gap-2">
              <layer.icon className="h-4 w-4 text-destructive" />
              <h4 className="text-xs font-bold text-foreground">{layer.layer}</h4>
            </div>
            <p className="text-[11px] text-muted-foreground">{layer.desc}</p>
            <ul className="space-y-1.5 pt-1">
              {layer.items.map((item, i) => (
                <li key={i} className="flex gap-2 text-[11px] text-muted-foreground">
                  <Shield className="h-3 w-3 text-destructive/60 shrink-0 mt-0.5" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {/* Severity-tagged principles */}
      <div className="space-y-2">
        <h4 className="text-xs font-bold text-foreground">Safety Principles — By Severity</h4>
        {[
          { principle: 'No Clinical Recommendations', desc: 'The AI never suggests treatment changes, dosing adjustments, or clinical actions. It reports patterns — clinicians decide.', severity: 'Critical' as const },
          { principle: 'Anti-Hallucination by Design', desc: 'Rule-based architecture eliminates the possibility of fabricated statistics. Every number is a verifiable aggregation.', severity: 'Critical' as const },
          { principle: 'No PHI Ingestion', desc: 'The system is architecturally incapable of processing real patient data. Synthetic data is generated client-side with no external data connections.', severity: 'Critical' as const },
          { principle: 'Small-Cell Suppression', desc: 'Patient counts below 11 are masked to prevent re-identification. This follows CMS cell suppression standards.', severity: 'High' as const },
          { principle: 'Audit Trail', desc: 'Every AI response can be decomposed into: (1) the intent matched, (2) the aggregation performed, (3) the template used. Full reproducibility.', severity: 'High' as const },
          { principle: 'Bias Monitoring', desc: 'Synthetic distributions are checked against published demographic baselines to prevent over- or under-representation of populations.', severity: 'Medium' as const },
        ].map((item) => (
          <div key={item.principle} className="flex gap-3 p-3 rounded-lg border border-border/30">
            <Badge variant={item.severity === 'Critical' ? 'destructive' : item.severity === 'High' ? 'default' : 'secondary'} className="text-[9px] h-5 shrink-0 mt-0.5">
              {item.severity}
            </Badge>
            <div>
              <p className="text-xs font-semibold text-foreground">{item.principle}</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">{item.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </TabsContent>
  </Tabs>
);

/* ────────── 3 · ROADMAPPING ────────── */
const TRACK_COLORS: Record<string, { bg: string; text: string; dot: string }> = {
  Engineering: { bg: 'bg-blue-500/10', text: 'text-blue-600', dot: 'bg-blue-500' },
  Product: { bg: 'bg-violet-500/10', text: 'text-violet-600', dot: 'bg-violet-500' },
  QA: { bg: 'bg-amber-500/10', text: 'text-amber-600', dot: 'bg-amber-500' },
  Deploy: { bg: 'bg-emerald-500/10', text: 'text-emerald-600', dot: 'bg-emerald-500' },
  Feedback: { bg: 'bg-rose-500/10', text: 'text-rose-600', dot: 'bg-rose-500' },
};

const RoadmappingContent = () => {
  const [activeMonth, setActiveMonth] = useState<string>('Apr 2026');

  const timeline = [
    {
      month: 'Jan 2026', phase: 'Foundation', color: 'bg-blue-500', borderColor: 'border-blue-500',
      tracks: [
        { track: 'Engineering', items: ['Scaffold React/TypeScript project', 'Build synthetic data engine (Weibull + seeded RNG)', 'Implement CSV data service layer'] },
        { track: 'Product', items: ['Define PRD for GLP-1 module', 'Map metric tree (North Star → leading/lagging)', 'Stakeholder interview synthesis'] },
        { track: 'QA', items: ['Unit test harness setup', 'Data validation scripts for synthetic output', 'Cross-browser baseline'] },
      ],
    },
    {
      month: 'Feb 2026', phase: 'GLP-1 Module', color: 'bg-indigo-500', borderColor: 'border-indigo-500',
      tracks: [
        { track: 'Engineering', items: ['KPI cards + persistence curves', 'Payer & brand mix charts', 'US geographic heatmap', 'Global filter bar (date, payer, brand)'] },
        { track: 'Product', items: ['Event taxonomy definition', 'Data model documentation', 'Trust badge + suppression system design'] },
        { track: 'QA', items: ['Filter combination testing (4×4×5 matrix)', 'Responsive breakpoint verification', 'Performance profiling (<2s initial load)'] },
      ],
    },
    {
      month: 'Mar 2026', phase: 'AI + Polish', color: 'bg-purple-500', borderColor: 'border-purple-500',
      tracks: [
        { track: 'Engineering', items: ['Rule-based AI Q&A engine', 'PPT export functionality', 'Info panel + data provenance section', 'World switcher (3 therapeutic areas)'] },
        { track: 'Product', items: ['AI safety framework documentation', 'Experiment plan for confidence scoring', 'Release notes v1.0'] },
        { track: 'QA', items: ['AI response accuracy audit (50 query test suite)', 'Suppression edge cases', 'Accessibility pass (WCAG 2.1 AA)'] },
        { track: 'Deploy', items: ['Production deployment', 'Analytics instrumentation', 'Feedback collection mechanism'] },
      ],
    },
    {
      month: 'Apr 2026', phase: 'NSCLC Module', color: 'bg-orange-500', borderColor: 'border-orange-500',
      tracks: [
        { track: 'Engineering', items: ['Biomarker testing funnel visualization', 'Line-of-therapy Sankey diagram', 'Treatment sequencing engine'] },
        { track: 'Product', items: ['NSCLC PRD + metric tree', 'Oncology stakeholder validation', 'Cross-module consistency review'] },
        { track: 'QA', items: ['Synthetic NSCLC data validation against SEER benchmarks', 'Module switching regression tests'] },
      ],
    },
    {
      month: 'May 2026', phase: 'Alzheimer Module', color: 'bg-emerald-500', borderColor: 'border-emerald-500',
      tracks: [
        { track: 'Engineering', items: ['Diagnostic journey timeline visualization', 'Specialist referral network graph', 'Time-to-diagnosis distribution charts'] },
        { track: 'Product', items: ['Alzheimer PRD + metric tree', 'Neuroscience stakeholder validation', 'Platform architecture documentation'] },
        { track: 'QA', items: ['End-to-end cross-module testing', 'Load testing at 100K patients × 3 worlds'] },
      ],
    },
    {
      month: 'Jun 2026', phase: 'Platform Maturity', color: 'bg-rose-500', borderColor: 'border-rose-500',
      tracks: [
        { track: 'Engineering', items: ['Data Trust Layer implementation', 'Cross-module comparison dashboards', 'API documentation + SDK stub'] },
        { track: 'Product', items: ['Portfolio case study writeup', 'ROI framework for enterprise positioning', 'V2 roadmap planning'] },
        { track: 'QA', items: ['Full regression suite (automated)', 'Performance budget enforcement', 'Security review + HIPAA readiness assessment'] },
        { track: 'Feedback', items: ['User testing sessions (n=5)', 'NPS baseline measurement', 'Iteration backlog prioritization'] },
      ],
    },
  ];

  return (
    <div className="space-y-4">
      <div className="rounded-xl bg-accent/30 border border-border/50 p-4 space-y-2">
        <h4 className="text-sm font-bold text-foreground">Jan 2026 → Jun 2026 · 6-Month Build Plan</h4>
        <p className="text-xs text-muted-foreground">Click any month to expand the full breakdown by engineering, product, QA, and deployment tracks.</p>
      </div>

      {/* Color legend */}
      <div className="flex flex-wrap gap-3 px-1">
        {Object.entries(TRACK_COLORS).map(([track, colors]) => (
          <div key={track} className="flex items-center gap-1.5">
            <div className={`h-2.5 w-2.5 rounded-full ${colors.dot}`} />
            <span className={`text-[10px] font-semibold ${colors.text}`}>{track}</span>
          </div>
        ))}
      </div>

      {/* Timeline bar */}
      <div className="flex gap-1.5">
        {timeline.map((t) => (
          <button
            key={t.month}
            onClick={() => setActiveMonth(activeMonth === t.month ? '' : t.month)}
            className={`flex-1 rounded-xl p-3 text-center transition-all border-2 ${activeMonth === t.month ? `${t.borderColor} bg-accent/40 shadow-md` : 'border-border/40 hover:border-primary/30 hover:bg-accent/20'}`}
          >
            <div className={`h-2.5 w-2.5 rounded-full ${t.color} mx-auto mb-1.5`} />
            <p className="text-[10px] font-bold text-foreground">{t.month.split(' ')[0]}</p>
            <p className="text-[9px] text-muted-foreground leading-tight mt-0.5">{t.phase}</p>
          </button>
        ))}
      </div>

      {/* Expanded month detail */}
      <AnimatePresence mode="wait">
        {activeMonth && (() => {
          const month = timeline.find(t => t.month === activeMonth)!;
          return (
            <motion.div key={activeMonth} {...fadeIn} className={`rounded-xl border-2 ${month.borderColor} bg-card p-5 space-y-4`}>
              <div className="flex items-center gap-3">
                <div className={`h-3.5 w-3.5 rounded-full ${month.color}`} />
                <h4 className="text-base font-bold text-foreground">{month.month} — {month.phase}</h4>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {month.tracks.map((track) => {
                  const colors = TRACK_COLORS[track.track] || TRACK_COLORS.Engineering;
                  return (
                    <div key={track.track} className={`rounded-xl border border-border/30 p-4 space-y-2.5 ${colors.bg}`}>
                      <div className="flex items-center gap-2">
                        <div className={`h-2 w-2 rounded-full ${colors.dot}`} />
                        <p className={`text-[11px] font-bold uppercase tracking-wider ${colors.text}`}>{track.track}</p>
                      </div>
                      <ul className="space-y-2">
                        {track.items.map((item, i) => (
                          <li key={i} className="flex gap-2 text-[11px] text-foreground/80">
                            <CheckCircle2 className={`h-3.5 w-3.5 ${colors.text} shrink-0 mt-0.5 opacity-70`} />
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          );
        })()}
      </AnimatePresence>

      {/* Methodology callout */}
      <div className="rounded-xl bg-muted/40 border border-border/30 p-4 space-y-1.5">
        <p className="text-xs font-semibold text-foreground">Roadmapping Methodology</p>
        <p className="text-[11px] text-muted-foreground leading-relaxed">Two-week sprint cadence with weekly stakeholder demos. Each module follows a consistent lifecycle: <strong className="text-foreground">Define → Build → Test → Deploy → Measure → Iterate</strong>. Feedback cycles are embedded, not bolted on.</p>
      </div>
    </div>
  );
};

/* ────────── 4 · STAKEHOLDER EMPATHY ────────── */
const StakeholderEmpathyContent = () => (
  <Tabs defaultValue="research" className="w-full">
    <TabsList className="w-full grid grid-cols-3 mb-4">
      <TabsTrigger value="research" className="text-xs">Research</TabsTrigger>
      <TabsTrigger value="synthesis" className="text-xs">Synthesis</TabsTrigger>
      <TabsTrigger value="intersection" className="text-xs">The Intersection</TabsTrigger>
    </TabsList>

    <TabsContent value="research" className="space-y-4">
      <div className="rounded-xl bg-accent/30 border border-border/50 p-4">
        <div className="flex items-center gap-6">
          <div className="text-center">
            <p className="text-3xl font-extrabold text-primary">12</p>
            <p className="text-[10px] text-muted-foreground font-semibold">Interviews</p>
          </div>
          <Separator orientation="vertical" className="h-12" />
          <div className="text-center">
            <p className="text-3xl font-extrabold text-primary">3</p>
            <p className="text-[10px] text-muted-foreground font-semibold">Surveys</p>
          </div>
          <Separator orientation="vertical" className="h-12" />
          <div className="text-center">
            <p className="text-3xl font-extrabold text-primary">4</p>
            <p className="text-[10px] text-muted-foreground font-semibold">Personas</p>
          </div>
          <Separator orientation="vertical" className="h-12" />
          <div className="text-center">
            <p className="text-3xl font-extrabold text-primary">47</p>
            <p className="text-[10px] text-muted-foreground font-semibold">Data Points</p>
          </div>
        </div>
      </div>

      <h4 className="text-xs font-bold text-foreground">Survey Breakdown</h4>
      {[
        { survey: 'Brand Team Needs Assessment (n=15)', focus: 'What metrics do brand managers actually check weekly?', finding: '78% said persistence rate, but only 30% had a self-service tool for it' },
        { survey: 'Payer Strategist Workflow Audit (n=8)', focus: 'Where do access barriers show up in your current analytics?', finding: 'Prior auth impact was the #1 blind spot — no one had denial-to-abandonment tracking' },
        { survey: 'Medical Affairs Data Trust Survey (n=12)', focus: 'How much do you trust the data underlying your decisions?', finding: '65% said they couldn\'t distinguish observed vs. modeled metrics in current tools' },
      ].map((s) => (
        <div key={s.survey} className="rounded-xl border border-border/40 p-4 space-y-2">
          <h4 className="text-xs font-semibold text-foreground">{s.survey}</h4>
          <p className="text-[11px] text-muted-foreground"><strong className="text-foreground">Focus:</strong> {s.focus}</p>
          <p className="text-[11px] text-muted-foreground"><strong className="text-foreground">Key Finding:</strong> {s.finding}</p>
        </div>
      ))}
    </TabsContent>

    <TabsContent value="synthesis" className="space-y-4">
      <h4 className="text-xs font-bold text-foreground">What We Heard</h4>
      <div className="space-y-3">
        {[
          { persona: 'Brand Manager', need: '"I need to see persistence trends without waiting 3 weeks for an ad-hoc data pull"', priority: 'Self-service, real-time filters, exportable visuals' },
          { persona: 'Medical Affairs Lead', need: '"I can\'t present data I don\'t trust — show me what\'s real vs. estimated"', priority: 'Data provenance, confidence scores, methodology transparency' },
          { persona: 'Payer Strategist', need: '"Show me which access barriers actually cause patients to abandon therapy"', priority: 'Prior auth impact, formulary coverage → fill rate conversion' },
          { persona: 'Analytics Engineer', need: '"I need to extend this to new TAs without rebuilding the data pipeline"', priority: 'Modular architecture, standardized schemas, world-switching' },
        ].map((p) => (
          <div key={p.persona} className="rounded-xl border border-border/40 p-4 space-y-2 hover:border-primary/20 transition-colors">
            <div className="flex items-center gap-2">
              <Users className="h-3.5 w-3.5 text-primary" />
              <h4 className="text-xs font-bold text-foreground">{p.persona}</h4>
            </div>
            <p className="text-xs text-muted-foreground italic">{p.need}</p>
            <p className="text-[11px] text-primary/70 font-medium">{p.priority}</p>
          </div>
        ))}
      </div>
    </TabsContent>

    <TabsContent value="intersection" className="space-y-4">
      <div className="rounded-xl bg-primary/5 border border-primary/20 p-4 space-y-3">
        <h4 className="text-sm font-bold text-foreground">The Product Lives at the Intersection</h4>
        <p className="text-xs text-muted-foreground leading-relaxed">
          We didn't build what any single stakeholder asked for. We built what emerged from the <strong className="text-foreground">overlap of all their needs</strong>.
        </p>
      </div>
      <div className="space-y-2">
        {[
          { intersection: 'Self-service persistence + data trust transparency', from: 'Brand Manager × Medical Affairs', built: 'Persistence curves with Observed/Inferred badges and confidence scores' },
          { intersection: 'Payer impact visibility + exportable evidence', from: 'Payer Strategist × Brand Manager', built: 'Drop-off by payer with PPT export for formulary negotiations' },
          { intersection: 'Modular architecture + methodology rigor', from: 'Analytics Engineer × Medical Affairs', built: 'World-switching engine with full data provenance documentation' },
          { intersection: 'AI answers + safety guardrails', from: 'All Stakeholders', built: 'Rule-based AI with suppression, confidence scoring, and no clinical recommendations' },
        ].map((item) => (
          <div key={item.intersection} className="rounded-xl border border-border/40 p-4 space-y-2">
            <div className="flex items-center gap-2">
              <Lightbulb className="h-3.5 w-3.5 text-primary" />
              <h4 className="text-xs font-bold text-foreground">{item.intersection}</h4>
            </div>
            <p className="text-[10px] text-muted-foreground">From: {item.from}</p>
            <div className="flex items-center gap-2 pt-1">
              <ArrowRight className="h-3 w-3 text-primary" />
              <p className="text-[11px] text-foreground font-medium">{item.built}</p>
            </div>
          </div>
        ))}
      </div>
    </TabsContent>
  </Tabs>
);

/* ────────── 5 · TECHNICAL FLUENCY ────────── */
const TechnicalFluencyContent = () => (
  <Tabs defaultValue="stack" className="w-full">
    <TabsList className="w-full grid grid-cols-3 mb-4">
      <TabsTrigger value="stack" className="text-xs">Tech Stack</TabsTrigger>
      <TabsTrigger value="architecture" className="text-xs">Architecture</TabsTrigger>
      <TabsTrigger value="decisions" className="text-xs">Key Decisions</TabsTrigger>
    </TabsList>

    <TabsContent value="stack" className="space-y-4">
      <h4 className="text-xs font-bold text-foreground">Core Technologies</h4>
      <div className="grid grid-cols-2 gap-3">
        {[
          { category: 'Frontend', tools: ['React 18', 'TypeScript', 'Tailwind CSS', 'Framer Motion'], icon: Code2 },
          { category: 'Data Visualization', tools: ['Recharts', 'React Simple Maps', 'Custom SVG layers'], icon: BarChart3 },
          { category: 'Data Layer', tools: ['Synthetic engine (Weibull + RNG)', 'CSV pipeline', 'Client-side aggregation'], icon: Database },
          { category: 'Build & Deploy', tools: ['Vite', 'ESLint', 'Vitest', 'CI/CD pipeline'], icon: Rocket },
          { category: 'State Management', tools: ['React Context (World Switcher)', 'React Query (caching)', 'URL-driven filters'], icon: GitBranch },
          { category: 'Export & Reporting', tools: ['PptxGenJS', 'Client-side PDF', 'Structured data export'], icon: Layers },
        ].map((cat) => (
          <div key={cat.category} className="rounded-xl border border-border/40 p-4 space-y-2">
            <div className="flex items-center gap-2">
              <cat.icon className="h-4 w-4 text-primary" />
              <h4 className="text-xs font-bold text-foreground">{cat.category}</h4>
            </div>
            <ul className="space-y-1">
              {cat.tools.map((tool) => (
                <li key={tool} className="text-[11px] text-muted-foreground flex gap-1.5 items-center">
                  <span className="h-1 w-1 rounded-full bg-primary/50" />{tool}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </TabsContent>

    <TabsContent value="architecture" className="space-y-4">
      <div className="rounded-xl bg-accent/30 border border-border/50 p-4 space-y-3">
        <h4 className="text-sm font-bold text-foreground">System Architecture</h4>
        <p className="text-xs text-muted-foreground">The platform follows a layered architecture separating data generation, business logic, and presentation.</p>
      </div>

      <div className="space-y-2">
        {[
          { layer: 'Presentation Layer', desc: 'React components, Recharts visualizations, responsive layouts', items: ['Dashboard page', 'KPI cards', 'Interactive charts', 'Filter bar', 'AI chatbot panel'] },
          { layer: 'Business Logic Layer', desc: 'Data processing, aggregation, and insight generation', items: ['Cohort builder', 'Persistence engine (Weibull)', 'Insight generator', 'Suppression logic (n<11)'] },
          { layer: 'Data Layer', desc: 'Synthetic data generation and CSV pipeline', items: ['Seeded RNG generator', 'World-specific configs', 'CSV data service', 'Geographic distribution engine'] },
          { layer: 'Infrastructure', desc: 'Build tools, testing, and deployment', items: ['Vite bundler', 'Vitest unit tests', 'TypeScript strict mode', 'CI/CD automated deployment'] },
        ].map((layer, i) => (
          <div key={layer.layer} className="rounded-xl border border-border/40 p-4 space-y-2">
            <div className="flex items-center gap-2">
              <div className="flex items-center justify-center w-6 h-6 rounded bg-primary/10 text-xs font-bold text-primary">{i + 1}</div>
              <div>
                <h4 className="text-xs font-bold text-foreground">{layer.layer}</h4>
                <p className="text-[10px] text-muted-foreground">{layer.desc}</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-1.5 pl-8">
              {layer.items.map((item) => (
                <Badge key={item} variant="secondary" className="text-[9px]">{item}</Badge>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="rounded-lg bg-muted/40 border border-border/30 p-3">
        <p className="text-[10px] text-muted-foreground"><strong className="text-foreground">Data flow:</strong> Synthetic Engine → CSV Service → Aggregation Layer → React Components → User Interaction → Filter State → Re-aggregation → Updated Visualization</p>
      </div>
    </TabsContent>

    <TabsContent value="decisions" className="space-y-4">
      <h4 className="text-xs font-bold text-foreground">Technical Decisions & Trade-offs</h4>
      {[
        { decision: 'Client-side data generation', tradeoff: 'vs. API-backed database', reasoning: 'Eliminates backend dependency, enables offline use, and proves the synthetic engine works without infrastructure costs. Trade-off: limited to 100K patients before performance degrades.' },
        { decision: 'Rule-based AI over LLM', tradeoff: 'vs. GPT-4 / Claude API integration', reasoning: 'Reproducibility and auditability are paramount in healthcare. LLMs hallucinate; rule-based systems don\'t. Trade-off: less flexible natural language understanding.' },
        { decision: 'Recharts over D3.js', tradeoff: 'vs. full D3.js customization', reasoning: 'Recharts provides 90% of needed visualization with 20% of the code complexity. Trade-off: some custom chart types require workarounds.' },
        { decision: 'Context API over Redux', tradeoff: 'vs. Redux Toolkit', reasoning: 'The app has a shallow state tree (world, filters). Context is simpler and sufficient. Trade-off: would need migration if state complexity grows significantly.' },
        { decision: 'CSV pipeline over JSON API', tradeoff: 'vs. REST API endpoints', reasoning: 'CSVs are the lingua franca of healthcare data teams. Using them demonstrates real-world compatibility. Trade-off: parsing overhead on initial load.' },
      ].map((d) => (
        <div key={d.decision} className="rounded-xl border border-border/40 p-4 space-y-2 hover:border-primary/20 transition-colors">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-foreground">{d.decision}</h4>
            <Badge variant="outline" className="text-[9px]">{d.tradeoff}</Badge>
          </div>
          <p className="text-[11px] text-muted-foreground leading-relaxed">{d.reasoning}</p>
        </div>
      ))}
    </TabsContent>
  </Tabs>
);

/* ────────── CONTENT MAP ────────── */
const SKILL_CONTENT: Record<string, { title: string; description: string; content: React.ReactNode }> = {
  'Data Driven Decisions': {
    title: 'Data Driven Decisions',
    description: 'How we decided what to build, which modules come first, and why these 3 therapeutic spaces.',
    content: <DataDrivenContent />,
  },
  'AI Product Integration': {
    title: 'AI Product Integration',
    description: 'Model architecture, consumption limits, AI callouts, and healthcare AI safety principles.',
    content: <AIIntegrationContent />,
  },
  'Roadmapping': {
    title: 'Roadmapping',
    description: 'A 6-month timeline from Jan to Jun 2026 showing module-by-module build, test, and deploy cycles.',
    content: <RoadmappingContent />,
  },
  'Stakeholder Empathy': {
    title: 'Stakeholder Empathy',
    description: '12 interviews, 3 surveys, and the intersection of needs that shaped every product decision.',
    content: <StakeholderEmpathyContent />,
  },
  'Technical Fluency': {
    title: 'Technical Fluency',
    description: 'Tech stack, system architecture, and the key trade-off decisions behind the platform.',
    content: <TechnicalFluencyContent />,
  },
};

/* ────────── MAIN COMPONENT ────────── */
interface SkillPillarDialogProps {
  skillLabel: string;
  children: React.ReactNode;
}

const SkillPillarDialog = ({ skillLabel, children }: SkillPillarDialogProps) => {
  const skill = SKILL_CONTENT[skillLabel];
  if (!skill) return <>{children}</>;

  return (
    <Dialog>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto p-0">
        <DialogHeader className="sticky top-0 bg-background border-b px-6 py-4 z-10">
          <DialogTitle className="text-base font-bold">{skill.title}</DialogTitle>
          <DialogDescription className="text-xs">{skill.description}</DialogDescription>
        </DialogHeader>
        <div className="px-6 py-5">
          {skill.content}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SkillPillarDialog;
