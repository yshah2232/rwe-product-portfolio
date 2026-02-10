import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import ModuleCard from '@/components/ModuleCard';

const modules = [
  {
    title: 'GLP-1 Pharma Insights',
    status: 'active' as const,
    description:
      'Track adoption, persistence, and drop-off of GLP-1 therapies across payers, brands, and patient segments using longitudinal claims-style data.',
    tooltip:
      'This module simulates how pharma and analytics teams analyze real-world GLP-1 utilization, including patient persistence, payer mix, brand switching, and early discontinuation drivers over time.',
  },
  {
    title: 'Patient Journey Analytics',
    status: 'wip' as const,
    description:
      'Visualize how patients move from diagnosis to treatment initiation, continuation, and discontinuation across time.',
    tooltip:
      'Designed to map patient journeys across key clinical and treatment milestones, highlighting where patients progress, stall, or drop out of care.',
  },
  {
    title: 'Market Access & Coverage Impact',
    status: 'wip' as const,
    description:
      'Understand how payer coverage, restrictions, and policy changes influence treatment access and persistence.',
    tooltip:
      'Focuses on the relationship between payer rules and real-world utilization, showing how access barriers translate into drop-off and uneven adoption.',
  },
  {
    title: 'HCP Prescribing Intelligence',
    status: 'wip' as const,
    description:
      'Analyze prescribing patterns and concentration across healthcare providers and practice types.',
    tooltip:
      'Explores how prescribing behavior varies across providers, geographies, and practice settings.',
  },
  {
    title: 'Clinical Trials & Conference Signals',
    status: 'wip' as const,
    description:
      'Track emerging therapies and clinical signals from trials and medical conferences alongside real-world utilization.',
    tooltip:
      'Connects public clinical trial activity and conference signals to downstream real-world adoption and market dynamics.',
  },
];

const Index = () => {
  const navigate = useNavigate();

  return (
    <main className="min-h-screen bg-background flex flex-col">
      {/* Hero Banner - Modern gradient inspired by Apple/Duolingo */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6 }}
        className="w-full relative overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, hsl(0 72% 48%) 0%, hsl(350 80% 42%) 40%, hsl(340 70% 35%) 70%, hsl(330 60% 28%) 100%)',
        }}
      >
        <div className="px-6 md:px-10 lg:px-16 py-10 md:py-14 lg:py-16 relative z-10">
          <motion.h1
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.15 }}
            className="text-[36px] md:text-[48px] lg:text-[56px] font-bold text-white leading-[1.1] tracking-tight max-w-4xl"
          >
            Real-World Evidence & Healthcare Analytics
          </motion.h1>
        </div>
        {/* Subtle decorative gradient orbs */}
        <div className="absolute top-0 right-0 w-[400px] h-[400px] rounded-full opacity-15" style={{ background: 'radial-gradient(circle, hsl(0 80% 70%), transparent 70%)' }} />
        <div className="absolute bottom-0 left-1/3 w-[300px] h-[300px] rounded-full opacity-10" style={{ background: 'radial-gradient(circle, hsl(350 90% 65%), transparent 70%)' }} />
      </motion.div>

      {/* Subtitle section */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.25 }}
        className="px-6 md:px-10 lg:px-16 pt-8 pb-4"
      >
        <p className="text-[16px] md:text-[18px] leading-relaxed text-muted-foreground max-w-3xl">
          Explore interactive modules that transform claims-level healthcare data into actionable insights spanning patient behavior, payer dynamics, provider trends, and therapeutic outcomes.
        </p>
      </motion.div>

      {/* Module cards - spacious grid */}
      <motion.div
        className="flex-1 px-6 md:px-10 lg:px-16 py-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4, delay: 0.35 }}
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-5 md:gap-6">
          {modules.map((mod, i) => (
            <ModuleCard
              key={mod.title}
              {...mod}
              index={i}
              onExplore={() => navigate('/dashboard')}
            />
          ))}
        </div>
      </motion.div>

      {/* Product Portfolio — low-key footer badge */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.5 }}
        transition={{ duration: 0.6, delay: 0.6 }}
        className="px-6 md:px-10 lg:px-16 pb-6 flex justify-end"
      >
        <span className="text-sm tracking-widest uppercase text-primary font-bold">
          Product Portfolio
        </span>
      </motion.div>
    </main>
  );
};

export default Index;
