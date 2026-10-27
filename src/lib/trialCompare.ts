// Trial comparison helpers. Pure functions, unit tested.
// Every value comes straight from the ClinicalTrials.gov v2 record returned by
// ctg-trial-detail. Missing values stay missing (null) and are never filled in.
// No ranking, scoring or "winner" logic belongs here by design.

export const MIN_COMPARE = 2;
export const MAX_COMPARE = 4;

export interface CompareTrial {
  nctId: string;
  briefTitle?: string;
  status?: string;
  phase?: string[];
  studyType?: string;
  designInfo?: {
    allocation?: string;
    interventionModel?: string;
    observationalModel?: string;
    primaryPurpose?: string;
    masking?: string;
    timePerspective?: string;
  };
  interventions?: { type?: string; name?: string }[];
  eligibility?: { criteria?: string; sex?: string; minAge?: string; maxAge?: string; healthyVolunteers?: boolean };
  enrollment?: number | null;
  enrollmentType?: string;
  startDate?: string;
  completionDate?: string;
  leadSponsor?: { name?: string; class?: string };
  locations?: { facility?: string; city?: string; state?: string; country?: string }[];
  countries?: string[];
  ctgUrl?: string;
}

export type FieldKey =
  | 'phase' | 'status' | 'sponsor' | 'intervention' | 'enrollment' | 'eligibility'
  | 'age' | 'sex' | 'design' | 'startDate' | 'completionDate' | 'locations';

export interface FieldDef {
  key: FieldKey;
  label: string;
  source: string;
}

export const COMPARE_FIELDS: FieldDef[] = [
  { key: 'phase', label: 'Phase', source: 'designModule.phases' },
  { key: 'status', label: 'Recruitment status', source: 'statusModule.overallStatus' },
  { key: 'sponsor', label: 'Lead sponsor', source: 'sponsorCollaboratorsModule.leadSponsor' },
  { key: 'intervention', label: 'Intervention', source: 'armsInterventionsModule.interventions' },
  { key: 'enrollment', label: 'Enrollment', source: 'designModule.enrollmentInfo' },
  { key: 'age', label: 'Age range', source: 'eligibilityModule.minimumAge / maximumAge' },
  { key: 'sex', label: 'Sex', source: 'eligibilityModule.sex' },
  { key: 'design', label: 'Study design', source: 'designModule.studyType / designInfo' },
  { key: 'startDate', label: 'Start date', source: 'statusModule.startDateStruct' },
  { key: 'completionDate', label: 'Completion date', source: 'statusModule.completionDateStruct' },
  { key: 'locations', label: 'Locations', source: 'contactsLocationsModule.locations' },
  { key: 'eligibility', label: 'Eligibility criteria', source: 'eligibilityModule.eligibilityCriteria' },
];

const tidy = (v?: string | null) => (v ?? '').replace(/_/g, ' ').trim();
const title = (v?: string | null) => {
  const t = tidy(v).toLowerCase();
  return t ? t.charAt(0).toUpperCase() + t.slice(1) : '';
};

/** Display value for a field, or null when the registry record has nothing. */
export function fieldValue(t: CompareTrial, key: FieldKey): string | null {
  switch (key) {
    case 'phase': {
      const p = (t.phase ?? []).filter((x) => x && x !== 'NA').map((x) => x.replace(/^PHASE/, 'Phase ').replace('EARLY_Phase ', 'Early Phase '));
      if (p.length) return p.join(' / ');
      return (t.phase ?? []).includes('NA') ? 'Not applicable' : null;
    }
    case 'status': return title(t.status) || null;
    case 'sponsor': {
      const n = t.leadSponsor?.name?.trim();
      if (!n) return null;
      return t.leadSponsor?.class ? `${n} (${title(t.leadSponsor.class)})` : n;
    }
    case 'intervention': {
      const list = (t.interventions ?? []).filter((i) => i.name).map((i) => (i.type ? `${i.name} (${title(i.type)})` : i.name!));
      return list.length ? list.join('; ') : null;
    }
    case 'enrollment':
      if (t.enrollment == null) return null;
      return `${t.enrollment.toLocaleString('en-US')}${t.enrollmentType ? ` (${title(t.enrollmentType)})` : ''}`;
    case 'age': {
      const min = t.eligibility?.minAge?.trim();
      const max = t.eligibility?.maxAge?.trim();
      if (!min && !max) return null;
      return `${min || 'No minimum'} to ${max || 'no maximum'}`;
    }
    case 'sex': return title(t.eligibility?.sex) || null;
    case 'design': {
      const d = t.designInfo ?? {};
      const parts = [title(t.studyType), title(d.allocation), title(d.interventionModel || d.observationalModel), d.masking ? `Masking: ${title(d.masking)}` : '', title(d.primaryPurpose), title(d.timePerspective)].filter(Boolean);
      return parts.length ? parts.join(' · ') : null;
    }
    case 'startDate': return t.startDate?.trim() || null;
    case 'completionDate': return t.completionDate?.trim() || null;
    case 'locations': {
      const n = (t.locations ?? []).length;
      if (!n) return null;
      const countries = t.countries?.length ? t.countries : Array.from(new Set((t.locations ?? []).map((l) => l.country).filter(Boolean) as string[]));
      return `${n} site${n === 1 ? '' : 's'}${countries.length ? ` · ${countries.join(', ')}` : ''}`;
    }
    case 'eligibility': return t.eligibility?.criteria?.trim() || null;
  }
}

/** True when at least two trials report a value and those values differ, or
 *  when some trials report a value and others do not. */
export function fieldDiffers(trials: CompareTrial[], key: FieldKey): boolean {
  const vals = trials.map((t) => fieldValue(t, key)?.toLowerCase().replace(/\s+/g, ' ') ?? null);
  return new Set(vals).size > 1;
}

export function toggleSelection(selected: string[], nct: string): string[] {
  if (selected.includes(nct)) return selected.filter((x) => x !== nct);
  if (selected.length >= MAX_COMPARE) return selected;
  return [...selected, nct];
}
