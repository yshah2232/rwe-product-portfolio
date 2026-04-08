import { motion } from 'framer-motion';
import { ArrowDown, Database, Users, Filter, Activity, Brain, ShieldCheck, AlertTriangle } from 'lucide-react';

const steps = [
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
    color: 'bg-blue-500/10 text-blue-600',
  },
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
    color: 'bg-violet-500/10 text-violet-600',
  },
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
    color: 'bg-emerald-500/10 text-emerald-600',
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
    color: 'bg-amber-500/10 text-amber-600',
  },
  {
    icon: Brain,
    title: 'Metric Computation',
    subtitle: 'Observed vs inferred labeling',
    bullets: [
      'Every metric tagged: observed or inferred',
      'Confidence intervals on aggregated stats',
      'Data freshness timestamp on every module',
    ],
    note: 'Trust is a product feature',
    color: 'bg-purple-500/10 text-purple-600',
  },
  {
    icon: ShieldCheck,
    title: 'Privacy & Governance',
    subtitle: 'Synthetic data · No PHI · Cell suppression',
    bullets: [
      '100% synthetic — no real patient data anywhere',
      'AI-driven generation calibrated to published RWE studies',
      'Any cell with < 11 records auto-suppressed',
    ],
    note: 'Not a clinical tool',
    color: 'bg-rose-500/10 text-rose-600',
  },
];

const anim = (delay: number) => ({
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  transition: { delay, duration: 0.35 },
});

const Method = () => (
  <div className="max-w-3xl mx-auto px-6 md:px-10 py-12 md:py-16 space-y-10">
    <motion.div {...anim(0.1)}>
      <h1 className="text-3xl md:text-4xl font-extrabold text-foreground mb-3">How this suite works</h1>
      <p className="text-sm md:text-base text-muted-foreground max-w-2xl leading-relaxed">
        A visual pipeline of how raw healthcare data becomes trustworthy, actionable product metrics.
      </p>
    </motion.div>

    {/* Flow diagram */}
    <div className="space-y-0">
      {steps.map((step, i) => (
        <div key={step.title}>
          <motion.div
            {...anim(0.15 + i * 0.07)}
            className="relative rounded-xl border border-border/50 bg-card p-5 md:p-6"
          >
            <div className="flex items-start gap-4">
              {/* Icon */}
              <div className={`flex items-center justify-center w-11 h-11 rounded-xl shrink-0 ${step.color}`}>
                <step.icon className="h-5 w-5" />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-3 flex-wrap">
                  <h3 className="text-base font-bold text-foreground">{step.title}</h3>
                  <span className="text-xs text-muted-foreground font-medium">{step.subtitle}</span>
                </div>
                <ul className="mt-2 space-y-1">
                  {step.bullets.map((b, j) => (
                    <li key={j} className="flex gap-2 text-sm text-muted-foreground leading-relaxed">
                      <span className="h-1 w-1 rounded-full bg-primary mt-2 shrink-0" />
                      <span>{b}</span>
                    </li>
                  ))}
                </ul>
                {step.note && (
                  <div className="mt-3 flex items-center gap-2">
                    <AlertTriangle className="h-3 w-3 text-amber-500 shrink-0" />
                    <span className="text-[11px] text-amber-600 font-medium">{step.note}</span>
                  </div>
                )}
              </div>
            </div>
          </motion.div>

          {/* Connector arrow */}
          {i < steps.length - 1 && (
            <div className="flex justify-center py-1">
              <ArrowDown className="h-5 w-5 text-muted-foreground/30" />
            </div>
          )}
        </div>
      ))}
    </div>
  </div>
);

export default Method;
