import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Linkedin, ArrowRight, BarChart3, Users, ShieldCheck, Brain } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';

const skillDemos = [
  {
    icon: BarChart3,
    label: 'Data Storytelling',
    detail: 'Transforms 100K-patient claims data into visual narratives — persistence curves, payer mix, brand switching — that surface actionable patterns for commercial and medical teams.',
  },
  {
    icon: Users,
    label: 'Stakeholder Empathy',
    detail: 'Designed for brand managers, medical affairs, and payer strategy leads. Every chart answers a real business question: Where are we losing patients? Which payers drive drop-off?',
  },
  {
    icon: Brain,
    label: 'Product Thinking',
    detail: 'Modular architecture (Cohort Builder → Persistence Engine → Insight Generator) mirrors how production analytics products are designed for extensibility and reuse.',
  },
  {
    icon: ShieldCheck,
    label: 'RWE Domain Expertise',
    detail: 'Persistence modeled via Weibull survival curves calibrated to published GLP-1 adherence studies. Metrics follow real-world evidence standards used by pharma analytics teams.',
  },
];

const Index = () => {
  const navigate = useNavigate();

  return (
    <main className="min-h-screen bg-background flex flex-col">
      {/* ── Hero ── */}
      <motion.section
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6 }}
        className="w-full relative overflow-hidden"
        style={{
          background:
            'linear-gradient(135deg, hsl(0 72% 48%) 0%, hsl(350 80% 42%) 40%, hsl(340 70% 35%) 70%, hsl(330 60% 28%) 100%)',
        }}
      >
        <div className="max-w-[1100px] mx-auto px-6 md:px-10 py-12 md:py-16 relative z-10">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-4 max-w-2xl">
              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="text-white/70 text-sm font-medium tracking-widest uppercase"
              >
                Product Management Portfolio
              </motion.p>
              <motion.h1
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="text-[28px] md:text-[40px] lg:text-[46px] font-bold text-white leading-[1.1] tracking-tight"
              >
                I turn healthcare data into products people actually use.
              </motion.h1>
              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="text-white/75 text-base md:text-lg leading-relaxed max-w-xl"
              >
                This interactive demo shows how I approach building analytics tools — from defining patient cohorts to surfacing the insights that drive therapy adoption and retention decisions.
              </motion.p>
            </div>
            <a
              href="https://www.linkedin.com/in/yashshah2232"
              target="_blank"
              rel="noopener noreferrer"
              className="shrink-0 p-2.5 rounded-full bg-white/15 hover:bg-white/25 transition-colors mt-2"
              aria-label="Connect on LinkedIn"
            >
              <Linkedin className="h-5 w-5 text-white" />
            </a>
          </div>
        </div>
        {/* Decorative orbs */}
        <div className="absolute top-0 right-0 w-[400px] h-[400px] rounded-full opacity-15" style={{ background: 'radial-gradient(circle, hsl(0 80% 70%), transparent 70%)' }} />
        <div className="absolute bottom-0 left-1/3 w-[300px] h-[300px] rounded-full opacity-10" style={{ background: 'radial-gradient(circle, hsl(350 90% 65%), transparent 70%)' }} />
      </motion.section>

      {/* ── What This Demonstrates ── */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35, duration: 0.5 }}
        className="max-w-[1100px] mx-auto px-6 md:px-10 py-10 md:py-14"
      >
        <h2 className="text-lg font-semibold text-foreground mb-1">What you're reviewing</h2>
        <p className="text-sm text-muted-foreground mb-8 max-w-2xl">
          A working prototype that demonstrates how I think about healthcare data products — not a pitch deck, not a wireframe, but a functional tool built end-to-end.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-5">
          {skillDemos.map((skill, i) => {
            const Icon = skill.icon;
            return (
              <motion.div
                key={skill.label}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 + i * 0.08 }}
                className="rounded-xl border border-border/60 bg-card p-5 space-y-2"
              >
                <div className="flex items-center gap-2.5">
                  <div className="p-1.5 rounded-lg bg-primary/10">
                    <Icon className="h-4 w-4 text-primary" />
                  </div>
                  <span className="text-sm font-semibold text-foreground">{skill.label}</span>
                </div>
                <p className="text-[13px] text-muted-foreground leading-relaxed">{skill.detail}</p>
              </motion.div>
            );
          })}
        </div>
      </motion.section>

      <div className="max-w-[1100px] mx-auto px-6 md:px-10">
        <Separator />
      </div>

      {/* ── CTA to Dashboard ── */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6, duration: 0.5 }}
        className="max-w-[1100px] mx-auto px-6 md:px-10 py-10 md:py-14"
      >
        <div className="rounded-2xl border border-primary/20 bg-accent/30 p-6 md:p-8 flex flex-col md:flex-row items-start md:items-center gap-6">
          <div className="flex-1 space-y-2">
            <h2 className="text-xl md:text-2xl font-bold text-foreground">GLP-1 Patient Insights Dashboard</h2>
            <p className="text-sm text-muted-foreground leading-relaxed max-w-lg">
              Explore a 100,000-patient synthetic cohort. Filter by date, payer, and brand. See persistence curves, geographic distribution, AI-generated insights, and exportable reports — all built from claims-style data.
            </p>
            <div className="flex flex-wrap gap-2 pt-1">
              {['Persistence Curves', 'Payer & Brand Mix', 'US Heatmap', 'AI Q&A', 'PPT Export'].map((tag) => (
                <span key={tag} className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                  {tag}
                </span>
              ))}
            </div>
          </div>
          <Button
            size="lg"
            onClick={() => navigate('/dashboard')}
            className="shrink-0 gap-2 text-sm font-semibold shadow-md"
          >
            Open Dashboard <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </motion.section>

      {/* ── Footer ── */}
      <div className="mt-auto" />
      <motion.footer
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.5 }}
        transition={{ delay: 0.8 }}
        className="px-6 md:px-10 pb-6 flex justify-end max-w-[1100px] mx-auto w-full"
      >
        <span
          className="text-lg md:text-xl tracking-widest uppercase font-bold"
          style={{ color: 'hsl(0 50% 35% / 0.45)' }}
        >
          Product Portfolio
        </span>
      </motion.footer>
    </main>
  );
};

export default Index;
