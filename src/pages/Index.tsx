import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import ModuleCard from '@/components/ModuleCard';

const modules = [
  {
    title: 'GLP-1 Pharma Insights',
    status: 'active' as const,
    description:
      'Analyze adoption, persistency, and drop off across payers and brands.',
  },
  {
    title: 'Patient Journey Analytics',
    status: 'wip' as const,
    description: 'Conceptual module demonstrating roadmap thinking.',
  },
  {
    title: 'Market Access and Coverage Impact',
    status: 'wip' as const,
    description: 'Conceptual module demonstrating roadmap thinking.',
  },
  {
    title: 'HCP Prescribing Intelligence',
    status: 'wip' as const,
    description: 'Conceptual module demonstrating roadmap thinking.',
  },
  {
    title: 'Clinical Trial and Conference Signals',
    status: 'wip' as const,
    description: 'Conceptual module demonstrating roadmap thinking.',
  },
];

const Index = () => {
  const navigate = useNavigate();

  return (
    <main className="min-h-screen bg-background">
      <div className="max-w-2xl mx-auto px-4 py-12 md:py-20">
        <motion.header
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="w-screen relative left-1/2 -translate-x-1/2 bg-primary text-primary-foreground px-4 py-3 text-[32px] font-semibold tracking-wide mb-8">
            Product Portfolio
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-foreground leading-tight">
            Healthcare Product Portfolio
          </h1>
          <p className="mt-3 text-lg text-muted-foreground max-w-xl">
            Interactive analytics prototypes built to demonstrate healthcare product thinking.
          </p>
        </motion.header>

        <motion.div
          className="mt-10 space-y-4"
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
      </div>
    </main>
  );
};

export default Index;
