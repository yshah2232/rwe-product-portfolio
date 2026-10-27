// Site geography helpers for compared trials. Pure functions, unit tested.
// Input is the contactsLocationsModule.locations list from each live
// ClinicalTrials.gov record. Missing facility data stays "not reported";
// it is never turned into a confirmed zero. No scoring or recommendations.

import type { CompareTrial } from './trialCompare';

export const US_STATE_FIPS: Record<string, string> = {
  Alabama: '01', Alaska: '02', Arizona: '04', Arkansas: '05', California: '06', Colorado: '08',
  Connecticut: '09', Delaware: '10', 'District of Columbia': '11', Florida: '12', Georgia: '13',
  Hawaii: '15', Idaho: '16', Illinois: '17', Indiana: '18', Iowa: '19', Kansas: '20', Kentucky: '21',
  Louisiana: '22', Maine: '23', Maryland: '24', Massachusetts: '25', Michigan: '26', Minnesota: '27',
  Mississippi: '28', Missouri: '29', Montana: '30', Nebraska: '31', Nevada: '32', 'New Hampshire': '33',
  'New Jersey': '34', 'New Mexico': '35', 'New York': '36', 'North Carolina': '37', 'North Dakota': '38',
  Ohio: '39', Oklahoma: '40', Oregon: '41', Pennsylvania: '42', 'Rhode Island': '44',
  'South Carolina': '45', 'South Dakota': '46', Tennessee: '47', Texas: '48', Utah: '49', Vermont: '50',
  Virginia: '51', Washington: '53', 'West Virginia': '54', Wisconsin: '55', Wyoming: '56', 'Puerto Rico': '72',
};

/** Census Bureau regions (official four region grouping). */
export const CENSUS_REGION: Record<string, string> = {};
const REGIONS: Record<string, string[]> = {
  Northeast: ['Connecticut', 'Maine', 'Massachusetts', 'New Hampshire', 'Rhode Island', 'Vermont', 'New Jersey', 'New York', 'Pennsylvania'],
  Midwest: ['Illinois', 'Indiana', 'Michigan', 'Ohio', 'Wisconsin', 'Iowa', 'Kansas', 'Minnesota', 'Missouri', 'Nebraska', 'North Dakota', 'South Dakota'],
  South: ['Delaware', 'District of Columbia', 'Florida', 'Georgia', 'Maryland', 'North Carolina', 'South Carolina', 'Virginia', 'West Virginia', 'Alabama', 'Kentucky', 'Mississippi', 'Tennessee', 'Arkansas', 'Louisiana', 'Oklahoma', 'Texas'],
  West: ['Arizona', 'Colorado', 'Idaho', 'Montana', 'Nevada', 'New Mexico', 'Utah', 'Wyoming', 'Alaska', 'California', 'Hawaii', 'Oregon', 'Washington'],
};
for (const [r, states] of Object.entries(REGIONS)) for (const s of states) CENSUS_REGION[s] = r;

const isUS = (c?: string) => /^(united states|usa|us)$/i.test((c ?? '').trim());
const normState = (s?: string) => {
  const t = (s ?? '').trim().toLowerCase();
  return Object.keys(US_STATE_FIPS).find((k) => k.toLowerCase() === t) ?? null;
};

export type SiteStatusKind = 'recruiting' | 'other' | 'unreported';
export const siteStatusKind = (s?: string): SiteStatusKind => {
  const t = (s ?? '').trim().toUpperCase();
  if (!t) return 'unreported';
  return t === 'RECRUITING' ? 'recruiting' : 'other';
};

export interface StateRow {
  state: string;
  fips: string;
  region: string;
  siteCount: number;
  recruitingSites: number;
  /** Sites in this state whose record gives no site level status. */
  statusUnreported: number;
  trials: string[];
}

export type TrialCoverage =
  | 'none_listed'        // record lists no facilities at all
  | 'non_us_only'        // facilities listed, none in the US
  | 'us'                 // at least one US site with a recognised state
  | 'us_state_missing';  // US sites listed but none with a usable state

export interface TrialGeoSummary {
  nctId: string;
  coverage: TrialCoverage;
  totalSites: number;
  usSites: number;
  usSitesWithoutState: number;
  nonUsSites: number;
  states: string[];
}

export interface GeographySummary {
  states: StateRow[];
  regions: { region: string; siteCount: number; recruitingSites: number; statusUnreported: number; trials: string[] }[];
  trials: TrialGeoSummary[];
}

export function summarizeGeography(trials: CompareTrial[]): GeographySummary {
  const byState = new Map<string, StateRow>();
  const trialSummaries: TrialGeoSummary[] = trials.map((t) => {
    const locs = (t.locations ?? []) as { state?: string; country?: string; status?: string }[];
    let us = 0, usNoState = 0, nonUs = 0;
    const states = new Set<string>();
    for (const l of locs) {
      if (!isUS(l.country)) { nonUs += 1; continue; }
      us += 1;
      const st = normState(l.state);
      if (!st) { usNoState += 1; continue; }
      states.add(st);
      const row = byState.get(st) ?? {
        state: st, fips: US_STATE_FIPS[st], region: CENSUS_REGION[st] ?? 'Territory',
        siteCount: 0, recruitingSites: 0, statusUnreported: 0, trials: [],
      };
      row.siteCount += 1;
      const k = siteStatusKind(l.status);
      if (k === 'recruiting') row.recruitingSites += 1;
      if (k === 'unreported') row.statusUnreported += 1;
      if (!row.trials.includes(t.nctId)) row.trials.push(t.nctId);
      byState.set(st, row);
    }
    const coverage: TrialCoverage = locs.length === 0 ? 'none_listed'
      : us === 0 ? 'non_us_only'
      : states.size === 0 ? 'us_state_missing' : 'us';
    return { nctId: t.nctId, coverage, totalSites: locs.length, usSites: us, usSitesWithoutState: usNoState, nonUsSites: nonUs, states: [...states].sort() };
  });

  const states = [...byState.values()].sort((a, b) => b.siteCount - a.siteCount || a.state.localeCompare(b.state));
  const regionMap = new Map<string, GeographySummary['regions'][number]>();
  for (const s of states) {
    const r = regionMap.get(s.region) ?? { region: s.region, siteCount: 0, recruitingSites: 0, statusUnreported: 0, trials: [] };
    r.siteCount += s.siteCount;
    r.recruitingSites += s.recruitingSites;
    r.statusUnreported += s.statusUnreported;
    for (const n of s.trials) if (!r.trials.includes(n)) r.trials.push(n);
    regionMap.set(s.region, r);
  }
  return { states, regions: [...regionMap.values()].sort((a, b) => b.siteCount - a.siteCount), trials: trialSummaries };
}

/** Tile grid positions [col,row] for a compact US state map. */
export const STATE_TILES: Record<string, [number, number, string]> = {
  Alaska: [0, 0, 'AK'], Maine: [11, 0, 'ME'],
  Vermont: [10, 1, 'VT'], 'New Hampshire': [11, 1, 'NH'],
  Washington: [1, 2, 'WA'], Idaho: [2, 2, 'ID'], Montana: [3, 2, 'MT'], 'North Dakota': [4, 2, 'ND'], Minnesota: [5, 2, 'MN'], Illinois: [6, 2, 'IL'], Wisconsin: [7, 2, 'WI'], Michigan: [8, 2, 'MI'], 'New York': [9, 2, 'NY'], 'Rhode Island': [10, 2, 'RI'], Massachusetts: [11, 2, 'MA'],
  Oregon: [1, 3, 'OR'], Nevada: [2, 3, 'NV'], Wyoming: [3, 3, 'WY'], 'South Dakota': [4, 3, 'SD'], Iowa: [5, 3, 'IA'], Indiana: [6, 3, 'IN'], Ohio: [7, 3, 'OH'], Pennsylvania: [8, 3, 'PA'], 'New Jersey': [9, 3, 'NJ'], Connecticut: [10, 3, 'CT'],
  California: [1, 4, 'CA'], Utah: [2, 4, 'UT'], Colorado: [3, 4, 'CO'], Nebraska: [4, 4, 'NE'], Missouri: [5, 4, 'MO'], Kentucky: [6, 4, 'KY'], 'West Virginia': [7, 4, 'WV'], Virginia: [8, 4, 'VA'], Maryland: [9, 4, 'MD'], Delaware: [10, 4, 'DE'],
  Arizona: [2, 5, 'AZ'], 'New Mexico': [3, 5, 'NM'], Kansas: [4, 5, 'KS'], Arkansas: [5, 5, 'AR'], Tennessee: [6, 5, 'TN'], 'North Carolina': [7, 5, 'NC'], 'South Carolina': [8, 5, 'SC'], 'District of Columbia': [9, 5, 'DC'],
  Hawaii: [0, 6, 'HI'], Oklahoma: [4, 6, 'OK'], Louisiana: [5, 6, 'LA'], Mississippi: [6, 6, 'MS'], Alabama: [7, 6, 'AL'], Georgia: [8, 6, 'GA'],
  Texas: [4, 7, 'TX'], Florida: [9, 7, 'FL'], 'Puerto Rico': [11, 7, 'PR'],
};
