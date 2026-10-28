import type { CompareTrial } from './trialCompare';
import { COMPARE_FIELDS, fieldDiffers, fieldValue } from './trialCompare';
import { summarizeGeography } from './trialGeography';

export type AcsData = { total_population?: number | null; pop_hispanic?: number | null; pop_black_nh?: number | null; pop_asian_nh?: number | null; pop_age_65plus?: number | null; median_household_income?: number | null; source_url?: string; acs_year?: number };
export type AcsRow = { state: string; data?: AcsData; error?: string };
export type ReportPopulation = { loading: boolean; rows: AcsRow[]; year?: number; error?: string };

/** Deterministic observations only. Never an eligibility verdict or trial ranking. */
export function reportInsights(trials: CompareTrial[]) {
  const differences = COMPARE_FIELDS.filter((f) => !['eligibility', 'locations'].includes(f.key) && fieldDiffers(trials, f.key));
  const geo = summarizeGeography(trials);
  return {
    trialCount: trials.length,
    differenceCount: differences.length,
    stateCount: geo.states.length,
    items: [
      { title: 'Recruitment snapshot', text: trials.map((t) => `${t.nctId}: ${fieldValue(t, 'status') ?? 'not reported'}`).join('. '), source: 'statusModule.overallStatus' },
      { title: differences.length ? 'Where the records differ' : 'Reported fields align', text: differences.length ? `${differences.map((f) => f.label).join(', ')} differ across the selected records. Missing fields can also create a difference.` : 'No differences in the concise comparison fields. This does not mean the trials are equivalent.', source: differences.map((f) => f.source).join('; ') || 'ClinicalTrials.gov comparison fields' },
      { title: 'US site footprint', text: geo.states.length ? `Listed US facilities span ${geo.states.length} states or territories and ${geo.regions.length} Census region groups. These are site listings, not patient counts or unique facilities across trials.` : 'No selected record lists a US facility with a recognized state. Population context cannot be resolved from these records.', source: 'contactsLocationsModule.locations' },
    ],
  };
}

export function populationPercent(value?: number | null, total?: number | null) {
  return value == null || total == null || total <= 0 ? 'Not reported' : `${(value / total * 100).toFixed(1)}%`;
}