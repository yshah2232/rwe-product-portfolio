import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { usePageTitle } from '@/hooks/usePageTitle';
import { track } from '@/lib/track';
import {
  ArrowRight,
  Search,
  Layers,
  ScatterChart,
  MapPin,
  FileText,
  CheckCircle2,
  Database,
  ShieldCheck,
  Stethoscope,
  Compass,
  HeartPulse,
  Microscope,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

const anim = (delay: number) => ({
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  transition: { delay, duration: 0.5, ease: [0.22, 1, 0.36, 1] as const },
});

const pillars = [
  {
    icon: Search,
    eyebrow: 'Capability 01',
    title: 'Search the registry',
    desc: 'Query ClinicalTrials.gov in plain language across condition, phase, status, sponsor, and geography. Semantic re-ranking — not just keyword match.',
    to: '/search-registry',
    live: true,
  },
  {
    icon: Layers,
    eyebrow: 'Capability 02',
    title: 'Build simple cohorts',
    desc: 'Save reusable trial cohorts by therapeutic area or program. Compare two cohorts side by side without rebuilding the query each time.',
  },
  {
    icon: ScatterChart,
    eyebrow: 'Capability 03',
    title: 'Diversity & access insights',
    desc: 'See enrollment composition, geographic reach, and access gaps relative to disease burden — surfaced as views, not as buried tables.',
  },
  {
    icon: MapPin,
    eyebrow: 'Capability 04',
    title: 'Prioritize sites',
    desc: 'Rank investigators and sites by historical participation, catchment diversity, and operational track record across prior trials.',
  },
  {
    icon: FileText,
    eyebrow: 'Capability 05',
    title: 'Transparent rationale',
    desc: 'Every recommendation comes with the registry IDs, fields, and assumptions used. Auditable diversity planning, not a black box.',
  },
];

const users = [
  {
    icon: Compass,
    role: 'Clinical Operations Lead',
    use: 'Stand up site lists faster with operational evidence baked in.',
  },
  {
    icon: Microscope,
    role: 'Feasibility Lead',
    use: 'Pressure-test enrollment assumptions against real registry footprint.',
  },
  {
    icon: HeartPulse,
    role: 'Diversity Strategy Lead',
    use: 'Quantify representation gaps and defend the plan with data.',
  },
  {
    icon: Stethoscope,
    role: 'Medical Affairs Lead',
    use: 'Map the trial landscape per indication for strategic positioning.',
  },
];

const Index = () => {
  const navigate = useNavigate();
  usePageTitle('Clinical Trial Diversity Studio — Equitable trial planning on real registry data');

  return (
    <div className="bg-background">
      {/* HERO */}
      <section className="relative px-6 md:px-10 lg:px-16 pt-20 md:pt-28 pb-20 md:pb-28 overflow-hidden">
        {/* subtle editorial backdrop */}
        <div className="absolute inset-0 -z-10 bg-gradient-to-b from-accent/40 via-background to-background" aria-hidden />
        <div
          className="absolute inset-x-0 top-0 -z-10 h-[1px] bg-gradient-to-r from-transparent via-border to-transparent"
          aria-hidden
        />

        <div className="max-w-5xl mx-auto text-center">
          <motion.p
            {...anim(0.05)}
            className="text-[11px] font-semibold tracking-[0.32em] uppercase text-primary/80 mb-7"
          >
            <span className="inline-flex items-center gap-2">
              <span className="h-[1px] w-6 bg-primary/60" />
              An RWE Product Concept
              <span className="h-[1px] w-6 bg-primary/60" />
            </span>
          </motion.p>

          <motion.h1
            {...anim(0.12)}
            className="font-display text-[44px] md:text-[64px] lg:text-[78px] font-medium leading-[1.02] tracking-[-0.02em] text-foreground"
          >
            Equitable trial planning,
            <br />
            <span className="italic text-primary font-normal">grounded in real registry data.</span>
          </motion.h1>

          <motion.p
            {...anim(0.22)}
            className="mt-8 md:mt-10 text-base md:text-[19px] text-muted-foreground leading-[1.7] max-w-3xl mx-auto font-normal"
          >
            <span className="font-semibold text-foreground">Clinical Trial Diversity Studio</span> helps pharma teams
            search ClinicalTrials.gov studies, build simple cohorts, view diversity and access insights, prioritize
            sites, and generate transparent rationale for diversity planning.
          </motion.p>

          <motion.div
            {...anim(0.32)}
            className="mt-10 md:mt-12 flex flex-col sm:flex-row items-center justify-center gap-3"
          >
            <Button
              size="lg"
              onClick={() => {
                track('cta_click', { location: 'hero_primary', target: '/clinical-trials' });
                navigate('/clinical-trials');
              }}
              className="gap-2 text-sm font-semibold shadow-md hover:shadow-lg transition-all w-full sm:w-auto"
            >
              Open the Clinical Trials studio <ArrowRight className="h-4 w-4" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={() => {
                track('cta_click', { location: 'hero_secondary', target: '/method' });
                navigate('/method');
              }}
              className="gap-2 text-sm font-semibold w-full sm:w-auto"
            >
              See the method
            </Button>
          </motion.div>

          <motion.div
            {...anim(0.42)}
            className="mt-10 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-muted-foreground"
          >
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="h-3.5 w-3.5 text-primary" /> Live ClinicalTrials.gov v2 API
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="h-3.5 w-3.5 text-primary" /> Real NCT IDs · real sites
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="h-3.5 w-3.5 text-primary" /> No PHI, no synthetic mockups
            </span>
          </motion.div>
        </div>
      </section>

      {/* CAPABILITY PILLARS */}
      <section className="px-6 md:px-10 lg:px-16 py-20 md:py-28 border-t border-border/50">
        <div className="max-w-6xl mx-auto">
          <motion.div {...anim(0.05)} className="max-w-2xl mb-14 md:mb-16">
            <p className="text-[11px] font-semibold tracking-[0.28em] uppercase text-primary/80 mb-4">
              The Studio
            </p>
            <h2 className="font-display text-3xl md:text-[44px] font-medium leading-[1.1] tracking-[-0.01em] text-foreground">
              Five capabilities, one workflow.
            </h2>
            <p className="mt-5 text-base text-muted-foreground leading-relaxed">
              Each capability is built directly against the public registry. No imported spreadsheets, no opaque scoring —
              every output is traceable back to the source field.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-px bg-border/60 border border-border/60 rounded-2xl overflow-hidden">
            {pillars.map((p, i) => {
              const isClickable = !!p.to;
              const content = (
                <>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center justify-center w-11 h-11 rounded-lg bg-accent">
                      <p.icon className="h-5 w-5 text-primary" strokeWidth={1.75} />
                    </div>
                    <div className="flex items-center gap-2">
                      {p.live && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-semibold tracking-wider uppercase">
                          <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
                          Live
                        </span>
                      )}
                      <span className="text-[10px] font-semibold tracking-[0.2em] uppercase text-muted-foreground/60">
                        {p.eyebrow}
                      </span>
                    </div>
                  </div>
                  <h3 className="font-display text-[22px] font-medium leading-snug text-foreground">{p.title}</h3>
                  <p className="text-[13.5px] text-muted-foreground leading-[1.65]">{p.desc}</p>
                  {isClickable && (
                    <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary mt-1">
                      Try it <ArrowRight className="h-3.5 w-3.5" />
                    </span>
                  )}
                </>
              );

              return isClickable ? (
                <motion.button
                  key={p.title}
                  {...anim(0.1 + i * 0.06)}
                  onClick={() => {
                    track('pillar_click', { pillar: p.title, target: p.to });
                    navigate(p.to!);
                  }}
                  className="bg-card p-7 md:p-8 flex flex-col gap-4 hover:bg-accent/40 transition-colors text-left cursor-pointer"
                >
                  {content}
                </motion.button>
              ) : (
                <motion.div
                  key={p.title}
                  {...anim(0.1 + i * 0.06)}
                  className="bg-card p-7 md:p-8 flex flex-col gap-4 hover:bg-accent/30 transition-colors"
                >
                  {content}
                </motion.div>
              );
            })}
            {/* filler tile to keep the grid clean on lg */}
            <motion.div
              {...anim(0.1 + pillars.length * 0.06)}
              className="bg-card p-7 md:p-8 flex flex-col justify-between gap-4 hidden lg:flex"
            >
              <div>
                <p className="text-[10px] font-semibold tracking-[0.2em] uppercase text-primary/70 mb-3">In motion</p>
                <h3 className="font-display text-[22px] font-medium leading-snug text-foreground">
                  Built as the registry grows.
                </h3>
                <p className="mt-3 text-[13.5px] text-muted-foreground leading-[1.65]">
                  Refreshed against the live ClinicalTrials.gov v2 API. New trials, sites, and amendments flow through
                  the same five capabilities — no re-engineering required.
                </p>
              </div>
              <button
                onClick={() => navigate('/clinical-trials')}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:gap-2.5 transition-all"
              >
                Tour the studio <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </motion.div>
          </div>
        </div>
      </section>

      {/* PRIMARY USERS STRIP */}
      <section className="px-6 md:px-10 lg:px-16 py-20 md:py-24 border-t border-border/50 bg-muted/30">
        <div className="max-w-6xl mx-auto">
          <motion.div {...anim(0.05)} className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-12">
            <div className="max-w-xl">
              <p className="text-[11px] font-semibold tracking-[0.28em] uppercase text-primary/80 mb-4">
                Built for the table that plans the trial
              </p>
              <h2 className="font-display text-3xl md:text-[40px] font-medium leading-[1.1] tracking-[-0.01em] text-foreground">
                Four leads. One source of truth.
              </h2>
            </div>
            <p className="text-sm text-muted-foreground max-w-sm leading-relaxed">
              Designed against the real workflows of clinical operations, feasibility, diversity strategy, and medical
              affairs leads — so the same evidence supports every decision.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {users.map((u, i) => (
              <motion.div
                key={u.role}
                {...anim(0.1 + i * 0.05)}
                className="rounded-xl border border-border/60 bg-card p-6 flex flex-col gap-3 hover:border-primary/40 transition-colors"
              >
                <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-accent">
                  <u.icon className="h-5 w-5 text-primary" strokeWidth={1.75} />
                </div>
                <p className="font-display text-[17px] font-medium text-foreground leading-snug">{u.role}</p>
                <p className="text-[13px] text-muted-foreground leading-relaxed">{u.use}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* LIVE DATA PROOF + CTA */}
      <section className="px-6 md:px-10 lg:px-16 py-20 md:py-28 border-t border-border/50">
        <div className="max-w-6xl mx-auto">
          <motion.div {...anim(0.05)} className="max-w-2xl mb-12">
            <p className="text-[11px] font-semibold tracking-[0.28em] uppercase text-primary/80 mb-4">Proof, not promises</p>
            <h2 className="font-display text-3xl md:text-[44px] font-medium leading-[1.1] tracking-[-0.01em] text-foreground">
              Connected to the public registry, in real time.
            </h2>
            <p className="mt-5 text-base text-muted-foreground leading-relaxed">
              Every study, sponsor, investigator, and location displayed in the studio is pulled live from the U.S.
              National Library of Medicine. No fabricated providers, no padded counts.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-px bg-border/60 border border-border/60 rounded-2xl overflow-hidden mb-10">
            <motion.div {...anim(0.1)} className="bg-card p-7 md:p-9">
              <Database className="h-5 w-5 text-primary mb-5" strokeWidth={1.75} />
              <p className="font-display text-[40px] md:text-[48px] font-medium leading-none tracking-tight text-foreground">
                500K+
              </p>
              <p className="mt-3 text-[13px] text-muted-foreground leading-relaxed">
                Studies in the ClinicalTrials.gov registry, queryable through the studio's live proxy.
              </p>
            </motion.div>
            <motion.div {...anim(0.16)} className="bg-card p-7 md:p-9">
              <ShieldCheck className="h-5 w-5 text-primary mb-5" strokeWidth={1.75} />
              <p className="font-display text-[40px] md:text-[48px] font-medium leading-none tracking-tight text-foreground">
                v2 API
              </p>
              <p className="mt-3 text-[13px] text-muted-foreground leading-relaxed">
                Official REST endpoint, fetched server-side via an edge function with 1-hour caching for performance.
              </p>
            </motion.div>
            <motion.div {...anim(0.22)} className="bg-card p-7 md:p-9">
              <ScatterChart className="h-5 w-5 text-primary mb-5" strokeWidth={1.75} />
              <p className="font-display text-[40px] md:text-[48px] font-medium leading-none tracking-tight text-foreground">
                3 TAs
              </p>
              <p className="mt-3 text-[13px] text-muted-foreground leading-relaxed">
                Live cohorts seeded for GLP-1, NSCLC, and Alzheimer's — extensible to any condition the registry covers.
              </p>
            </motion.div>
          </div>

          <motion.div
            {...anim(0.28)}
            className="rounded-2xl border border-border/60 bg-card overflow-hidden"
          >
            <div className="p-7 md:p-10 flex flex-col md:flex-row items-start md:items-center gap-6 md:gap-10">
              <div className="flex-1 space-y-3">
                <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-primary/10 text-primary text-[11px] font-semibold tracking-wider uppercase">
                  <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
                  Live module
                </div>
                <h3 className="font-display text-2xl md:text-[32px] font-medium leading-tight tracking-[-0.01em] text-foreground">
                  Open the Clinical Trials studio
                </h3>
                <p className="text-sm md:text-base text-muted-foreground leading-relaxed max-w-xl">
                  Real NCT IDs, lead sponsors, principal investigators, and site locations across GLP-1, NSCLC, and
                  Alzheimer's — with diversity and access views layered on top.
                </p>
              </div>
              <Button
                size="lg"
                onClick={() => {
                  track('cta_click', { location: 'proof_cta', target: '/clinical-trials' });
                  navigate('/clinical-trials');
                }}
                className="shrink-0 gap-2 text-sm font-semibold shadow-md"
              >
                Enter the studio <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default Index;
