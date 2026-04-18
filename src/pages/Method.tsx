import { motion } from 'framer-motion';
import { ArrowDown, Database, Users, Filter, Activity, Brain, ShieldCheck, AlertTriangle } from 'lucide-react';
import { usePageTitle } from '@/hooks/usePageTitle';

const layers = [
  {
    layer: 'Foundation',
    label: 'Data Layer',
    color: 'border-blue-500/30 bg-blue-500/5',
    tagColor: 'bg-blue-500/10 text-blue-600',
    steps: [
      {
        icon: Database,
        title: 'Data Ingestion',
        subtitle: 'Claims · EHR · Hub/SP',
        bullets: [
          'Claims: who filled, when, what they paid, payer',
          'EHR: diagnoses, labs, encounters',
          'Hub/SP: enrollment, copay, adherence support',
        ],
        note: 'This product uses synthetic claims only',
      },
    ],
  },
  {
    layer: 'Step 1',
    label: 'Cohort Construction',
    color: 'border-violet-500/30 bg-violet-500/5',
    tagColor: 'bg-violet-500/10 text-violet-600',
    steps: [
      {
        icon: Users,
        title: 'Cohort Design',
        subtitle: 'Index event → inclusion/exclusion',
        bullets: [
          'Anchor every patient to their first fill (index date)',
          'Include: ≥1 fill in observation window, no prior history',
          'Changing the index window changes all downstream metrics',
        ],
        note: 'Rules drive every metric',
      },
    ],
  },
  {
    layer: 'Step 2',
    label: 'Analysis',
    color: 'border-emerald-500/30 bg-emerald-500/5',
    tagColor: 'bg-emerald-500/10 text-emerald-600',
    steps: [
      {
        icon: Filter,
        title: 'Line of Therapy Logic',
        subtitle: 'LOT assignment from gap & brand rules',
        bullets: [
          'Gap > expected refill + grace → new therapy line',
          'Brand change triggers LOT increment',
          'Distinguishes stop vs switch vs delay',
        ],
        note: 'Critical for persistence accuracy',
      },
      {
        icon: Activity,
        title: 'Risk Detection',
        subtitle: 'Claims proxies → early signals',
        bullets: [
          'Refill gap elongation → declining engagement',
          'Payer switch (commercial → cash) → discontinuation risk',
          'Geographic cold spots → access barriers',
        ],
        note: 'Proxies, not confirmed outcomes',
      },
    ],
  },
  {
    layer: 'Step 3',
    label: 'Inference',
    color: 'border-purple-500/30 bg-purple-500/5',
    tagColor: 'bg-purple-500/10 text-purple-600',
    steps: [
      {
        icon: Brain,
        title: 'Metric Computation & AI Features',
        subtitle: 'Observed vs inferred labeling',
        bullets: [
          'Every metric tagged: observed or inferred',
          'Confidence intervals on aggregated stats',
          'AI-driven summaries with context-aware Q&A',
          'Data freshness timestamp on every module',
        ],
        note: 'Trust is a product feature',
      },
    ],
  },
  {
    layer: 'Final Gate',
    label: 'Privacy & Governance',
    color: 'border-rose-500/30 bg-rose-500/5',
    tagColor: 'bg-rose-500/10 text-rose-600',
    steps: [
      {
        icon: ShieldCheck,
        title: 'Privacy & Governance',
        subtitle: 'Synthetic data · No PHI · Cell suppression',
        bullets: [
          '100% synthetic — no real patient data anywhere',
          'AI-driven generation calibrated to published RWE studies',
          'Any cell with < 11 records auto-suppressed',
        ],
        note: 'Applied before any data is shared or displayed',
      },
    ],
  },
];

const anim = (delay: number) => ({
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  transition: { delay, duration: 0.35 },
});

const Method = () => {
  usePageTitle('Method — How RWE Studio is built');
  return (
  <div className="max-w-3xl mx-auto px-6 md:px-10 py-12 md:py-16 space-y-10">
    <motion.div {...anim(0.1)}>
      <h1 className="text-3xl md:text-4xl font-extrabold text-foreground mb-3">How this suite works</h1>
      <p className="text-sm md:text-base text-muted-foreground max-w-2xl leading-relaxed">
        A layered pipeline: each step feeds the next. Raw data enters at the foundation, passes through construction, analysis, and inference, then clears a privacy gate before reaching the user.
      </p>
    </motion.div>

    {/* Layered flow */}
    <div className="space-y-0">
      {layers.map((layer, li) => (
        <div key={layer.label}>
          <motion.div
            {...anim(0.15 + li * 0.1)}
            className={`relative rounded-xl border p-5 md:p-6 ${layer.color}`}
          >
            {/* Layer tag */}
            <div className="flex items-center gap-3 mb-4">
              <span className={`text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full ${layer.tagColor}`}>
                {layer.layer}
              </span>
              <span className="text-sm font-bold text-foreground">{layer.label}</span>
            </div>

            {/* Steps within layer */}
            <div className={`space-y-4 ${layer.steps.length > 1 ? 'grid grid-cols-1 md:grid-cols-2 gap-4 space-y-0' : ''}`}>
              {layer.steps.map((step) => (
                <div key={step.title} className="rounded-lg border border-border/30 bg-background/60 p-4">
                  <div className="flex items-start gap-3">
                    <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-accent shrink-0">
                      <step.icon className="h-4 w-4 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline gap-2 flex-wrap">
                        <h3 className="text-sm font-bold text-foreground">{step.title}</h3>
                        <span className="text-[11px] text-muted-foreground">{step.subtitle}</span>
                      </div>
                      <ul className="mt-2 space-y-1">
                        {step.bullets.map((b, j) => (
                          <li key={j} className="flex gap-2 text-xs text-muted-foreground leading-relaxed">
                            <span className="h-1 w-1 rounded-full bg-primary mt-1.5 shrink-0" />
                            <span>{b}</span>
                          </li>
                        ))}
                      </ul>
                      {step.note && (
                        <div className="mt-2 flex items-center gap-1.5">
                          <AlertTriangle className="h-3 w-3 text-amber-500 shrink-0" />
                          <span className="text-[10px] text-amber-600 font-medium">{step.note}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Connector arrow between layers */}
          {li < layers.length - 1 && (
            <div className="flex justify-center py-1.5">
              <ArrowDown className="h-5 w-5 text-muted-foreground/30" />
            </div>
          )}
        </div>
      ))}
    </div>
  </div>
);

export default Method;
