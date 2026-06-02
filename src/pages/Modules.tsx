import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  BarChart3,
  TrendingUp,
  Shield,
  Stethoscope,
  FlaskConical,
  Layers,
  ArrowRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

const groups = [
  {
    label: 'Live now',
    modules: [
      {
        title: 'GLP 1 Patient Insights Dashboard',
        icon: BarChart3,
        job: 'Monitor adoption, persistence, drop off, payer mix, and geography for a 100K patient synthetic cohort.',
        status: 'live' as const,
        chips: ['Persistence Curves', 'Payer Mix', 'Heatmap', 'AI Summary', 'Export'],
      },
    ],
  },
  {
    label: 'In build',
    modules: [
      {
        title: 'Patient Journey Analytics',
        icon: TrendingUp,
        job: 'Show friction, stability, acceleration, and drop off risk across the treatment lifecycle.',
        status: 'build' as const,
      },
      {
        title: 'Data Trust Layer',
        icon: Layers,
        job: 'Explain why healthcare data breaks and how the product handles it with linkage maps, standardization, and privacy preserving techniques.',
        status: 'build' as const,
      },
    ],
  },
  {
    label: 'Concepts',
    modules: [
      {
        title: 'Market Access & Coverage Impact',
        icon: Shield,
        job: 'Quantify access barriers by payer and policy, showing impact on time to start and abandonment.',
        status: 'concept' as const,
      },
      {
        title: 'HCP Prescribing Intelligence',
        icon: Stethoscope,
        job: 'Show who is driving prescribing change and where treatment escalates faster.',
        status: 'concept' as const,
      },
      {
        title: 'Clinical Trials & Conference Signals',
        icon: FlaskConical,
        job: 'Connect trial activity and conference signals to downstream utilization shifts.',
        status: 'concept' as const,
      },
    ],
  },
];

const statusStyles = {
  live: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
  build: 'bg-primary/10 text-primary border-primary/20',
  concept: 'bg-muted text-muted-foreground border-border/40',
};

const statusLabels = { live: 'Live', build: 'In Build', concept: 'Concept' };

const anim = (delay: number) => ({
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  transition: { delay, duration: 0.4 },
});

const Modules = () => {
  const navigate = useNavigate();

  return (
    <div className="max-w-5xl mx-auto px-4 md:px-6 py-12 md:py-16 space-y-12">
      <motion.div {...anim(0.1)}>
        <h1 className="text-3xl md:text-4xl font-extrabold text-foreground mb-3">Modules</h1>
        <p className="text-sm md:text-base text-muted-foreground max-w-2xl leading-relaxed">
          This is a working suite built with synthetic longitudinal data to demonstrate product thinking without patient data. Each module addresses a specific decision a healthcare team needs to make.
        </p>
      </motion.div>

      {groups.map((group, gi) => (
        <motion.section key={group.label} {...anim(0.2 + gi * 0.1)} className="space-y-5">
          <div className="flex items-center gap-3">
            <h2 className="text-xs font-bold tracking-[0.2em] uppercase text-muted-foreground">{group.label}</h2>
            <div className="flex-1 border-t border-border/40" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {group.modules.map((mod) => {
              const isLive = mod.status === 'live';
              return (
                <div
                  key={mod.title}
                  className={`rounded-xl border p-5 md:p-6 space-y-3 transition-all duration-200 ${
                    isLive
                      ? 'border-primary/30 bg-accent/20 hover:border-primary/50 cursor-pointer hover:shadow-md'
                      : 'border-border/40 bg-card opacity-70'
                  }`}
                  onClick={isLive ? () => navigate('/dashboard') : undefined}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <mod.icon className={`h-5 w-5 ${isLive ? 'text-primary' : 'text-muted-foreground/50'}`} />
                      <h3 className={`text-sm font-bold ${isLive ? 'text-foreground' : 'text-muted-foreground'}`}>{mod.title}</h3>
                    </div>
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${statusStyles[mod.status]}`}>
                      {statusLabels[mod.status]}
                    </span>
                  </div>
                  <p className={`text-xs leading-relaxed ${isLive ? 'text-muted-foreground' : 'text-muted-foreground/60'}`}>
                    {mod.job}
                  </p>
                  {'chips' in mod && mod.chips && (
                    <div className="flex flex-wrap gap-1.5">
                      {mod.chips.map((chip) => (
                        <span key={chip} className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                          {chip}
                        </span>
                      ))}
                    </div>
                  )}
                  {isLive && (
                    <div className="pt-1">
                      <Button size="sm" variant="ghost" className="gap-1.5 text-xs text-primary hover:text-primary p-0 h-auto">
                        Explore <ArrowRight className="h-3 w-3" />
                      </Button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </motion.section>
      ))}
    </div>
  );
};

export default Modules;
