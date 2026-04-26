// First-visit pop-up that asks whether the visitor is a clinical/research user
// or a patient/family member. Sets default plain mode accordingly.
// Shown once per browser (localStorage persisted via PlainModeContext).

import { useEffect, useState } from 'react';
import { Stethoscope, HeartHandshake, Sparkles } from 'lucide-react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { usePlainMode } from '@/contexts/PlainModeContext';

const AudienceModal = () => {
  const { audiencePromptSeen, setAudience, markAudiencePromptSeen } = usePlainMode();
  const [open, setOpen] = useState(false);

  // Defer the open by 700ms so the page renders first — feels less aggressive.
  useEffect(() => {
    if (audiencePromptSeen) return;
    const t = setTimeout(() => setOpen(true), 700);
    return () => clearTimeout(t);
  }, [audiencePromptSeen]);

  const choose = (kind: 'clinical' | 'patient') => {
    setAudience(kind);
    markAudiencePromptSeen();
    setOpen(false);
  };

  const skip = () => {
    setAudience('unspecified', { skipPlain: true });
    markAudiencePromptSeen();
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) skip(); }}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader className="text-left">
          <div className="flex items-center gap-2 mb-1">
            <Sparkles className="h-4 w-4" style={{ color: 'hsl(var(--primary))' }} />
            <span className="text-[11px] font-bold uppercase tracking-wider" style={{ color: 'hsl(var(--primary))' }}>
              Welcome
            </span>
          </div>
          <DialogTitle className="text-[20px] leading-tight">
            How would you like to read this site?
          </DialogTitle>
          <DialogDescription className="text-[14px] leading-relaxed pt-1">
            We can show every clinical trial in standard registry language, or rewrite the
            same studies in everyday words. You can change this any time from the toggle in the top bar.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2">
          <button
            onClick={() => choose('clinical')}
            className="text-left p-4 rounded-sm border-2 border-border hover:border-primary hover:bg-accent/40 transition-colors group"
          >
            <div className="flex items-center justify-center w-10 h-10 rounded-sm bg-accent mb-3 group-hover:bg-primary/10">
              <Stethoscope className="h-5 w-5" style={{ color: 'hsl(var(--primary))' }} />
            </div>
            <div className="text-[15px] font-bold mb-1" style={{ color: 'hsl(var(--primary))' }}>
              I'm a clinician or researcher
            </div>
            <div className="text-[12.5px] text-foreground/70 leading-relaxed">
              Show registry-standard terminology — phases, masking, eligibility criteria, ICD/MeSH terms.
            </div>
          </button>

          <button
            onClick={() => choose('patient')}
            className="text-left p-4 rounded-sm border-2 border-border hover:border-primary hover:bg-accent/40 transition-colors group"
          >
            <div className="flex items-center justify-center w-10 h-10 rounded-sm bg-accent mb-3 group-hover:bg-primary/10">
              <HeartHandshake className="h-5 w-5" style={{ color: 'hsl(var(--primary))' }} />
            </div>
            <div className="text-[15px] font-bold mb-1" style={{ color: 'hsl(var(--primary))' }}>
              I'm a patient, caregiver, or just curious
            </div>
            <div className="text-[12.5px] text-foreground/70 leading-relaxed">
              Rewrite trials in plain language. Default to studies that are currently recruiting.
            </div>
          </button>
        </div>

        <div className="flex items-center justify-between pt-3 border-t border-border/50 mt-2">
          <p className="text-[11px] text-muted-foreground">
            This site is not medical advice. Always verify on{' '}
            <a className="underline" href="https://clinicaltrials.gov/" target="_blank" rel="noreferrer">ClinicalTrials.gov</a>.
          </p>
          <Button variant="ghost" size="sm" onClick={skip} className="text-[12px]">
            Skip for now
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AudienceModal;
