import { useState } from 'react';
import { Info, X, BookOpen, Database, FileText, Layers } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';

const InfoPanel = () => {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setOpen(true)}
        className="gap-1.5 text-xs"
      >
        <Info className="h-3.5 w-3.5" />
        Info
      </Button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-start justify-end bg-black/30 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          >
            <motion.div
              initial={{ x: 400 }}
              animate={{ x: 0 }}
              exit={{ x: 400 }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="bg-card border-l shadow-2xl h-full w-full max-w-lg overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="sticky top-0 bg-card border-b px-6 py-4 flex items-center justify-between z-10">
                <h2 className="text-lg font-semibold text-foreground">Information & References</h2>
                <button onClick={() => setOpen(false)} className="text-muted-foreground hover:text-foreground">
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="px-6 py-6 space-y-8">
                {/* Methodology */}
                <section>
                  <div className="flex items-center gap-2 mb-3">
                    <BookOpen className="h-4 w-4 text-primary" />
                    <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider">Methodology</h3>
                  </div>
                  <ul className="space-y-2.5">
                    {[
                      'Patients are defined as individuals with at least one GLP-1 prescription fill (index event).',
                      'Activity is measured by tracking refill patterns from the index date forward.',
                      'A patient is considered discontinued if no refill occurs within the expected treatment window (typically 30-90 days after last fill).',
                      'Drop-off rates are modeled using modified Weibull survival curves calibrated against published 12-month adherence studies.',
                    ].map((item, i) => (
                      <li key={i} className="flex gap-2.5 text-sm text-muted-foreground leading-relaxed">
                        <span className="h-1.5 w-1.5 rounded-full bg-primary mt-2 shrink-0" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </section>

                <Separator />

                {/* Data Sources */}
                <section>
                  <div className="flex items-center gap-2 mb-3">
                    <Database className="h-4 w-4 text-primary" />
                    <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider">Data Sources</h3>
                  </div>
                  <ul className="space-y-2.5">
                    {[
                      'Synthetic claims-style data modeled from publicly available GLP-1 market statistics.',
                      '100,000-patient cohort providing national-scale representativeness without PHI.',
                      'Discontinuation patterns grounded in published persistence studies and real-world utilization sources.',
                      'No protected health information (PHI) or actual claims records were used.',
                    ].map((item, i) => (
                      <li key={i} className="flex gap-2.5 text-sm text-muted-foreground leading-relaxed">
                        <span className="h-1.5 w-1.5 rounded-full bg-primary mt-2 shrink-0" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </section>

                <Separator />

                {/* References */}
                <section>
                  <div className="flex items-center gap-2 mb-3">
                    <FileText className="h-4 w-4 text-primary" />
                    <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider">References</h3>
                  </div>
                  <ul className="space-y-2.5">
                    {[
                      'KFF Health Tracking Poll: GLP-1 Usage and Access Survey (2024)',
                      'IQVIA Institute: GLP-1 Market Dynamics Report (2024)',
                      'Trujillo et al., "Persistence with GLP-1 RA therapy in type 2 diabetes," Diabetes Care (2023)',
                      'Blonde et al., "Adherence and persistence with GLP-1 receptor agonists," Diabetes Obes Metab (2022)',
                    ].map((item, i) => (
                      <li key={i} className="flex gap-2.5 text-sm text-muted-foreground leading-relaxed">
                        <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/30 mt-2 shrink-0" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </section>

                <Separator />

                {/* Architecture */}
                <section>
                  <div className="flex items-center gap-2 mb-3">
                    <Layers className="h-4 w-4 text-primary" />
                    <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider">Modular Architecture</h3>
                  </div>
                  <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
                    This dashboard is built on three reusable analytical modules:
                  </p>
                  <div className="space-y-3">
                    {[
                      {
                        name: 'Cohort Builder',
                        desc: 'Defines the patient population using time windows and inclusion criteria. Drives all downstream calculations.',
                      },
                      {
                        name: 'Persistence Engine',
                        desc: 'Calculates active vs. discontinued status using refill gap logic and Weibull survival modeling.',
                      },
                      {
                        name: 'Insight Generator',
                        desc: 'Automatically detects patterns across segments (payer, brand, indication) and generates plain-language summaries.',
                      },
                    ].map((mod) => (
                      <div key={mod.name} className="rounded-lg border bg-muted/30 p-3">
                        <p className="text-sm font-medium text-foreground">{mod.name}</p>
                        <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{mod.desc}</p>
                      </div>
                    ))}
                  </div>
                </section>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default InfoPanel;
