import { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  Github,
  Linkedin,
  Lock,
  Brain,
  Map,
  BarChart3,
  Sparkles,
  Users,
  MessageCircle,
  X,
  Send,
  ExternalLink,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import AgentChatbot from '@/components/AgentChatbot';

const pmSkills = [
  {
    icon: BarChart3,
    label: 'Data Driven Decisions',
    detail: 'Built KPIs, persistence curves, and payer analytics from 100K patient synthetic claims',
  },
  {
    icon: Sparkles,
    label: 'AI Product Integration',
    detail: 'Embedded a rule based AI Q&A module trained on live cohort metrics with context awareness',
  },
  {
    icon: Map,
    label: 'Roadmapping',
    detail: 'Defined a modular product roadmap spanning patient journey, market access, and HCP intelligence',
  },
  {
    icon: Users,
    label: 'Stakeholder Empathy',
    detail: 'Designed for brand managers, medical affairs leads, and payer strategists as primary users',
  },
  {
    icon: Brain,
    label: 'Technical Fluency',
    detail: 'End to end build using React, TypeScript, Recharts, and synthetic data pipelines',
  },
];

const roadmap = [
  {
    title: 'Patient Journey Analytics',
    desc: 'Map how patients move from diagnosis through treatment milestones, highlighting where they stall or drop out of care.',
  },
  {
    title: 'Market Access & Coverage',
    desc: 'See how payer rules and coverage restrictions translate into treatment drop off and uneven adoption.',
  },
  {
    title: 'HCP Prescribing Intelligence',
    desc: 'Explore how prescribing behavior varies across providers, geographies, and practice settings.',
  },
  {
    title: 'Clinical Trials & Signals',
    desc: 'Connect trial activity and conference signals to downstream real world adoption and market dynamics.',
  },
];

const Index = () => {
  const navigate = useNavigate();

  return (
    <main className="min-h-screen bg-background">
      {/* ─── Top bar ─── */}
      <motion.nav
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="flex items-center justify-between px-6 md:px-10 lg:px-16 py-5"
      >
        <span className="text-xs font-semibold tracking-[0.25em] uppercase text-muted-foreground">
          Yash Shah
        </span>
        <div className="flex items-center gap-3">
          <a
            href="https://www.linkedin.com/in/yashshah2232"
            target="_blank"
            rel="noopener noreferrer"
            className="group relative inline-flex items-center justify-center w-10 h-10 rounded-xl bg-muted/60 border border-border/50 hover:border-primary/40 hover:bg-primary/5 transition-all duration-300"
            aria-label="LinkedIn"
          >
            <Linkedin className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
            <span className="absolute -bottom-6 text-[9px] font-medium text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">
              LinkedIn
            </span>
          </a>
          <a
            href="https://github.com/yshah2232"
            target="_blank"
            rel="noopener noreferrer"
            className="group relative inline-flex items-center justify-center w-10 h-10 rounded-xl bg-muted/60 border border-border/50 hover:border-foreground/30 hover:bg-foreground/5 transition-all duration-300"
            aria-label="GitHub"
          >
            <Github className="h-5 w-5 text-muted-foreground group-hover:text-foreground transition-colors" />
            <span className="absolute -bottom-6 text-[9px] font-medium text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">
              GitHub
            </span>
          </a>
        </div>
      </motion.nav>

      {/* ─── Hero ─── */}
      <section className="px-6 md:px-10 lg:px-16 pt-8 md:pt-16 pb-12 md:pb-20">
        <div className="max-w-4xl">
          <motion.p
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.15 }}
            className="text-xs font-semibold tracking-[0.3em] uppercase mb-4"
            style={{ color: 'hsl(var(--warm-700))' }}
          >
            Portfolio
          </motion.p>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25, duration: 0.5 }}
            className="text-[36px] md:text-[56px] lg:text-[68px] font-extrabold leading-[1.05] tracking-tight text-foreground"
          >
            I build tools that turn
            <span className="text-primary"> patient data </span>
            into decisions.
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
            className="mt-6 text-base md:text-lg text-muted-foreground leading-relaxed max-w-2xl"
          >
            This is not a slide deck or a wireframe. It is a working analytics product built end to end,
            showing how I think about transforming longitudinal healthcare claims data into something
            a brand manager, medical affairs lead, or payer strategist would actually open every Monday morning.
          </motion.p>
        </div>
      </section>

      {/* ─── PM Skills Strip ─── */}
      <motion.section
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="px-6 md:px-10 lg:px-16 pb-14"
      >
        <div className="flex items-baseline gap-3 mb-6">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Skills demonstrated</h2>
          <div className="flex-1 border-t border-border/40" />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {pmSkills.map((skill, i) => (
            <TooltipProvider key={skill.label} delayDuration={150}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.45 + i * 0.06 }}
                    className="group flex flex-col items-center gap-2.5 rounded-xl border border-border/40 bg-muted/20 hover:bg-accent/40 hover:border-primary/20 p-4 transition-all duration-300 cursor-default"
                  >
                    <div
                      className="flex items-center justify-center w-10 h-10 rounded-lg transition-colors duration-300"
                      style={{ background: `hsl(var(--warm-${i === 0 ? '500' : i === 1 ? '700' : i === 2 ? '900' : '500'}) / 0.1)` }}
                    >
                      <skill.icon
                        className="h-5 w-5 transition-colors duration-300"
                        style={{ color: `hsl(var(--warm-${i === 0 ? '500' : i === 1 ? '700' : i === 2 ? '900' : '500'}))` }}
                      />
                    </div>
                    <span className="text-xs font-semibold text-center text-foreground/80 leading-tight">{skill.label}</span>
                  </motion.div>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="max-w-xs text-sm">
                  <p className="font-medium mb-1">{skill.label}</p>
                  <p className="text-muted-foreground">{skill.detail}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          ))}
        </div>
      </motion.section>

      {/* ─── Live Module: GLP 1 ─── */}
      <motion.section
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.55, duration: 0.5 }}
        className="px-6 md:px-10 lg:px-16 pb-16"
      >
        <div
          className="relative rounded-2xl overflow-hidden cursor-pointer group"
          onClick={() => navigate('/dashboard')}
          style={{
            background: 'linear-gradient(135deg, hsl(0 72% 48%) 0%, hsl(350 80% 40%) 50%, hsl(340 60% 30%) 100%)',
          }}
        >
          <div className="relative z-10 px-6 md:px-10 py-8 md:py-12 flex flex-col md:flex-row items-start md:items-center gap-6 md:gap-10">
            <div className="flex-1 space-y-3">
              <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-white/15 text-white/90 text-[11px] font-semibold tracking-wider uppercase">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Live Module
              </div>
              <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-white leading-tight">
                GLP 1 Patient Insights Dashboard
              </h2>
              <p className="text-white/70 text-sm md:text-base leading-relaxed max-w-lg">
                Filter by date, payer, and brand. Explore persistence curves, geographic heatmaps,
                AI generated insights, and exportable reports. All driven by a 100K patient synthetic cohort.
              </p>
              <div className="flex flex-wrap gap-2 pt-1">
                {['Persistence Curves', 'Payer & Brand Mix', 'US Heatmap', 'AI Q&A', 'PPT Export'].map((tag) => (
                  <span key={tag} className="text-[10px] font-semibold px-2.5 py-1 rounded-full bg-white/10 text-white/80 tracking-wide">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
            <Button
              size="lg"
              variant="secondary"
              className="shrink-0 gap-2 text-sm font-bold shadow-lg group-hover:scale-105 transition-transform bg-white text-foreground hover:bg-white/90"
            >
              Explore Dashboard <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
          <div className="absolute top-0 right-0 w-[350px] h-[350px] rounded-full opacity-20" style={{ background: 'radial-gradient(circle, hsl(0 80% 70%), transparent 70%)' }} />
          <div className="absolute bottom-0 left-1/4 w-[250px] h-[250px] rounded-full opacity-10" style={{ background: 'radial-gradient(circle, hsl(30 90% 65%), transparent 70%)' }} />
        </div>
      </motion.section>

      {/* ─── How the Data Was Created ─── */}
      <motion.section
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.65 }}
        className="px-6 md:px-10 lg:px-16 pb-16"
      >
        <div className="flex items-baseline gap-3 mb-8">
          <h2 className="text-xl md:text-2xl font-bold text-foreground">How the data was created</h2>
          <div className="flex-1 border-t border-border/60" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* AI Generation Process */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="rounded-xl border border-primary/20 bg-accent/30 p-6 space-y-4"
          >
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
              The entire 100K patient cohort was synthetically modeled using AI driven statistical generation.
              No real patient data exists anywhere in this product. Discontinuation patterns follow
              <strong className="text-foreground"> modified Weibull survival curves</strong> calibrated against
              12 month adherence benchmarks from published clinical studies.
            </p>
            <div className="flex flex-wrap gap-2">
              <span className="text-[10px] font-semibold px-2.5 py-1 rounded-full bg-primary/10 text-primary">Weibull Curves</span>
              <span className="text-[10px] font-semibold px-2.5 py-1 rounded-full bg-primary/10 text-primary">100K Patients</span>
              <span className="text-[10px] font-semibold px-2.5 py-1 rounded-full bg-primary/10 text-primary">Zero PHI</span>
            </div>
          </motion.div>

          {/* Data Sources & References */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.75 }}
            className="rounded-xl border border-border/50 bg-muted/20 p-6 space-y-4"
          >
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-muted">
                <ExternalLink className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-foreground">Calibration Sources</h3>
                <p className="text-[11px] text-muted-foreground">Published, peer reviewed data</p>
              </div>
            </div>
            <ul className="space-y-2.5">
              <li className="text-sm">
                <a
                  href="https://pubmed.ncbi.nlm.nih.gov/31415751/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline font-medium"
                >
                  Trujillo et al. (2020)
                </a>
                <span className="text-muted-foreground"> — GLP 1 RA persistence patterns over 12 months</span>
              </li>
              <li className="text-sm">
                <a
                  href="https://pubmed.ncbi.nlm.nih.gov/29907969/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline font-medium"
                >
                  Blonde et al. (2018)
                </a>
                <span className="text-muted-foreground"> — Adherence and discontinuation in Type 2 Diabetes</span>
              </li>
              <li className="text-sm">
                <a
                  href="https://www.iqvia.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline font-medium"
                >
                  IQVIA Utilization Reports
                </a>
                <span className="text-muted-foreground"> — National prescription volume benchmarks</span>
              </li>
              <li className="text-sm">
                <a
                  href="https://www.cms.gov/data-research"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline font-medium"
                >
                  CMS Open Data
                </a>
                <span className="text-muted-foreground"> — Payer mix and geographic distribution baselines</span>
              </li>
            </ul>
          </motion.div>
        </div>

        {/* Coverage Stats */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-3"
        >
          {[
            { value: '100K', label: 'Synthetic patients', color: '--warm-700' },
            { value: '5', label: 'GLP 1 brands', color: '--warm-500' },
            { value: '4', label: 'Payer segments', color: '--chart-2' },
            { value: '50', label: 'US states', color: '--chart-5' },
          ].map((stat) => (
            <div key={stat.label} className="text-center py-3 rounded-lg border border-border/30 bg-muted/10">
              <span className="block text-2xl font-extrabold" style={{ color: `hsl(var(${stat.color}))` }}>
                {stat.value}
              </span>
              <span className="text-[11px] text-muted-foreground">{stat.label}</span>
            </div>
          ))}
        </motion.div>
      </motion.section>

      {/* ─── Roadmap ─── */}
      <motion.section
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.85 }}
        className="px-6 md:px-10 lg:px-16 pb-16"
      >
        <div className="flex items-baseline gap-3 mb-8">
          <h2 className="text-xl md:text-2xl font-bold text-foreground">What comes next</h2>
          <div className="flex-1 border-t border-border/60" />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {roadmap.map((mod, i) => (
            <TooltipProvider key={mod.title} delayDuration={200}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.9 + i * 0.06 }}
                    className="rounded-xl border border-border/40 bg-muted/20 p-5 space-y-2 opacity-60 cursor-default"
                  >
                    <div className="flex items-center gap-2">
                      <Lock className="h-3.5 w-3.5 text-muted-foreground/50" />
                      <span className="text-[10px] font-semibold tracking-wider uppercase text-muted-foreground/60">
                        Roadmap
                      </span>
                    </div>
                    <h3 className="text-sm font-semibold text-muted-foreground">{mod.title}</h3>
                    <p className="text-xs text-muted-foreground/60 leading-relaxed line-clamp-2">{mod.desc}</p>
                  </motion.div>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="max-w-xs text-sm">
                  <p className="font-medium mb-1">{mod.title}</p>
                  <p className="text-muted-foreground">{mod.desc}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          ))}
        </div>
      </motion.section>

      {/* ─── Footer ─── */}
      <motion.footer
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.4 }}
        transition={{ delay: 1.0 }}
        className="px-6 md:px-10 lg:px-16 pb-8 flex items-center justify-between"
      >
        <span className="text-xs text-muted-foreground">
          Built with React, TypeScript, and synthetic claims data
        </span>
        <span
          className="text-lg md:text-xl tracking-widest uppercase font-bold"
          style={{ color: 'hsl(0 50% 35% / 0.35)' }}
        >
          Portfolio
        </span>
      </motion.footer>

      {/* ─── Floating Agent Chatbot ─── */}
      <AgentChatbot />
    </main>
  );
};

export default Index;
