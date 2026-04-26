// "Who actually enrolled in THIS trial" — pulled from CTG.gov posted results
// (BaselineCharacteristicsModule). If the trial hasn't reported results yet,
// we render a clear empty state. We never model, infer, or borrow from other
// trials — the source is always this one trial's record.

import { Users, ExternalLink } from 'lucide-react';
import type { Demographics } from '@/lib/usePlainTrial';

interface Props { demographics: Demographics; nctId: string }

export default function EnrollmentDemographics({ demographics, nctId }: Props) {
  if (!demographics) return null;

  if (!demographics.reported) {
    return (
      <div className="rounded-sm border border-dashed border-border bg-muted/20 p-3">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/80 mb-1 flex items-center gap-1.5">
          <Users className="h-3 w-3" /> Who has enrolled
        </p>
        <p className="text-[12.5px] text-muted-foreground leading-snug">
          {demographics.source_note}{' '}
          <a
            href={`https://clinicaltrials.gov/study/${nctId}#participant-flow`}
            target="_blank"
            rel="noreferrer"
            className="underline"
            style={{ color: 'hsl(var(--primary))' }}
          >
            Check ClinicalTrials.gov for updates <ExternalLink className="h-3 w-3 inline" />
          </a>
        </p>
      </div>
    );
  }

  const sex = demographics.sex ?? {};
  const age = demographics.age ?? {};
  const race = demographics.race ?? {};
  const ethnicity = demographics.ethnicity ?? {};

  const topRace = Object.entries(race).sort((a, b) => b[1] - a[1]).slice(0, 4);
  const topEth = Object.entries(ethnicity).sort((a, b) => b[1] - a[1]).slice(0, 3);

  return (
    <div className="rounded-sm border border-border bg-card overflow-hidden">
      <div className="px-4 py-3 border-b border-border/60 bg-accent/30 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users className="h-3.5 w-3.5" style={{ color: 'hsl(var(--primary))' }} />
          <p className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: 'hsl(var(--primary))' }}>
            Who has enrolled in this trial
          </p>
        </div>
        {demographics.total_participants && (
          <span className="text-[11px] text-muted-foreground">
            {demographics.total_participants.toLocaleString()} participants reported
          </span>
        )}
      </div>

      <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
        {(sex.female_pct !== undefined || sex.male_pct !== undefined) && (
          <Stat
            label="Sex"
            primary={
              sex.female_pct !== undefined && sex.male_pct !== undefined
                ? `${sex.female_pct}% female · ${sex.male_pct}% male`
                : sex.female_pct !== undefined
                ? `${sex.female_pct}% female`
                : `${sex.male_pct}% male`
            }
          />
        )}
        {(age.mean !== undefined || age.median !== undefined) && (
          <Stat
            label="Age"
            primary={
              age.mean !== undefined ? `Average ${age.mean} yrs` : age.median !== undefined ? `Median ${age.median} yrs` : '—'
            }
          />
        )}
        {(age.under_65_pct !== undefined || age.over_65_pct !== undefined) && (
          <Stat
            label="Age groups"
            primary={
              age.under_65_pct !== undefined && age.over_65_pct !== undefined
                ? `${age.under_65_pct}% under 65 · ${age.over_65_pct}% 65+`
                : age.over_65_pct !== undefined
                ? `${age.over_65_pct}% aged 65+`
                : `${age.under_65_pct}% under 65`
            }
          />
        )}
        {topRace.length > 0 && (
          <Stat
            label="Race"
            primary={topRace.map(([k, v]) => `${v}% ${shortenRace(k)}`).join(' · ')}
          />
        )}
        {topEth.length > 0 && (
          <Stat
            label="Ethnicity"
            primary={topEth.map(([k, v]) => `${v}% ${k}`).join(' · ')}
          />
        )}
      </div>

      <p className="px-4 pb-3 text-[10.5px] text-muted-foreground italic leading-snug">
        Source: {demographics.source_note}{' '}
        <a
          href={`https://clinicaltrials.gov/study/${nctId}#participant-flow`}
          target="_blank"
          rel="noreferrer"
          className="underline"
          style={{ color: 'hsl(var(--primary))' }}
        >
          View on ClinicalTrials.gov <ExternalLink className="h-3 w-3 inline" />
        </a>
      </p>
    </div>
  );
}

function Stat({ label, primary }: { label: string; primary: string }) {
  return (
    <div className="rounded-sm border border-border/60 bg-background p-3">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">{label}</p>
      <p className="text-[13px] text-foreground leading-snug">{primary}</p>
    </div>
  );
}

function shortenRace(k: string): string {
  return k
    .replace(/American Indian or Alaska Native/i, 'AI/AN')
    .replace(/Native Hawaiian or Other Pacific Islander/i, 'NH/PI')
    .replace(/Black or African American/i, 'Black/AA')
    .replace(/White/i, 'White')
    .replace(/Asian/i, 'Asian')
    .replace(/More than one race/i, 'Multiracial')
    .replace(/Unknown or Not Reported/i, 'Unknown');
}
