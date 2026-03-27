import { motion } from 'framer-motion';
import ArtifactDialog from '@/components/ArtifactDialog';
import SkillPillarDialog from '@/components/SkillPillarDialog';
import { useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  BarChart3,
  Sparkles,
  Map,
  Users,
  Brain,
  Lock,
  Shield,
  FileText,
  Layers,
  Activity,
  Target,
  Eye,
  TrendingUp,
  Stethoscope,
  FlaskConical,
  ExternalLink,
  CheckCircle2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

const pillars = [
  {
    icon: BarChart3,
    title: 'Measure what happened',
    desc: 'Claims data tells you who filled, who stopped, and when. This is the receipt, not the full story, but it is the most scalable starting point.',
  },
  {
    icon: Activity,
    title: 'Detect risk early',
    desc: 'Refill gaps, payer switches, and geographic cold spots are proxies for patient struggle. Catching them early changes outcomes.',
  },
  {
    icon: Eye,
    title: 'Explain what is known vs inferred',
    desc: 'Healthcare data is incomplete by design. Every metric should tell you whether it was observed directly or estimated, and how confident you should be.',
  },
];

const pmSkills = [
  { icon: BarChart3, label: 'Data Driven Decisions', detail: 'KPIs, persistence curves, and payer analytics from 8,000+ patient synthetic claims across 3 TAs' },
  { icon: Sparkles, label: 'AI Product Integration', detail: 'Rule based AI Q&A module trained on live cohort metrics with context awareness' },
  { icon: Map, label: 'Roadmapping', detail: 'Modular product roadmap spanning patient journey, market access, and HCP intelligence' },
  { icon: Users, label: 'Stakeholder Empathy', detail: 'Designed for brand managers, medical affairs leads, and payer strategists' },
  { icon: Brain, label: 'Technical Fluency', detail: 'End to end build using React, TypeScript, Recharts, and synthetic data pipelines' },
];

const modules = [
  {
    title: 'Persistency & Adherence Dashboard',
    status: 'live' as const,
    outcome: 'Monitor adoption, persistence, drop off, and payer mix across calibrated synthetic cohorts',
    user: 'Brand Manager, Medical Affairs Lead',
    metric: 'Persistence rate at 6 and 12 months',
    icon: BarChart3,
    route: '/dashboard',
  },
  {
    title: 'Patient Journey Analytics',
    status: 'live' as const,
    outcome: 'Show friction, stability, acceleration, and drop off risk across the treatment lifecycle',
    user: 'Patient Outcomes Lead',
    metric: 'Time to therapy initiation',
    icon: TrendingUp,
    route: '/journey-analytics',
  },
  {
    title: 'Market Access & Coverage Impact',
    status: 'roadmap' as const,
    outcome: 'Quantify access barriers by payer and policy, showing impact on time to start and abandonment',
    user: 'Payer Strategist',
    metric: 'Formulary coverage to fill rate',
    icon: Shield,
  },
  {
    title: 'HCP Prescribing Intelligence',
    status: 'roadmap' as const,
    outcome: 'Show who is driving prescribing change and where treatment escalates faster',
    user: 'Commercial Lead',
    metric: 'Prescriber concentration index',
    icon: Stethoscope,
  },
  {
    title: 'Clinical Trials & Conference Signals',
    status: 'roadmap' as const,
    outcome: 'Connect trial activity and conference signals to downstream utilization shifts',
    user: 'Medical Affairs, Strategy',
    metric: 'Signal to utilization lag',
    icon: FlaskConical,
  },
  {
    title: 'Data Trust Layer',
    status: 'roadmap' as const,
    outcome: 'Explain why healthcare data breaks and how the product handles it transparently',
    user: 'All stakeholders',
    metric: 'Data completeness and confidence score',
    icon: Layers,
  },
];

const artifacts = [
  { title: 'PRD Snapshot', desc: 'Problem, users, success metrics, and scope for the GLP 1 module' },
  { title: 'Metric Tree', desc: 'North star metric decomposed into leading and lagging indicators' },
  { title: 'Event Taxonomy', desc: 'Structured events for cohort filtering, persistence tracking, and exports' },
  { title: 'Data Model', desc: 'Entity relationships across patients, claims, brands, and payer segments' },
  { title: 'Experiment Plan', desc: 'Hypothesis, test design, and guardrail metrics for AI summary confidence' },
  { title: 'Release Notes', desc: 'Versioned changelog with feature flags and rollback criteria' },
];

const anim = (delay: number) => ({
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  transition: { delay, duration: 0.4 },
});

const Index = () => {
  const navigate = useNavigate();

  return (
    <div>
      {/* Hero */}
      <section className="px-6 md:px-10 lg:px-16 pt-16 md:pt-24 pb-16 md:pb-24">
        <div className="max-w-4xl">
          <motion.p {...anim(0.1)} className="text-xs font-semibold tracking-[0.3em] uppercase mb-5 text-primary">
            Real World Evidence Portfolio
          </motion.p>
          <motion.h1
            {...anim(0.2)}
            className="text-[36px] md:text-[52px] lg:text-[64px] font-extrabold leading-[1.08] tracking-tight text-foreground"
          >
            I build evidence products that turn
            <span className="text-primary"> fragmented healthcare data </span>
            into decisions.
          </motion.h1>
          <motion.p {...anim(0.3)} className="mt-6 text-base md:text-lg text-muted-foreground leading-relaxed max-w-2xl">
            Real world evidence means using data generated during routine care, not clinical trials, to understand how treatments actually perform. Claims data are the receipts of healthcare: who filled what, when they stopped, and what they paid. They are not the full story, but they are the most scalable starting point for building products that change decisions.
          </motion.p>
        </div>
      </section>

      {/* What I Build */}
      <section className="px-6 md:px-10 lg:px-16 pb-20">
        <motion.div {...anim(0.35)} className="flex items-baseline gap-4 mb-10">
          <h2 className="text-xl md:text-2xl font-bold text-foreground">What I build</h2>
          <div className="flex-1 border-t border-border/50" />
        </motion.div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {pillars.map((p, i) => (
            <motion.div
              key={p.title}
              {...anim(0.4 + i * 0.08)}
              className="rounded-2xl border border-border/50 bg-card p-6 md:p-8 space-y-4"
            >
              <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-accent">
                <p.icon className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-lg font-bold text-foreground">{p.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{p.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Proof not Promises */}
      <section className="px-6 md:px-10 lg:px-16 pb-20">
        <motion.div {...anim(0.5)} className="flex items-baseline gap-4 mb-10">
          <h2 className="text-xl md:text-2xl font-bold text-foreground">Proof, not promises</h2>
          <div className="flex-1 border-t border-border/50" />
        </motion.div>

        {/* Live module CTAs */}
        {modules.filter(m => m.status === 'live').map((mod, idx) => (
          <motion.div
            key={mod.title}
            {...anim(0.55 + idx * 0.08)}
            className="relative rounded-2xl overflow-hidden cursor-pointer group mb-6"
            onClick={() => navigate(mod.route!)}
            style={{
              background: idx === 0
                ? 'linear-gradient(135deg, hsl(262 70% 45%) 0%, hsl(262 60% 35%) 50%, hsl(262 50% 25%) 100%)'
                : 'linear-gradient(135deg, hsl(221 70% 45%) 0%, hsl(221 60% 35%) 50%, hsl(221 50% 25%) 100%)',
            }}
          >
            <div className="relative z-10 px-6 md:px-10 py-8 md:py-10 flex flex-col md:flex-row items-start md:items-center gap-6 md:gap-10">
              <div className="flex-1 space-y-3">
                <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-white/15 text-white/90 text-[11px] font-semibold tracking-wider uppercase">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Live
                </div>
                <h3 className="text-2xl md:text-3xl font-bold text-white leading-tight">
                  {mod.title}
                </h3>
                <p className="text-white/70 text-sm md:text-base leading-relaxed max-w-lg">
                  {mod.outcome}. Powered across GLP-1, NSCLC, and Alzheimer therapeutic areas.
                </p>
                <div className="pt-2 text-xs text-white/50 space-y-0.5">
                  <p><span className="text-white/70 font-medium">Primary user:</span> {mod.user}</p>
                  <p><span className="text-white/70 font-medium">Key metric:</span> {mod.metric}</p>
                </div>
              </div>
              <Button
                size="lg"
                className="shrink-0 gap-2 text-sm font-bold shadow-lg group-hover:scale-105 transition-transform bg-white text-foreground hover:bg-white/90"
              >
                Explore <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
            <div className="absolute top-0 right-0 w-[300px] h-[300px] rounded-full opacity-15" style={{ background: 'radial-gradient(circle, hsl(262 80% 70%), transparent 70%)' }} />
          </motion.div>
        ))}

        {/* Roadmap cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {modules.filter(m => m.status === 'roadmap').map((mod, i) => (
            <motion.div
              key={mod.title}
              {...anim(0.7 + i * 0.05)}
              className="rounded-xl border border-border/40 bg-muted/20 p-5 space-y-2 opacity-70"
            >
              <div className="flex items-center gap-2">
                <Lock className="h-3.5 w-3.5 text-muted-foreground/50" />
                <span className="text-[10px] font-semibold tracking-wider uppercase text-muted-foreground/60">
                  {mod.title === 'Data Trust Layer' ? 'Trust Layer' : 'Roadmap'}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <mod.icon className="h-4 w-4 text-muted-foreground/60" />
                <h4 className="text-sm font-semibold text-muted-foreground">{mod.title}</h4>
              </div>
              <p className="text-xs text-muted-foreground/60 leading-relaxed">{mod.outcome}</p>
              <p className="text-[10px] text-muted-foreground/40"><span className="font-medium">User:</span> {mod.user}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* PM Skills */}
      <section className="px-6 md:px-10 lg:px-16 pb-20">
        <motion.div {...anim(0.65)} className="flex items-baseline gap-4 mb-10">
          <h2 className="text-xl md:text-2xl font-bold text-foreground">Skills demonstrated</h2>
          <div className="flex-1 border-t border-border/50" />
        </motion.div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          {pmSkills.map((skill, i) => (
            <SkillPillarDialog key={skill.label} skillLabel={skill.label}>
              <motion.div
                {...anim(0.7 + i * 0.05)}
                className="rounded-xl border border-border/40 bg-card p-4 space-y-3 hover:border-primary/30 hover:bg-accent/30 transition-all duration-200 cursor-pointer group"
              >
                <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-accent">
                  <skill.icon className="h-5 w-5 text-primary" />
                </div>
                <h4 className="text-xs font-bold text-foreground">{skill.label}</h4>
                <p className="text-[11px] text-muted-foreground leading-relaxed">{skill.detail}</p>
                <span className="text-[9px] font-semibold text-primary/50 group-hover:text-primary transition-colors">Click to explore →</span>
              </motion.div>
            </SkillPillarDialog>
          ))}
        </div>
      </section>

      {/* Data Provenance */}
      <section className="px-6 md:px-10 lg:px-16 pb-20">
        <motion.div {...anim(0.75)} className="flex items-baseline gap-4 mb-10">
          <h2 className="text-xl md:text-2xl font-bold text-foreground">How the data was created</h2>
          <div className="flex-1 border-t border-border/50" />
        </motion.div>

        <motion.div {...anim(0.8)} className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="rounded-2xl border border-primary/20 bg-accent/30 p-6 md:p-8 space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10">
                <Sparkles className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-foreground">AI Powered Synthetic Generation</h3>
                <p className="text-[11px] text-muted-foreground">The core differentiator</p>
              </div>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              The entire 100K patient cohort was synthetically modeled using AI driven statistical generation. Discontinuation patterns follow
              <strong className="text-foreground"> modified Weibull survival curves</strong> calibrated against 12 month adherence benchmarks. No real patient data exists anywhere in this product.
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-2">
              {[
                { value: '100K', label: 'Patients' },
                { value: '5', label: 'GLP 1 brands' },
                { value: '4', label: 'Payer segments' },
                { value: '50', label: 'US states' },
              ].map((stat) => (
                <div key={stat.label} className="text-center py-2 rounded-lg bg-primary/5 border border-primary/10">
                  <span className="block text-lg font-extrabold text-primary">{stat.value}</span>
                  <span className="text-[10px] text-muted-foreground">{stat.label}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-border/50 bg-card p-6 md:p-8 space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-muted">
                <ExternalLink className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-foreground">Calibration Sources</h3>
                <p className="text-[11px] text-muted-foreground">Published, peer reviewed data</p>
              </div>
            </div>
            <ul className="space-y-3">
              {[
                { label: 'Trujillo et al. (2020)', url: 'https://pubmed.ncbi.nlm.nih.gov/31415751/', desc: 'GLP 1 RA persistence patterns over 12 months' },
                { label: 'Blonde et al. (2018)', url: 'https://pubmed.ncbi.nlm.nih.gov/29907969/', desc: 'Adherence and discontinuation in Type 2 Diabetes' },
                { label: 'IQVIA Utilization Reports', url: 'https://www.iqvia.com/', desc: 'National prescription volume benchmarks' },
                { label: 'CMS Open Data', url: 'https://www.cms.gov/data-research', desc: 'Payer mix and geographic distribution baselines' },
              ].map((ref) => (
                <li key={ref.label} className="text-sm">
                  <a href={ref.url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline font-medium">{ref.label}</a>
                  <span className="text-muted-foreground"> — {ref.desc}</span>
                </li>
              ))}
            </ul>
          </div>
        </motion.div>
      </section>

      {/* Artifacts */}
      <section className="px-6 md:px-10 lg:px-16 pb-20">
        <motion.div {...anim(0.85)} className="flex items-baseline gap-4 mb-10">
          <h2 className="text-xl md:text-2xl font-bold text-foreground">Artifacts</h2>
          <span className="text-xs text-muted-foreground">Real PM outputs behind this product</span>
          <div className="flex-1 border-t border-border/50" />
        </motion.div>
        <motion.div {...anim(0.9)} className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {artifacts.map((a) => (
            <ArtifactDialog key={a.title} artifact={a}>
              <div className="rounded-xl border border-border/40 bg-card p-4 space-y-2 hover:border-primary/30 hover:shadow-md transition-all cursor-pointer group">
                <FileText className="h-4 w-4 text-primary/60 group-hover:text-primary transition-colors" />
                <h4 className="text-xs font-bold text-foreground">{a.title}</h4>
                <p className="text-[10px] text-muted-foreground leading-relaxed">{a.desc}</p>
                <span className="text-[9px] font-semibold text-primary/50 group-hover:text-primary transition-colors">Click to view →</span>
              </div>
            </ArtifactDialog>
          ))}
        </motion.div>
      </section>

      {/* Why this Matters */}
      <section className="px-6 md:px-10 lg:px-16 pb-20">
        <motion.div
          {...anim(0.95)}
          className="rounded-2xl border border-primary/15 bg-accent/20 p-8 md:p-12 max-w-3xl"
        >
          <h2 className="text-xl font-bold text-foreground mb-4">Why this matters</h2>
          <p className="text-sm md:text-base text-muted-foreground leading-relaxed">
            Most healthcare analytics stays locked in spreadsheets, decks, and dashboards nobody opens twice. This portfolio is a working product, not a presentation. It demonstrates the ability to take messy longitudinal data, turn it into something a brand team or payer strategist would actually use weekly, and build the infrastructure to make it trustworthy, maintainable, and scalable. That is the job of a product manager in this space.
          </p>
        </motion.div>
      </section>
    </div>
  );
};

export default Index;
