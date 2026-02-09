import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';
import { Separator } from '@/components/ui/separator';

const sections = [
  {
    title: 'How the Data Was Modeled',
    items: [
      'Synthetic claims data grounded in publicly available healthcare utilization sources and published GLP-1 persistency studies.',
      'Index date–driven longitudinal analysis tracking each patient from their first GLP-1 prescription fill.',
      'Real-world discontinuation ranges applied using modified Weibull survival curves calibrated against published 12-month adherence data.',
    ],
  },
  {
    title: 'What This Is — and Is Not',
    items: [
      'This is not real patient data. No protected health information (PHI) or actual claims records were used.',
      'This is a realistic simulation designed for product demonstration, built to mirror the statistical patterns observed in national-scale GLP-1 utilization data.',
    ],
  },
  {
    title: 'Why a 100K Patient Cohort',
    items: [
      'A 100,000-patient sample provides a representative cohort for national-scale analytics without introducing computational overhead.',
      'Enables fast iteration and interactive exploration while preserving statistically meaningful behavior across subgroups (brand, payer, indication).',
    ],
  },
];

const Methodology = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-background border-b">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center gap-3">
          <Link
            to="/dashboard"
            className="inline-flex items-center justify-center h-8 w-8 rounded-lg hover:bg-muted transition-colors"
            aria-label="Back to dashboard"
          >
            <ArrowLeft className="h-5 w-5 text-foreground" />
          </Link>
          <h1 className="text-xl font-bold text-foreground">
            Methodology &amp; Assumptions
          </h1>
        </div>
      </div>

      {/* Content */}
      <motion.div
        className="max-w-3xl mx-auto px-4 py-8 space-y-8"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        {sections.map((section, i) => (
          <div key={section.title}>
            <h2 className="text-lg font-semibold text-foreground mb-3">{section.title}</h2>
            <ul className="space-y-3">
              {section.items.map((item, j) => (
                <li
                  key={j}
                  className="flex gap-3 text-sm text-muted-foreground leading-relaxed"
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-primary mt-2 shrink-0" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
            {i < sections.length - 1 && <Separator className="mt-8" />}
          </div>
        ))}
      </motion.div>
    </div>
  );
};

export default Methodology;
