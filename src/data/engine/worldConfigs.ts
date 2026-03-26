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

// World-specific specialties (from Excel data)
export const SPECIALTIES: Record<TherapeuticWorld, string[]> = {
  glp1: ['Endocrinology', 'PrimaryCare', 'InternalMed', 'Cardiology'],
  nsclc: ['Oncology', 'Pulmonology', 'Pathology', 'Radiology', 'PrimaryCare'],
  alzheimer: ['Neurology', 'PrimaryCare', 'Geriatrics', 'Radiology'],
};

// World-specific real clinical codes (from CODESETS sheets)
export const CODESETS: Record<TherapeuticWorld, { codeSystem: string; code: string; description: string; sourceURL: string }[]> = {
  glp1: [
    { codeSystem: 'ICD10', code: 'E11.9', description: 'Type 2 diabetes mellitus without complications', sourceURL: 'https://icd10coded.com/cm/E11.9/' },
    { codeSystem: 'ICD10', code: 'E66.9', description: 'Obesity, unspecified', sourceURL: 'https://www.aapc.com/codes/icd-10-codes/E66.9' },
    { codeSystem: 'ICD10', code: 'I10', description: 'Essential hypertension', sourceURL: 'https://www.icd-codes.org/10-cm/code/I10' },
    { codeSystem: 'ICD10', code: 'E78.5', description: 'Hyperlipidemia, unspecified', sourceURL: 'https://icd10coded.com/cm/E78.5/' },
    { codeSystem: 'LOINC', code: '4548-4', description: 'HbA1c', sourceURL: 'https://loinc.org/4548-4' },
    { codeSystem: 'LOINC', code: '39156-5', description: 'Body mass index (BMI)', sourceURL: 'https://loinc.org/39156-5' },
    { codeSystem: 'LOINC', code: '13457-7', description: 'LDL cholesterol (calc)', sourceURL: 'https://loinc.org/13457-7' },
    { codeSystem: 'CPT', code: '99213', description: 'Office visit (established patient)', sourceURL: 'https://www.aapc.com/codes/cpt-codes/99213' },
    { codeSystem: 'CPT', code: '99214', description: 'Office visit (established patient)', sourceURL: 'https://www.aapc.com/codes/cpt-codes/99214' },
    { codeSystem: 'CPT', code: '83036', description: 'HbA1c test', sourceURL: 'https://www.aapc.com/codes/cpt-codes/83036' },
    { codeSystem: 'CPT', code: '80061', description: 'Lipid panel', sourceURL: 'https://www.aapc.com/codes/cpt-codes/80061' },
    { codeSystem: 'NDC', code: '0169-4132', description: 'Ozempic (semaglutide)', sourceURL: 'https://fda.report/NDC/0169-4132' },
    { codeSystem: 'NDC', code: '0169-4525', description: 'Wegovy (semaglutide)', sourceURL: 'https://fda.report/NDC/0169-4525' },
    { codeSystem: 'NDC', code: '0169-2800', description: 'Saxenda (liraglutide)', sourceURL: 'https://fda.report/NDC/0169-2800' },
    { codeSystem: 'NDC', code: '0002-3002', description: 'Mounjaro (tirzepatide)', sourceURL: 'https://healthprovidersdata.com/hipaa/codes/NDC_0002-3002.aspx' },
  ],
  nsclc: [
    { codeSystem: 'ICD10', code: 'C34.90', description: 'Lung cancer NOS', sourceURL: 'https://www.aapc.com/codes/icd-10-codes/C34.90' },
    { codeSystem: 'ICD10', code: 'C79.31', description: 'Secondary malignant neoplasm of brain', sourceURL: 'https://icd10coded.com/cm/C79.31/' },
    { codeSystem: 'ICD10', code: 'C79.51', description: 'Secondary malignant neoplasm of bone', sourceURL: 'https://icd10coded.com/cm/C79.51/' },
    { codeSystem: 'ICD10', code: 'Z51.11', description: 'Encounter for antineoplastic chemotherapy', sourceURL: 'https://icd10coded.com/cm/Z51.11/' },
    { codeSystem: 'ICD10', code: 'Z51.12', description: 'Encounter for antineoplastic immunotherapy', sourceURL: 'https://icd10coded.com/cm/z51.12' },
    { codeSystem: 'CPT', code: '81235', description: 'EGFR gene analysis', sourceURL: 'https://www.aapc.com/codes/cpt-codes/81235' },
    { codeSystem: 'CPT', code: '81455', description: 'NGS panel, large', sourceURL: 'https://www.aapc.com/codes/cpt-codes/81455' },
    { codeSystem: 'CPT', code: '88360', description: 'IHC quantification', sourceURL: 'https://www.aapc.com/codes/cpt-codes/88360' },
    { codeSystem: 'CPT', code: '71260', description: 'CT chest w contrast', sourceURL: 'https://www.aapc.com/codes/cpt-codes/71260' },
    { codeSystem: 'CPT', code: '70553', description: 'MRI brain w/wo contrast', sourceURL: 'https://www.aapc.com/codes/cpt-codes/70553' },
    { codeSystem: 'CPT', code: '78815', description: 'PET imaging', sourceURL: 'https://www.aapc.com/codes/cpt-codes/78815' },
    { codeSystem: 'HCPCS', code: 'J9271', description: 'Pembrolizumab injection, 1 mg', sourceURL: 'https://hcpcs.codes/j-codes/J9271/' },
    { codeSystem: 'HCPCS', code: 'J9299', description: 'Nivolumab injection, 1 mg', sourceURL: 'https://hcpcs.codes/j-codes/J9299/' },
    { codeSystem: 'NDC', code: '0310-1350', description: 'Tagrisso (osimertinib)', sourceURL: 'https://www.drugs.com/pro/tagrisso.html' },
  ],
  alzheimer: [
    { codeSystem: 'ICD10', code: 'G30.9', description: "Alzheimer's disease, unspecified", sourceURL: 'https://www.icd-codes.org/10-cm/code/G30.9' },
    { codeSystem: 'ICD10', code: 'G31.84', description: 'Mild cognitive impairment', sourceURL: 'https://www.icd-codes.org/10-cm/code/G31.84' },
    { codeSystem: 'CPT', code: '96116', description: 'Neurobehavioral status exam', sourceURL: 'https://www.aapc.com/codes/cpt-codes/96116' },
    { codeSystem: 'CPT', code: '70551', description: 'MRI brain w/o contrast', sourceURL: 'https://www.aapc.com/codes/cpt-codes/70551' },
    { codeSystem: 'CPT', code: '70450', description: 'CT head w/o contrast', sourceURL: 'https://www.aapc.com/codes/cpt-codes/70450' },
    { codeSystem: 'HCPCS', code: 'J0174', description: 'Lecanemab injection, 1 mg', sourceURL: 'https://hcpcs.codes/j-codes/J0174/' },
    { codeSystem: 'NDC', code: '33342-028', description: 'Donepezil HCl tablets', sourceURL: 'https://fda.report/NDC/33342-028' },
    { codeSystem: 'NDC', code: '27241-071', description: 'Memantine HCl tablets', sourceURL: 'https://fda.report/NDC/27241-071' },
  ],
};

// World-specific calibration parameters (from PARAMETERS sheets, anchored to published studies)
export const CALIBRATION_PARAMS: Record<TherapeuticWorld, { parameter: string; value: string | number; unit: string; notes: string; sourceURL: string }[]> = {
  glp1: [
    { parameter: 'cohortSize', value: 3000, unit: 'patients', notes: 'Synthetic cohort size', sourceURL: 'internal' },
    { parameter: 'timelineMonths', value: '2023-01 to 2024-12', unit: 'month', notes: 'Monthly timeline for events', sourceURL: 'internal' },
    { parameter: 'medianPersistenceMonths', value: 10.7, unit: 'months', notes: 'Median persistence reported in an academic obesity clinic cohort', sourceURL: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC12515774/' },
    { parameter: 'discontinuationBy12Months', value: 0.5, unit: 'proportion', notes: 'Approx. 50% discontinued by 12 months in the same cohort', sourceURL: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC12515774/' },
  ],
  nsclc: [
    { parameter: 'cohortSize', value: 2500, unit: 'patients', notes: 'Synthetic cohort size', sourceURL: 'internal' },
    { parameter: 'biomarkerTestingWithin90Days_rate', value: 0.67, unit: 'proportion', notes: 'Advanced NSCLC patients with ALK+EGFR+PD-L1 testing within 90 days', sourceURL: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC11371103/' },
    { parameter: 'pembroMedianTimeOnTreatmentMonths', value: 7.4, unit: 'months', notes: 'Real-world time on treatment median in ECOG PS 0-1 cohort', sourceURL: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC8870405/' },
    { parameter: 'pembroOnTreatmentRate_12mo', value: 0.36, unit: 'proportion', notes: 'On-treatment rate at 12 months (PS 0-1)', sourceURL: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC8870405/' },
    { parameter: 'NGS_testing_adoption_2020', value: 0.681, unit: 'proportion', notes: 'NGS-based biomarker testing adoption up to 2020', sourceURL: 'https://www.sciencedirect.com/science/article/pii/S2666364322000601' },
  ],
  alzheimer: [
    { parameter: 'cohortSize', value: 2500, unit: 'patients', notes: 'Synthetic cohort size', sourceURL: 'internal' },
    { parameter: 'lecanemab_ARIA_rate', value: 0.068, unit: 'proportion', notes: 'ARIA incidence from a single-center real-world study', sourceURL: 'https://www.sciencedirect.com/science/article/pii/S2666245025001394' },
    { parameter: 'lecanemab_persistence_approx_9mo', value: 0.9, unit: 'proportion', notes: '28 of 31 patients remained on therapy by ~9 months', sourceURL: 'https://www.sciencedirect.com/science/article/pii/S2666245025001394' },
    { parameter: 'lecanemab_HCPCS_code', value: 'J0174', unit: 'HCPCS', notes: 'Billing code reference for Leqembi', sourceURL: 'https://hcpcs.codes/j-codes/J0174/' },
  ],
};

// World-specific org types (from Excel data)
export const ORG_TYPES: Record<TherapeuticWorld, string[]> = {
  glp1: ['HealthSystem', 'Independent', 'Clinic'],
  nsclc: ['HealthSystem', 'CancerCenter', 'Independent'],
  alzheimer: ['HealthSystem', 'Independent', 'MemoryClinic'],
};
