import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Github, Linkedin, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

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

const dataStory = [
  { number: '100K', label: 'Synthetic patients modeled from published GLP 1 market statistics' },
  { number: '5', label: 'Brands with persistence curves calibrated to peer reviewed adherence studies' },
  { number: '4', label: 'Payer segments reflecting real world coverage and formulary dynamics' },
  { number: '50', label: 'US states with proportional geographic distribution' },
];

const Index = () => {
  const navigate = useNavigate();

  return (
    <main className="min-h-screen bg-background">
      {/* ─── Top bar with links ─── */}
      <motion.nav
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="flex items-center justify-between px-6 md:px-10 lg:px-16 py-5"
      >
        <span className="text-xs font-semibold tracking-[0.25em] uppercase text-muted-foreground">
          Yash Shah
        </span>
        <div className="flex items-center gap-1">
          <a
            href="https://www.linkedin.com/in/yashshah2232"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            <Linkedin className="h-3.5 w-3.5" /> LinkedIn
          </a>
          <a
            href="https://github.com/yshah2232"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            <Github className="h-3.5 w-3.5" /> GitHub
          </a>
        </div>
      </motion.nav>

      {/* ─── Hero: Big statement ─── */}
      <section className="px-6 md:px-10 lg:px-16 pt-8 md:pt-16 pb-12 md:pb-20">
        <div className="max-w-4xl">
          <motion.p
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.15 }}
            className="text-xs font-semibold tracking-[0.3em] uppercase mb-4"
            style={{ color: 'hsl(var(--warm-700))' }}
          >
            Product Management Portfolio
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

      {/* ─── Live Module: GLP-1 ─── */}
      <motion.section
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.45, duration: 0.5 }}
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
            {/* Left: module info */}
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

            {/* Right: CTA */}
            <Button
              size="lg"
              variant="secondary"
              className="shrink-0 gap-2 text-sm font-bold shadow-lg group-hover:scale-105 transition-transform bg-white text-foreground hover:bg-white/90"
            >
              Explore Dashboard <ArrowRight className="h-4 w-4" />
            </Button>
          </div>

          {/* Decorative orbs */}
          <div className="absolute top-0 right-0 w-[350px] h-[350px] rounded-full opacity-20" style={{ background: 'radial-gradient(circle, hsl(0 80% 70%), transparent 70%)' }} />
          <div className="absolute bottom-0 left-1/4 w-[250px] h-[250px] rounded-full opacity-10" style={{ background: 'radial-gradient(circle, hsl(30 90% 65%), transparent 70%)' }} />
        </div>
      </motion.section>

      {/* ─── How the Data Was Built ─── */}
      <motion.section
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.55 }}
        className="px-6 md:px-10 lg:px-16 pb-16"
      >
        <div className="flex items-baseline gap-3 mb-8">
          <h2 className="text-xl md:text-2xl font-bold text-foreground">How the data was created</h2>
          <div className="flex-1 border-t border-border/60" />
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
          {dataStory.map((d, i) => (
            <motion.div
              key={d.number}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 + i * 0.08 }}
              className="space-y-2"
            >
              <span
                className="block text-3xl md:text-4xl font-extrabold tracking-tight"
                style={{ color: 'hsl(var(--warm-700))' }}
              >
                {d.number}
              </span>
              <p className="text-sm text-muted-foreground leading-relaxed">{d.label}</p>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.85 }}
          className="mt-8 rounded-xl border border-border/50 bg-muted/30 p-5 md:p-6"
        >
          <p className="text-sm text-muted-foreground leading-relaxed">
            <span className="font-semibold text-foreground">No real patient data is used anywhere.</span>{' '}
            The entire cohort is synthetically generated from publicly available GLP 1 market statistics,
            published persistence studies (Trujillo et al., Blonde et al.), and IQVIA utilization reports.
            Discontinuation patterns follow modified Weibull survival curves calibrated against 12 month
            adherence benchmarks. The result is a dataset that mirrors national scale utilization without
            containing any protected health information.
          </p>
        </motion.div>
      </motion.section>

      {/* ─── Roadmap ─── */}
      <motion.section
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.7 }}
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
                    transition={{ delay: 0.75 + i * 0.06 }}
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
        transition={{ delay: 0.9 }}
        className="px-6 md:px-10 lg:px-16 pb-8 flex items-center justify-between"
      >
        <span className="text-xs text-muted-foreground">
          Built with React, TypeScript, and synthetic claims data
        </span>
        <span
          className="text-lg md:text-xl tracking-widest uppercase font-bold"
          style={{ color: 'hsl(0 50% 35% / 0.35)' }}
        >
          Product Portfolio
        </span>
      </motion.footer>
    </main>
  );
};

export default Index;
