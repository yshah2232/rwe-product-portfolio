import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronRight, ChevronLeft, Compass } from 'lucide-react';
import { Button } from '@/components/ui/button';

const STEPS = [
  {
    title: 'Welcome to GLP-1 Insights',
    body: 'This dashboard shows how patients behave after starting a GLP-1 medication. It tracks who stays on therapy, who stops, and why — all based on a realistic 100,000-patient simulation.',
  },
  {
    title: 'Patient Time Window',
    body: 'The date filters at the top control which patients are included. When you change the window, every number, chart, and insight on the page updates automatically.',
  },
  {
    title: 'View By (Grouping)',
    body: 'This controls how data is grouped over time. "Daily" shows granular behavior, "Monthly" reveals long-term trends, and custom intervals like 36 or 72 days align to common refill cycles.',
  },
  {
    title: 'Key Metrics',
    body: 'The four cards at the top summarize the most important numbers: how many patients are analyzed, how many are still on therapy, how many stopped, and how late refills typically are. Tap the info icon on any card for a deeper explanation.',
  },
  {
    title: 'Persistence Curve',
    body: 'The main chart shows the percentage of patients still on therapy over time. The curve naturally declines — the steeper the drop, the faster patients are leaving. Key time points (3 months, 12 months) are highlighted.',
  },
  {
    title: 'Automatic Insights',
    body: 'Every chart includes a "What this shows" panel that automatically surfaces the most important observation. You never have to guess what the data means — the dashboard tells you.',
  },
];

const GuidedTour = () => {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);

  if (!open) {
    return (
      <Button
        variant="ghost"
        size="sm"
        onClick={() => { setOpen(true); setStep(0); }}
        className="gap-1.5 text-xs text-muted-foreground hover:text-foreground"
      >
        <Compass className="h-3.5 w-3.5" />
        Take a Tour
      </Button>
    );
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
        onClick={() => setOpen(false)}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-card border rounded-2xl shadow-2xl max-w-md w-full mx-4 p-6 my-auto"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-muted-foreground">
                {step + 1} of {STEPS.length}
              </span>
            </div>
            <button onClick={() => setOpen(false)} className="text-muted-foreground hover:text-foreground">
              <X className="h-4 w-4" />
            </button>
          </div>
          <h3 className="text-lg font-semibold text-foreground mb-2">{STEPS[step].title}</h3>
          <p className="text-sm text-muted-foreground leading-relaxed mb-6">{STEPS[step].body}</p>
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setStep(step - 1)}
              disabled={step === 0}
              className="gap-1"
            >
              <ChevronLeft className="h-4 w-4" /> Back
            </Button>
            {step < STEPS.length - 1 ? (
              <Button size="sm" onClick={() => setStep(step + 1)} className="gap-1">
                Next <ChevronRight className="h-4 w-4" />
              </Button>
            ) : (
              <Button size="sm" onClick={() => setOpen(false)}>
                Got it
              </Button>
            )}
          </div>
          {/* Progress dots */}
          <div className="flex justify-center gap-1.5 mt-4">
            {STEPS.map((_, i) => (
              <div
                key={i}
                className={`h-1.5 rounded-full transition-all ${i === step ? 'w-4 bg-primary' : 'w-1.5 bg-muted-foreground/20'}`}
              />
            ))}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default GuidedTour;
