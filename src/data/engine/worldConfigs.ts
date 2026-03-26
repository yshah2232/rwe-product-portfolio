import type { TherapeuticWorld, WorldMeta } from './types';

export const WORLD_META: Record<TherapeuticWorld, WorldMeta> = {
  glp1: {
    id: 'glp1',
    label: 'GLP 1 Obesity & Cardiometabolic',
    shortLabel: 'GLP 1',
    description: 'Longitudinal analysis of GLP 1 receptor agonist adoption, persistence, and payer dynamics across obesity and type 2 diabetes populations.',
    color: 'hsl(262 60% 50%)',
  },
  nsclc: {
    id: 'nsclc',
    label: 'Oncology NSCLC',
    shortLabel: 'NSCLC',
    description: 'Non small cell lung cancer treatment patterns including biomarker testing rates, line sequencing, and time to treatment.',
    color: 'hsl(200 80% 45%)',
  },
  alzheimer: {
    id: 'alzheimer',
    label: 'Neuroscience Alzheimer',
    shortLabel: 'Alzheimer',
    description: 'Alzheimer disease treatment initiation, cognitive assessment cadence, and access friction across payer segments.',
    color: 'hsl(340 65% 50%)',
  },
};

export const US_STATES = [
  'AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA',
  'HI','ID','IL','IN','IA','KS','KY','LA','ME','MD',
  'MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ',
  'NM','NY','NC','ND','OH','OK','OR','PA','RI','SC',
  'SD','TN','TX','UT','VT','VA','WA','WV','WI','WY',
];

// Population-weighted state distribution (approximate)
export const STATE_WEIGHTS: Record<string, number> = {
  CA: 0.118, TX: 0.087, FL: 0.065, NY: 0.060, PA: 0.039,
  IL: 0.038, OH: 0.035, GA: 0.032, NC: 0.031, MI: 0.030,
  NJ: 0.027, VA: 0.026, WA: 0.023, AZ: 0.022, MA: 0.021,
  TN: 0.021, IN: 0.020, MO: 0.018, MD: 0.018, WI: 0.017,
  CO: 0.017, MN: 0.017, SC: 0.015, AL: 0.015, LA: 0.014,
  KY: 0.013, OR: 0.013, OK: 0.012, CT: 0.011, UT: 0.010,
  IA: 0.009, NV: 0.009, AR: 0.009, MS: 0.009, KS: 0.009,
  NM: 0.006, NE: 0.006, ID: 0.006, WV: 0.005, HI: 0.004,
  NH: 0.004, ME: 0.004, MT: 0.003, RI: 0.003, DE: 0.003,
  SD: 0.003, ND: 0.002, AK: 0.002, VT: 0.002, WY: 0.002,
};

// World-specific specialties
export const SPECIALTIES: Record<TherapeuticWorld, string[]> = {
  glp1: ['Endocrinology', 'Internal Medicine', 'Family Medicine', 'Cardiology', 'Obesity Medicine'],
  nsclc: ['Medical Oncology', 'Pulmonology', 'Thoracic Surgery', 'Radiation Oncology', 'Pathology'],
  alzheimer: ['Neurology', 'Geriatrics', 'Psychiatry', 'Internal Medicine', 'Family Medicine'],
};

// World-specific drug/treatment codes
export const DRUG_CODES: Record<TherapeuticWorld, { code: string; label: string }[]> = {
  glp1: [
    { code: 'NDC_SEMA_INJ', label: 'Semaglutide injectable' },
    { code: 'NDC_SEMA_ORAL', label: 'Semaglutide oral' },
    { code: 'NDC_TIRZ', label: 'Tirzepatide' },
    { code: 'NDC_LIRA', label: 'Liraglutide' },
    { code: 'NDC_DULA', label: 'Dulaglutide' },
    { code: 'NDC_MET', label: 'Metformin (comparator)' },
    { code: 'NDC_SGLT2', label: 'SGLT2 inhibitor (comparator)' },
  ],
  nsclc: [
    { code: 'NDC_PEMBRO', label: 'Pembrolizumab' },
    { code: 'NDC_NIVO', label: 'Nivolumab' },
    { code: 'NDC_ATEZO', label: 'Atezolizumab' },
    { code: 'NDC_OSIMER', label: 'Osimertinib' },
    { code: 'NDC_CARBO', label: 'Carboplatin' },
    { code: 'NDC_PACLI', label: 'Paclitaxel' },
  ],
  alzheimer: [
    { code: 'NDC_LECAN', label: 'Lecanemab' },
    { code: 'NDC_ADUCA', label: 'Aducanumab' },
    { code: 'NDC_DONE', label: 'Donepezil' },
    { code: 'NDC_MEMA', label: 'Memantine' },
    { code: 'NDC_GALANT', label: 'Galantamine' },
  ],
};

// World-specific diagnosis codes
export const DIAGNOSIS_CODES: Record<TherapeuticWorld, { code: string; label: string }[]> = {
  glp1: [
    { code: 'DX_T2D', label: 'Type 2 diabetes proxy' },
    { code: 'DX_OBESITY', label: 'Obesity proxy' },
    { code: 'DX_CVD', label: 'Cardiovascular disease proxy' },
    { code: 'DX_NASH', label: 'NASH proxy' },
  ],
  nsclc: [
    { code: 'DX_NSCLC', label: 'NSCLC proxy' },
    { code: 'DX_METS', label: 'Metastatic disease proxy' },
    { code: 'DX_BRAIN_MET', label: 'Brain metastasis proxy' },
  ],
  alzheimer: [
    { code: 'DX_ALZ_EARLY', label: 'Early stage Alzheimer proxy' },
    { code: 'DX_ALZ_MOD', label: 'Moderate Alzheimer proxy' },
    { code: 'DX_MCI', label: 'Mild cognitive impairment proxy' },
  ],
};

// World-specific lab codes
export const LAB_CODES: Record<TherapeuticWorld, { code: string; label: string }[]> = {
  glp1: [
    { code: 'LAB_A1C', label: 'A1c test' },
    { code: 'LAB_BMI', label: 'BMI measurement proxy' },
    { code: 'LAB_LIPID', label: 'Lipid panel proxy' },
    { code: 'LAB_EGFR', label: 'eGFR kidney function' },
  ],
  nsclc: [
    { code: 'LAB_PDL1', label: 'PD L1 expression test' },
    { code: 'LAB_EGFR_MUT', label: 'EGFR mutation test' },
    { code: 'LAB_ALK', label: 'ALK rearrangement test' },
    { code: 'LAB_NGS', label: 'Next gen sequencing panel' },
  ],
  alzheimer: [
    { code: 'LAB_AMYLOID', label: 'Amyloid PET proxy' },
    { code: 'LAB_TAU', label: 'Tau PET proxy' },
    { code: 'LAB_CSF', label: 'CSF biomarker proxy' },
    { code: 'LAB_COGTEST', label: 'Cognitive assessment score' },
    { code: 'LAB_MRI', label: 'Brain MRI proxy' },
  ],
};

// World-specific distribution parameters
export interface WorldDistribution {
  ageBandWeights: Record<string, number>;
  comorbidityMean: number;
  comorbidityStd: number;
  avgEventsPerPatient: number;
  avgLinesPerPatient: number;
  baseTimeToStartDays: number;
  basePdc: number;
  baseRefillGapDays: number;
  baseSwitchRate: number;
  baseDiscontinueRate: number;
}

export const WORLD_DISTRIBUTIONS: Record<TherapeuticWorld, WorldDistribution> = {
  glp1: {
    ageBandWeights: { '18_29': 0.05, '30_39': 0.12, '40_49': 0.22, '50_59': 0.28, '60_69': 0.22, '70_79': 0.08, '80_plus': 0.03 },
    comorbidityMean: 3.5,
    comorbidityStd: 2.0,
    avgEventsPerPatient: 18,
    avgLinesPerPatient: 1.4,
    baseTimeToStartDays: 14,
    basePdc: 0.72,
    baseRefillGapDays: 8,
    baseSwitchRate: 0.18,
    baseDiscontinueRate: 0.35,
  },
  nsclc: {
    ageBandWeights: { '18_29': 0.01, '30_39': 0.02, '40_49': 0.08, '50_59': 0.22, '60_69': 0.35, '70_79': 0.25, '80_plus': 0.07 },
    comorbidityMean: 5.0,
    comorbidityStd: 2.5,
    avgEventsPerPatient: 28,
    avgLinesPerPatient: 2.2,
    baseTimeToStartDays: 21,
    basePdc: 0.85,
    baseRefillGapDays: 3,
    baseSwitchRate: 0.40,
    baseDiscontinueRate: 0.25,
  },
  alzheimer: {
    ageBandWeights: { '18_29': 0.00, '30_39': 0.00, '40_49': 0.02, '50_59': 0.08, '60_69': 0.25, '70_79': 0.40, '80_plus': 0.25 },
    comorbidityMean: 4.2,
    comorbidityStd: 2.2,
    avgEventsPerPatient: 14,
    avgLinesPerPatient: 1.2,
    baseTimeToStartDays: 45,
    basePdc: 0.65,
    baseRefillGapDays: 14,
    baseSwitchRate: 0.12,
    baseDiscontinueRate: 0.42,
  },
};
