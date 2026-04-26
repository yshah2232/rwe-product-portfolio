// Horizontal timeline visualizing a participant's journey from Day 0 → end of study.
// Steps are AI-extracted (cached) from the protocol. Falls back gracefully if empty.

import { CheckCircle2, ClipboardCheck, Syringe, Activity, PhoneCall, Flag, Stethoscope } from 'lucide-react';
import type { JourneyStep } from '@/lib/usePlainTrial';

const KIND_META: Record<string, { icon: typeof CheckCircle2; color: string; label: string }> = {
  screening:   { icon: ClipboardCheck, color: '#0b6cb7', label: 'Screening' },
  enrollment:  { icon: CheckCircle2,  color: '#0b6cb7', label: 'Enrollment' },
  treatment:   { icon: Syringe,       color: '#1aa97e', label: 'Treatment' },
  monitoring:  { icon: Activity,      color: '#d97706', label: 'Monitoring' },
  followup:    { icon: PhoneCall,     color: '#7c3aed', label: 'Follow-up' },
  end:         { icon: Flag,          color: '#475569', label: 'End' },
};

export default function TrialJourney({ steps }: { steps: JourneyStep[] }) {
  if (!steps || steps.length === 0) return null;

  return (
    <div className="rounded-sm border border-border bg-card overflow-hidden">
      <div className="px-4 py-3 border-b border-border/60 bg-accent/30 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Stethoscope className="h-3.5 w-3.5" style={{ color: 'hsl(var(--primary))' }} />
          <p className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: 'hsl(var(--primary))' }}>
            Your journey, day by day
          </p>
        </div>
        <span className="text-[10.5px] text-muted-foreground italic">From the public protocol — your actual schedule may differ</span>
      </div>

      <div className="relative px-4 py-5 overflow-x-auto">
        {/* Connector line */}
        <div
          className="absolute left-4 right-4 h-0.5 top-[42px]"
          style={{ background: 'linear-gradient(90deg, hsl(var(--primary)/0.3), hsl(var(--primary)/0.6), hsl(var(--primary)/0.3))' }}
        />

        <ol className="relative flex gap-3 min-w-max">
          {steps.map((s, i) => {
            const meta = KIND_META[s.kind] ?? KIND_META.monitoring;
            const Icon = meta.icon;
            return (
              <li key={i} className="flex flex-col items-center w-[150px]">
                {/* Day/marker */}
                <span className="text-[10.5px] font-mono font-semibold text-muted-foreground mb-1.5 truncate max-w-full">
                  {s.label || `Step ${i + 1}`}
                </span>
                {/* Node */}
                <div
                  className="relative z-10 h-9 w-9 rounded-full flex items-center justify-center border-2 bg-background shadow-sm"
                  style={{ borderColor: meta.color, color: meta.color }}
                  aria-label={meta.label}
                >
                  <Icon className="h-4 w-4" />
                </div>
                {/* Title + detail */}
                <p className="text-[12px] font-semibold text-foreground mt-2 text-center leading-tight line-clamp-2">
                  {s.title}
                </p>
                <p className="text-[11px] text-muted-foreground mt-1 text-center leading-snug line-clamp-3">
                  {s.detail}
                </p>
              </li>
            );
          })}
        </ol>
      </div>
    </div>
  );
}
