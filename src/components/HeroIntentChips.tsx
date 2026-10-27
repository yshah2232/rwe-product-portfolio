/**
 * Hero intent chip row: "Why are you here?"
 * One-click capture of visitor role on the homepage. Stored in localStorage
 * and inserted into the existing audience_selections table for segmentation.
 *
 * Uses the existing `audience` text column (no schema change). For "patient"
 * we also flip plain-language mode on by default (Easy read + recruiting-focused search). Others keep registry-standard language.
 */
import { useEffect, useState } from 'react';
import { Check, Stethoscope, HeartHandshake, FlaskConical, Building2, Pencil } from 'lucide-react';
import { track } from '@/lib/track';
import { usePlainMode } from '@/contexts/PlainModeContext';

type Intent = 'patient' | 'clinician' | 'researcher' | 'sponsor';

const KEY = 'ctd.hero_intent';

const OPTIONS: { id: Intent; label: string; icon: typeof Stethoscope }[] = [
  { id: 'patient',    label: 'Patient / family', icon: HeartHandshake },
  { id: 'clinician',  label: 'Clinician',        icon: Stethoscope },
  { id: 'researcher', label: 'Researcher',       icon: FlaskConical },
  { id: 'sponsor',    label: 'Sponsor / industry', icon: Building2 },
];

const HeroIntentChips = () => {
  const { setAudience, markAudiencePromptSeen } = usePlainMode();
  const [intent, setIntent] = useState<Intent | null>(null);
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    try {
      localStorage.removeItem(KEY);
    } catch { /* ignore */ }
  }, []);

  const pick = (id: Intent) => {
    setIntent(id);
    setEditing(false);

    track('hero_intent_select', { intent: id });

    // Patient: Easy read on (search then defaults to recruiting studies). Others: registry language.
    setAudience(id === 'patient' ? 'patient' : 'clinical');

    // Dismiss the first-visit Audience modal so visitors aren't asked the
    // same question twice. Safe to call even if already seen.
    markAudiencePromptSeen();
  };

  if (intent && !editing) {
    const chosen = OPTIONS.find((o) => o.id === intent);
    if (!chosen) return null;
    return (
      <div className="mt-5 flex items-center gap-2 text-[13px] text-foreground/70">
        <Check className="h-4 w-4" style={{ color: 'hsl(var(--primary))' }} />
        <span>Thanks — showing this for <strong>{chosen.label}</strong>.</span>
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="inline-flex items-center gap-1 underline hover:text-foreground"
        >
          <Pencil className="h-3 w-3" /> change
        </button>
        {intent === 'patient' && (
          <a href="/medical-disclaimer" className="gov-link ml-2">Medical Disclaimer</a>
        )}
      </div>
    );
  }

  return (
    <div className="mt-5">
      <p className="text-[12px] font-bold uppercase tracking-wider mb-2 text-foreground/65">
        Why are you here?
      </p>
      <div className="flex flex-wrap gap-2">
        {OPTIONS.map((o) => (
          <button
            key={o.id}
            type="button"
            onClick={() => pick(o.id)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-sm border border-primary/30 bg-background text-[13px] font-semibold text-foreground/80 hover:bg-primary hover:text-white hover:border-primary transition-colors"
          >
            <o.icon className="h-3.5 w-3.5" />
            {o.label}
          </button>
        ))}
      </div>
    </div>
  );
};

export default HeroIntentChips;
