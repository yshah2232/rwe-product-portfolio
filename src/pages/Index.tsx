import { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useSeo } from '@/hooks/useSeo';
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
import { Input } from '@/components/ui/input';
import HeroIntentChips from '@/components/HeroIntentChips';
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
    desc: 'Query ClinicalTrials.gov in plain language across condition, phase, status, sponsor, and geography, with semantic reranking on top of keyword retrieval.',
    to: '/search-registry',
    status: 'live' as const,
  },
  {
    icon: Layers,
    title: 'Compare trials',
    desc: 'Compare two to four trial records by sponsor, phase, eligibility and locations. Download a report without saving anything.',
    to: '/compare-trials',
    status: 'live' as const,
  },
  {
    icon: ScatterChart,
    title: 'Geographic and population context',
    desc: 'Compare listed trial sites by state or region and view surrounding statewide population context from the US Census ACS. Population context is not trial enrollment data.',
    to: '/compare-trials',
    status: 'live' as const,
  },
  {
    icon: MapPin,
    title: 'Site prioritization',
    desc: 'Future exploration of site-level access and operational evidence. The current product does not recommend or rank sites.',
    status: 'planned' as const,
  },
  {
    icon: FileText,
    title: 'Source-grounded explanations',
    desc: 'Search explanations, registry fields and NCT source links show why a result matched and where its information came from.',
    to: '/search-registry',
    status: 'live' as const,
  },
];

const users = [
  { icon: Compass,    role: 'Clinical Operations Lead', use: 'Review where comparable trials list their sites, with links to each record.' },
  { icon: Microscope, role: 'Feasibility Lead',         use: 'Review the registry footprint of comparable trials for an indication.' },
  { icon: HeartPulse, role: 'Diversity Strategy Lead',  use: 'See where listed trial sites are, alongside statewide Census population context.' },
  { icon: Stethoscope,role: 'Medical Affairs Lead',     use: 'Map the trial landscape per indication for strategic positioning.' },
];

const Index = () => {
  const navigate = useNavigate();
  const { audience, plainMode, setPlainMode } = usePlainMode();
  const showPatientEntry = plainMode || audience === 'patient';
  const [heroQuery, setHeroQuery] = useState('');
  useSeo({
    title: 'Clinical Trial Diversity Studio | Search ClinicalTrials.gov',
    description: 'Search ClinicalTrials.gov in plain English and compare trial records with source grounded explanations.',
    canonical: '/',
  });

  const launchSearch = (q: string) => {
    const trimmed = q.trim();
    if (trimmed.length < 3) {
      // Still navigate, but without a prefilled query
      track('cta_click', { location: 'hero_search_empty', target: '/search-registry' });
      navigate('/search-registry');
      return;
    }
    track('cta_click', { location: 'hero_search', target: '/search-registry', q: trimmed });
    navigate(`/search-registry?q=${encodeURIComponent(trimmed)}`);
  };

  return (
    <div className="bg-background">
      {/* CTG.gov-style page hero band — two-column with analytical visual */}
      <section className="ctg-hero">
        <div className="ctg-hero-inner">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
            <div className="lg:col-span-7">
              <h1 className="ctg-hero-title">
                A trustworthy place to plan trials from real ClinicalTrials.gov data.
              </h1>
              <p className="mt-4 text-[16px] text-foreground/80 leading-[1.6] max-w-2xl">
                The Clinical Trial Diversity Studio turns the messy public registry into
                explainable searches and trial comparisons, with links to the original records.
              </p>

              {/* Inline live search — drives traffic straight into Search Registry */}
              <form
                onSubmit={(e) => { e.preventDefault(); launchSearch(heroQuery); }}
                className="mt-6 flex flex-col sm:flex-row gap-2 max-w-2xl"
              >
                <div className="relative flex-1">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    value={heroQuery}
                    onChange={(e) => setHeroQuery(e.target.value)}
                    placeholder="Try: GLP-1 weight loss with cardiovascular risk"
                    className="pl-10 h-12 text-[15px] bg-background border-primary/30"
                    maxLength={200}
                    aria-label="Search ClinicalTrials.gov"
                  />
                </div>
                <Button type="submit" size="lg" className="gap-2 h-12 px-6 rounded-sm font-semibold">
                  <Sparkles className="h-4 w-4" /> Search the Registry
                </Button>
              </form>
              <p className="mt-2 text-[12px] text-muted-foreground">
                Live ClinicalTrials.gov data · semantic reranking · every result links directly to CTG.gov
              </p>
              <HeroIntentChips />
            </div>

            {/* High-contrast capability facts */}
            <div className="hidden lg:block lg:col-span-5">
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                className="rounded-sm border border-primary bg-background shadow-md overflow-hidden"
              >
                <div className="px-6 py-3 bg-primary text-primary-foreground text-[11px] font-bold uppercase tracking-wider">
                  What you can do here
                </div>
                <dl className="divide-y divide-border">
                  {[
                    { k: '500K+', v: 'ClinicalTrials.gov records searchable', icon: Database },
                    { k: 'Live', v: 'ClinicalTrials.gov v2 API', icon: ShieldCheck },
                    { k: '2 to 4', v: 'Trials compared side by side', icon: Layers },
                    { k: 'State · Region', v: 'Trial site context by state and region', icon: MapPin },
                  ].map((f) => (
                    <div key={f.v} className="flex items-center gap-4 px-6 py-4">
                      <f.icon className="h-5 w-5 shrink-0 text-primary" strokeWidth={2} />
                      <div>
                        <dt className="text-[22px] font-bold leading-none text-primary">{f.k}</dt>
                        <dd className="mt-1 text-[14px] font-medium text-foreground">{f.v}</dd>
                      </div>
                    </div>
                  ))}
                </dl>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 md:px-6 py-8 md:py-10 space-y-10">
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
                  Not medical advice. Always confirm with a clinician.{' '}
                  <a href="/medical-disclaimer" className="gov-link">Medical Disclaimer</a>
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
              reranking and canonicalized sponsor / indication / asset names. Every result
              deep-links to CTG.gov.
            </p>
            <ul className="flex flex-wrap gap-x-5 gap-y-1.5 text-[13px] text-foreground/75 pt-1">
              <li className="flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4" style={{ color: 'hsl(var(--primary))' }} /> Live v2 API</li>
              <li className="flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4" style={{ color: 'hsl(var(--primary))' }} /> Semantic rerank · auditable rationale</li>
              <li className="flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4" style={{ color: 'hsl(var(--primary))' }} /> Compare trials and download a report</li>
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
              no opaque scoring, every output is traceable back to the source field.
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
                    {p.status === 'planned' ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-sm border border-border bg-muted text-[10px] font-bold tracking-wider uppercase text-muted-foreground">
                        Planned
                      </span>
                    ) : (
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
              affairs leads, so everyone reviews the same registry records.
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
                Registry records searchable through live ClinicalTrials.gov queries. The studio does not keep its own copy of the registry.
              </p>
            </div>
            <div className="ctg-panel p-5">
              <ShieldCheck className="h-5 w-5 mb-3" style={{ color: 'hsl(var(--primary))' }} strokeWidth={2} />
              <p className="text-[32px] font-bold leading-none" style={{ color: 'hsl(var(--primary))' }}>v2 API</p>
              <p className="mt-2 text-[13px] text-foreground/75 leading-relaxed">
                Official ClinicalTrials.gov REST endpoint, queried live for each search.
              </p>
            </div>
            <div className="ctg-panel p-5">
              <ScatterChart className="h-5 w-5 mb-3" style={{ color: 'hsl(var(--primary))' }} strokeWidth={2} />
              <p className="text-[32px] font-bold leading-none" style={{ color: 'hsl(var(--primary))' }}>Any condition</p>
              <p className="mt-2 text-[13px] text-foreground/75 leading-relaxed">
                Every search queries the full live registry. No pre-seeded datasets, no condition list to maintain.
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default Index;
