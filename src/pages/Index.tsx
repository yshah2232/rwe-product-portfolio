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
    <main className="min-h-screen bg-background">
      {/* Full-width red banner */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full bg-primary text-primary-foreground px-6 md:px-10 py-3 text-[32px] font-semibold tracking-wide"
      >
        Product Portfolio
      </motion.div>

      <div className="px-6 md:px-10 py-10 md:py-14 max-w-5xl">
        <motion.header
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <h1 className="text-[32px] md:text-[40px] font-bold text-foreground leading-tight">
            Real-World Evidence & Healthcare Analytics
          </h1>
          <p className="mt-4 text-[16px] md:text-[18px] leading-relaxed text-muted-foreground max-w-3xl">
            A hands-on analytics platform showcasing how real-world healthcare data can be transformed into decision-ready insights across patients, payers, brands, and providers.
          </p>
        </motion.header>

        <motion.section
          className="mt-10"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.2 }}
        >
          <h2 className="text-[26px] md:text-[32px] font-semibold text-foreground mb-6">
            Analytics Modules
          </h2>

          <motion.div
            className="space-y-4"
            initial="hidden"
            animate="visible"
            variants={{
              hidden: {},
              visible: { transition: { staggerChildren: 0.08 } },
            }}
          >
            {modules.map((mod, i) => (
              <ModuleCard
                key={mod.title}
                {...mod}
                index={i}
                onExplore={() => navigate('/dashboard')}
              />
            ))}
          </motion.div>
        </motion.section>
      </div>
    </main>
  );
};

export default Index;
