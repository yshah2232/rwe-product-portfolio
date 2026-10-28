// First-visit pop-up: visitor must pick an audience AND tick the agreement,
// then press Continue. Acceptance is stored only on this device
// (see PlainModeContext) and re-asked when the Terms version changes.

import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Stethoscope, HeartHandshake, Sparkles } from 'lucide-react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { usePlainMode } from '@/contexts/PlainModeContext';

const AudienceModal = () => {
  const { pathname } = useLocation();
  const internal = pathname.startsWith('/admin') || pathname.startsWith('/analytics/');
  const { termsAccepted, acceptTerms } = usePlainMode();
  const [open, setOpen] = useState(false);
  const [agreed, setAgreed] = useState(false); // never pre-checked
  const [choice, setChoice] = useState<'clinical' | 'patient' | null>(null);

  useEffect(() => {
    if (termsAccepted || internal) {
      setOpen(false);
      return;
    }
    const t = setTimeout(() => setOpen(true), 700);
    return () => clearTimeout(t);
  }, [termsAccepted, internal]);

  const canContinue = agreed && choice !== null;
  const submit = () => {
    if (!canContinue || !choice) return;
    acceptTerms(choice);
    setOpen(false);
  };

  const option = (kind: 'clinical' | 'patient', Icon: typeof Stethoscope, title: string, body: string) => {
    const selected = choice === kind;
    return (
      <button
        type="button"
        role="radio"
        aria-checked={selected}
        onClick={() => setChoice(kind)}
        className={`text-left p-3 sm:p-4 rounded-sm border-2 transition-colors group ${
          selected ? 'border-primary bg-accent/50' : 'border-border hover:border-primary/60 hover:bg-accent/30'
        }`}
      >
        <div className="flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 rounded-sm bg-accent mb-2 sm:mb-3">
          <Icon className="h-5 w-5" style={{ color: 'hsl(var(--primary))' }} />
        </div>
        <div className="text-[15px] font-bold mb-1" style={{ color: 'hsl(var(--primary))' }}>{title}</div>
        <div className="text-[12.5px] text-foreground/70 leading-relaxed">{body}</div>
      </button>
    );
  };

  return (
    <Dialog open={open} onOpenChange={() => { /* cannot be dismissed without agreeing */ }}>
      <DialogContent
        className="sm:max-w-lg max-h-[92vh] overflow-y-auto [&>button.absolute]:hidden"
        onEscapeKeyDown={(e) => e.preventDefault()}
        onPointerDownOutside={(e) => e.preventDefault()}
        onInteractOutside={(e) => e.preventDefault()}
      >
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

        <div role="radiogroup" aria-label="Audience" className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2">
          {option('clinical', Stethoscope, "I'm a clinician or researcher",
            'Show registry standard terminology: phases, masking, eligibility criteria, ICD/MeSH terms.')}
          {option('patient', HeartHandshake, "I'm a patient, caregiver, or just curious",
            'Rewrite trials in plain language. Default to studies that are currently recruiting.')}
        </div>

        <label htmlFor="audience-agree" className="flex items-start gap-2.5 mt-3 cursor-pointer">
          <Checkbox
            checked={agreed}
            onCheckedChange={(v) => setAgreed(!!v)}
            id="audience-agree"
            className="mt-0.5"
          />
          <span className="text-[12.5px] leading-relaxed text-foreground/85">
            I agree to the{' '}
            <Link to="/terms" target="_blank" className="underline font-semibold" style={{ color: 'hsl(var(--primary))' }}>Terms of Service</Link>,{' '}
            <Link to="/privacy" target="_blank" className="underline font-semibold" style={{ color: 'hsl(var(--primary))' }}>Privacy Policy</Link>{' '}
            and{' '}
            <Link to="/medical-disclaimer" target="_blank" className="underline font-semibold" style={{ color: 'hsl(var(--primary))' }}>Medical Disclaimer</Link>.
          </span>
        </label>

        <Button onClick={submit} disabled={!canContinue} className="w-full mt-2">
          Continue
        </Button>
        {!canContinue && (
          <p className="text-[11px] text-muted-foreground -mt-1">
            Choose how you'd like to read the site and tick the agreement to continue.
          </p>
        )}

        <div className="pt-3 border-t border-border/50">
          <p className="text-[11px] text-muted-foreground">
            Verify all trial details on{' '}
            <a className="underline" href="https://clinicaltrials.gov/" target="_blank" rel="noreferrer">ClinicalTrials.gov</a>.
            Your choice is saved only in this browser.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AudienceModal;
