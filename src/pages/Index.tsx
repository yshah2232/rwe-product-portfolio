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
  AlertTriangle,
  HeartHandshake,
  Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { usePlainMode } from '@/contexts/PlainModeContext';

const anim = (delay: number) => ({
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  transition: { delay, duration: 0.4, ease: [0.22, 1, 0.36, 1] as const },
});

const pillars = [
  {
    icon: Search,
    title: 'Search the registry',
    desc: 'Query ClinicalTrials.gov in plain language across condition, phase, status, sponsor, and geography. Semantic re-ranking — not just keyword match.',
    to: '/search-registry',
    live: true,
  },
  {
    icon: Layers,
    title: 'Build canonical cohorts',
    desc: 'Save reusable trial cohorts by therapeutic area or program. Sponsor and indication strings are normalized so two cohorts can be compared apples-to-apples.',
    to: '/cohorts',
    live: true,
  },
  {
    icon: ScatterChart,
    title: 'Diversity & access insights',
    desc: 'See enrollment composition, geographic reach, and access gaps relative to disease burden — surfaced as views, not as buried tables.',
  },
  {
    icon: MapPin,
    title: 'Prioritize sites',
    desc: 'Rank investigators and sites by historical participation, catchment diversity, and operational track record across prior trials.',
  },
  {
    icon: FileText,
    title: 'Transparent rationale',
    desc: 'Every recommendation comes with the registry IDs, fields, and assumptions used. Auditable diversity planning, not a black box.',
  },
];

const users = [
  { icon: Compass,    role: 'Clinical Operations Lead', use: 'Stand up site lists faster with operational evidence baked in.' },
  { icon: Microscope, role: 'Feasibility Lead',         use: 'Pressure-test enrollment assumptions against real registry footprint.' },
  { icon: HeartPulse, role: 'Diversity Strategy Lead',  use: 'Quantify representation gaps and defend the plan with data.' },
  { icon: Stethoscope,role: 'Medical Affairs Lead',     use: 'Map the trial landscape per indication for strategic positioning.' },
];

const Index = () => {
  const navigate = useNavigate();
  const { audience, plainMode, setPlainMode } = usePlainMode();
  const showPatientEntry = plainMode || audience === 'patient';
  usePageTitle('Clinical Trial Diversity Studio — Equitable trial planning on real registry data');

  return (
    <div className="bg-background">
      {/* CTG.gov-style page hero band */}
      <section className="ctg-hero">
        <div className="ctg-hero-inner">
          <div className="max-w-4xl">
            <h1 className="ctg-hero-title">
              A trustworthy place to plan trials from real ClinicalTrials.gov data.
            </h1>
            <p className="mt-4 text-[16px] text-foreground/80 leading-[1.6] max-w-3xl">
              The Clinical Trial Diversity Studio turns the messy public registry into
              saved, explainable planning workflows — search studies, build canonical cohorts,
              evaluate diversity and access context, and prioritize sites.
            </p>
          </div>
        </div>
      </section>

      <div className="max-w-6xl mx-auto px-6 md:px-10 py-8 md:py-10 space-y-10">
        {/* Yellow gov-style disclaimer */}
        <div className="ctg-warning flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 mt-0.5 shrink-0" style={{ color: 'hsl(var(--warning-border))' }} />
          <div className="text-[14px] leading-relaxed text-foreground/85">
            <strong className="font-bold">This studio is a product capability demo.</strong>{' '}
            It does not review or endorse the safety or science of any trial listed.
            Every record links back to{' '}
            <a className="gov-link" href="https://clinicaltrials.gov/" target="_blank" rel="noopener noreferrer">
              ClinicalTrials.gov
            </a>{' '}
            for one-click verification.
          </div>
        </div>

        {/* For patients & families — only when audience=patient or plain mode is on */}
        {showPatientEntry && (
          <motion.section
            {...anim(0.04)}
            className="rounded-sm border-2 p-6 md:p-7"
            style={{
              borderColor: 'hsl(var(--primary) / 0.35)',
              background: 'linear-gradient(135deg, hsl(var(--accent)) 0%, hsl(var(--background)) 100%)',
            }}
          >
            <div className="flex flex-col md:flex-row md:items-center gap-5">
              <div className="flex items-center justify-center w-12 h-12 rounded-sm shrink-0" style={{ backgroundColor: 'hsl(var(--primary))' }}>
                <HeartHandshake className="h-6 w-6 text-white" strokeWidth={2} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="inline-flex items-center gap-1.5 text-[10.5px] font-bold uppercase tracking-wider mb-1.5" style={{ color: 'hsl(var(--primary))' }}>
                  <Sparkles className="h-3 w-3" /> For patients &amp; families
                </div>
                <h2 className="text-[20px] md:text-[22px] font-bold leading-tight" style={{ color: 'hsl(var(--primary))' }}>
                  Looking for a clinical trial you (or someone you love) might join?
                </h2>
                <p className="mt-2 text-[14px] text-foreground/80 leading-relaxed max-w-2xl">
                  Search the official registry in everyday words. We'll only show studies that are
                  <strong> currently recruiting</strong>, and rewrite each one in plain language so you
                  can understand what's involved before talking to a doctor.
                </p>
              </div>
              <div className="flex flex-col gap-2 shrink-0 md:min-w-[200px]">
                <Button
                  size="lg"
                  onClick={() => {
                    setPlainMode(true);
                    track('cta_click', { location: 'patient_entry', target: '/search-registry' });
                    navigate('/search-registry');
                  }}
                  className="gap-2 text-[14px] font-semibold rounded-sm"
                >
                  <Search className="h-4 w-4" /> Find a trial <ArrowRight className="h-4 w-4" />
                </Button>
                <p className="text-[10.5px] text-muted-foreground text-center leading-snug">
                  Not medical advice. Always confirm with a clinician.
                </p>
              </div>
            </div>
          </motion.section>
        )}
        <motion.section
          {...anim(0.05)}
          className="ctg-panel p-6 md:p-8 flex flex-col md:flex-row md:items-center gap-6"
        >
          <div className="flex-1 space-y-3">
            <div className="inline-flex items-center gap-2 text-[11px] font-bold tracking-wider uppercase" style={{ color: 'hsl(var(--primary))' }}>
              <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
              Hero capability · Live
            </div>
            <h2 className="text-[26px] md:text-[30px] font-bold leading-tight" style={{ color: 'hsl(var(--primary))' }}>
              Search the Registry
            </h2>
            <p className="text-[15px] text-foreground/80 leading-relaxed max-w-2xl">
              Plain-language search across the full ClinicalTrials.gov registry, with semantic
              re-ranking and canonicalized sponsor / indication / asset names. Every result
              deep-links to CTG.gov.
            </p>
            <ul className="flex flex-wrap gap-x-5 gap-y-1.5 text-[13px] text-foreground/75 pt-1">
              <li className="flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4" style={{ color: 'hsl(var(--primary))' }} /> Live v2 API</li>
              <li className="flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4" style={{ color: 'hsl(var(--primary))' }} /> Semantic re-rank · auditable rationale</li>
              <li className="flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4" style={{ color: 'hsl(var(--primary))' }} /> Save into a canonical cohort</li>
            </ul>
          </div>
          <div className="flex flex-col sm:flex-row md:flex-col gap-2.5 md:min-w-[220px]">
            <Button
              size="lg"
              onClick={() => {
                track('cta_click', { location: 'hero_primary', target: '/search-registry' });
                navigate('/search-registry');
              }}
              className="gap-2 text-[14px] font-semibold rounded-sm"
            >
              <Search className="h-4 w-4" /> Search the Registry <ArrowRight className="h-4 w-4" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={() => {
                track('cta_click', { location: 'hero_secondary', target: '/data-method' });
                navigate('/data-method');
              }}
              className="gap-2 text-[14px] font-semibold rounded-sm"
            >
              See how it works
            </Button>
          </div>
        </motion.section>

        {/* CAPABILITY PILLARS */}
        <section>
          <div className="mb-6">
            <h2 className="text-[22px] md:text-[26px] font-bold" style={{ color: 'hsl(var(--primary))' }}>
              Five capabilities, one workflow
            </h2>
            <p className="mt-2 text-[15px] text-foreground/75 max-w-3xl leading-relaxed">
              Each capability is built directly against the public registry. No imported spreadsheets,
              no opaque scoring — every output is traceable back to the source field.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {pillars.map((p, i) => {
              const isClickable = !!p.to;
              const inner = (
                <>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center justify-center w-10 h-10 rounded-sm bg-accent">
                      <p.icon className="h-5 w-5" style={{ color: 'hsl(var(--primary))' }} strokeWidth={2} />
                    </div>
                    {p.live && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-sm bg-primary/10 text-[10px] font-bold tracking-wider uppercase" style={{ color: 'hsl(var(--primary))' }}>
                        <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
                        Live
                      </span>
                    )}
                  </div>
                  <h3 className="text-[17px] font-bold leading-snug mb-1.5" style={{ color: 'hsl(var(--primary))' }}>{p.title}</h3>
                  <p className="text-[14px] text-foreground/75 leading-[1.55]">{p.desc}</p>
                  {isClickable && (
                    <span className="inline-flex items-center gap-1 text-[13px] font-semibold mt-3" style={{ color: 'hsl(var(--link))' }}>
                      Try it <ArrowRight className="h-3.5 w-3.5" />
                    </span>
                  )}
                </>
              );
              const className = 'ctg-panel p-5 text-left flex flex-col h-full hover:border-primary/60 transition-colors';
              return isClickable ? (
                <motion.button
                  key={p.title}
                  {...anim(0.05 + i * 0.04)}
                  onClick={() => {
                    track('pillar_click', { pillar: p.title, target: p.to });
                    navigate(p.to!);
                  }}
                  className={className + ' cursor-pointer'}
                >
                  {inner}
                </motion.button>
              ) : (
                <motion.div key={p.title} {...anim(0.05 + i * 0.04)} className={className}>
                  {inner}
                </motion.div>
              );
            })}
          </div>
        </section>

        {/* USERS */}
        <section>
          <div className="mb-6">
            <h2 className="text-[22px] md:text-[26px] font-bold" style={{ color: 'hsl(var(--primary))' }}>
              Built for the table that plans the trial
            </h2>
            <p className="mt-2 text-[15px] text-foreground/75 max-w-3xl leading-relaxed">
              Designed against the real workflows of clinical operations, feasibility, diversity strategy, and medical
              affairs leads — so the same evidence supports every decision.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {users.map((u, i) => (
              <motion.div
                key={u.role}
                {...anim(0.05 + i * 0.04)}
                className="ctg-panel p-5"
              >
                <div className="flex items-center justify-center w-10 h-10 rounded-sm bg-accent mb-3">
                  <u.icon className="h-5 w-5" style={{ color: 'hsl(var(--primary))' }} strokeWidth={2} />
                </div>
                <p className="text-[15px] font-bold leading-snug mb-1" style={{ color: 'hsl(var(--primary))' }}>{u.role}</p>
                <p className="text-[13px] text-foreground/75 leading-relaxed">{u.use}</p>
              </motion.div>
            ))}
          </div>
        </section>

        {/* PROOF */}
        <section>
          <div className="mb-6">
            <h2 className="text-[22px] md:text-[26px] font-bold" style={{ color: 'hsl(var(--primary))' }}>
              Connected to the public registry, in real time
            </h2>
            <p className="mt-2 text-[15px] text-foreground/75 max-w-3xl leading-relaxed">
              Every study, sponsor, investigator, and location displayed is pulled live from the U.S.
              National Library of Medicine. No fabricated providers, no padded counts.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="ctg-panel p-5">
              <Database className="h-5 w-5 mb-3" style={{ color: 'hsl(var(--primary))' }} strokeWidth={2} />
              <p className="text-[32px] font-bold leading-none" style={{ color: 'hsl(var(--primary))' }}>500K+</p>
              <p className="mt-2 text-[13px] text-foreground/75 leading-relaxed">
                Studies in the ClinicalTrials.gov registry, queryable through the studio's live proxy.
              </p>
            </div>
            <div className="ctg-panel p-5">
              <ShieldCheck className="h-5 w-5 mb-3" style={{ color: 'hsl(var(--primary))' }} strokeWidth={2} />
              <p className="text-[32px] font-bold leading-none" style={{ color: 'hsl(var(--primary))' }}>v2 API</p>
              <p className="mt-2 text-[13px] text-foreground/75 leading-relaxed">
                Official REST endpoint, fetched server-side via an edge function with 1-hour caching.
              </p>
            </div>
            <div className="ctg-panel p-5">
              <ScatterChart className="h-5 w-5 mb-3" style={{ color: 'hsl(var(--primary))' }} strokeWidth={2} />
              <p className="text-[32px] font-bold leading-none" style={{ color: 'hsl(var(--primary))' }}>3 TAs</p>
              <p className="mt-2 text-[13px] text-foreground/75 leading-relaxed">
                Live cohorts seeded for GLP-1, NSCLC, and Alzheimer's — extensible to any condition the registry covers.
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default Index;
