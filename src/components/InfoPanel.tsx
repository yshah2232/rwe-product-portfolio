import { useState } from 'react';
import { Info, X, BookOpen, Database, FileText, Layers, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';

type SectionKey = 'methodology' | 'dataSources' | 'references' | 'architecture';

const SECTIONS: {
  key: SectionKey;
  label: string;
  icon: typeof BookOpen;
  summary: string;
  detail: string;
  items: string[];
}[] = [
  {
    key: 'methodology',
    label: 'Methodology',
    icon: BookOpen,
    summary: 'How patients and persistence metrics are defined.',
    detail:
      'This section explains how the analysis cohort is built and how persistence is measured. The methodology mirrors real-world evidence (RWE) standards used by pharma analytics teams, using modified Weibull survival curves calibrated against published 12-month adherence studies. Understanding these definitions is critical for interpreting every chart and KPI on the dashboard.',
    items: [
      'Patients are defined as individuals with at least one GLP-1 prescription fill (index event).',
      'Activity is measured by tracking refill patterns from the index date forward.',
      'A patient is considered discontinued if no refill occurs within the expected treatment window (typically 30-90 days after last fill).',
      'Drop-off rates are modeled using modified Weibull survival curves calibrated against published 12-month adherence studies.',
    ],
  },
  {
    key: 'dataSources',
    label: 'Data Sources',
    icon: Database,
    summary: 'Where the data comes from and its representativeness.',
    detail:
      'All data in this dashboard is fully synthetic — no real patient data or PHI is used. The synthetic dataset is modeled from publicly available GLP-1 market statistics and published persistence studies, creating a 100,000-patient cohort that mirrors national-scale utilization patterns. This approach enables realistic analysis while maintaining complete data privacy compliance.',
    items: [
      'Synthetic claims-style data modeled from publicly available GLP-1 market statistics.',
      '100,000-patient cohort providing national-scale representativeness without PHI.',
      'Discontinuation patterns grounded in published persistence studies and real-world utilization sources.',
      'No protected health information (PHI) or actual claims records were used.',
    ],
  },
  {
    key: 'references',
    label: 'References',
    icon: FileText,
    summary: 'Academic and industry sources supporting this analysis.',
    detail:
      'The persistence patterns, market dynamics, and analytical assumptions in this dashboard are grounded in peer-reviewed literature and industry reports. These references validate the Weibull parameters, payer impact assumptions, and brand-level persistence differentials shown throughout the dashboard.',
    items: [
      'KFF Health Tracking Poll: GLP-1 Usage and Access Survey (2024)',
      'IQVIA Institute: GLP-1 Market Dynamics Report (2024)',
      'Trujillo et al., "Persistence with GLP-1 RA therapy in type 2 diabetes," Diabetes Care (2023)',
      'Blonde et al., "Adherence and persistence with GLP-1 receptor agonists," Diabetes Obes Metab (2022)',
    ],
  },
  {
    key: 'architecture',
    label: 'Modular Architecture',
    icon: Layers,
    summary: 'The three reusable analytical modules powering this dashboard.',
    detail:
      'This dashboard is designed with a modular analytical architecture that separates concerns into three distinct engines. This design pattern enables rapid extension to new therapeutic areas, data sources, and visualization types without rebuilding core logic — demonstrating production-grade product thinking.',
    items: [
      'Cohort Builder — Defines the patient population using time windows and inclusion criteria. Drives all downstream calculations.',
      'Persistence Engine — Calculates active vs. discontinued status using refill gap logic and Weibull survival modeling.',
      'Insight Generator — Automatically detects patterns across segments (payer, brand, indication) and generates plain-language summaries.',
    ],
  },
];

const InfoPanel = () => {
  const [expandedSection, setExpandedSection] = useState<SectionKey | null>(null);

  const toggleSection = (key: SectionKey) => {
    setExpandedSection(expandedSection === key ? null : key);
  };

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-1.5 text-xs text-muted-foreground hover:text-foreground">
          <Info className="h-4 w-4" />
          Info
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full max-w-lg p-0 overflow-y-auto">
        <SheetHeader className="sticky top-0 bg-card border-b px-6 py-4 z-10">
          <SheetTitle className="text-lg font-semibold text-foreground">
            Information & References
          </SheetTitle>
        </SheetHeader>

        <div className="px-6 py-6 space-y-3">
          {SECTIONS.map((section) => {
            const Icon = section.icon;
            const isExpanded = expandedSection === section.key;

            return (
              <div key={section.key} className="rounded-xl border bg-card overflow-hidden">
                <button
                  onClick={() => toggleSection(section.key)}
                  className="w-full px-4 py-4 flex items-center gap-3 hover:bg-muted/30 transition-colors text-left"
                >
                  <div className="p-1.5 rounded-lg bg-primary/10 shrink-0">
                    <Icon className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground">{section.label}</p>
                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{section.summary}</p>
                  </div>
                  <ChevronRight
                    className={`h-4 w-4 text-muted-foreground shrink-0 transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''}`}
                  />
                </button>

                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="px-4 pb-4 space-y-3">
                        <Separator />
                        <div className="rounded-lg bg-muted/40 border border-border/50 px-3 py-2.5">
                          <p className="text-xs text-foreground leading-relaxed">{section.detail}</p>
                        </div>
                        <ul className="space-y-2">
                          {section.items.map((item, i) => (
                            <li key={i} className="flex gap-2.5 text-sm text-muted-foreground leading-relaxed">
                              <span className="h-1.5 w-1.5 rounded-full bg-primary mt-2 shrink-0" />
                              {item}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default InfoPanel;
