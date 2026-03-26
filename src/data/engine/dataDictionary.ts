export interface FieldDef {
  field: string;
  type: string;
  description: string;
  example: string;
  trustKind: 'observed' | 'inferred';
}

export interface DatasetDef {
  name: string;
  description: string;
  recordCount: string;
  fields: FieldDef[];
}

export const DATA_DICTIONARY: DatasetDef[] = [
  {
    name: 'Providers',
    description: 'Synthetic healthcare providers. All IDs are fictional 10 digit numbers that do not match real NPIs.',
    recordCount: '500 per world',
    fields: [
      { field: 'providerId', type: 'string', description: 'Fictional 10 digit provider identifier. Not a real NPI.', example: '9012345678', trustKind: 'observed' },
      { field: 'specialty', type: 'string', description: 'Clinical specialty relevant to the therapeutic world.', example: 'Endocrinology', trustKind: 'observed' },
      { field: 'state', type: 'string', description: 'US state abbreviation. Distributed by Census population weights.', example: 'CA', trustKind: 'observed' },
      { field: 'orgType', type: 'enum', description: 'Organization type: academic, community, or integrated.', example: 'community', trustKind: 'observed' },
      { field: 'volumeTier', type: 'enum', description: 'Prescribing volume tier: low, medium, or high.', example: 'medium', trustKind: 'inferred' },
      { field: 'adoptionSegment', type: 'enum', description: 'Innovation adoption category: early adopter, mainstream, or laggard.', example: 'mainstream', trustKind: 'inferred' },
      { field: 'investigatorFlag', type: 'boolean', description: 'Whether the provider participates in clinical trials.', example: 'false', trustKind: 'observed' },
      { field: 'publicationsCount', type: 'number', description: 'Count of publications. Synthetic proxy.', example: '5', trustKind: 'observed' },
      { field: 'referralHubScore', type: 'number', description: 'Score from 0 to 100 indicating referral network centrality.', example: '72', trustKind: 'inferred' },
    ],
  },
  {
    name: 'Payers',
    description: 'Synthetic payer plan configurations representing coverage and access friction patterns.',
    recordCount: '200 per world',
    fields: [
      { field: 'payerSegment', type: 'enum', description: 'Payer type: commercial, medicare, medicaid, or cash.', example: 'commercial', trustKind: 'observed' },
      { field: 'planType', type: 'enum', description: 'Insurance plan type: HMO, PPO, POS, HDHP, or fee for service.', example: 'ppo', trustKind: 'observed' },
      { field: 'formularyTier', type: 'enum', description: 'Drug formulary placement: preferred, non preferred, specialty, or not covered.', example: 'specialty', trustKind: 'observed' },
      { field: 'priorAuthFlag', type: 'boolean', description: 'Whether prior authorization is required.', example: 'true', trustKind: 'observed' },
      { field: 'stepTherapyFlag', type: 'boolean', description: 'Whether step therapy is required before the target drug.', example: 'false', trustKind: 'observed' },
      { field: 'copayTier', type: 'enum', description: 'Out of pocket cost tier: low, medium, high, or very high.', example: 'high', trustKind: 'observed' },
      { field: 'denialProxyRate', type: 'number', description: 'Estimated denial rate as a decimal. Higher under prior auth.', example: '0.12', trustKind: 'inferred' },
    ],
  },
  {
    name: 'Patients',
    description: 'Synthetic patient cohort. No PHI. No names, addresses, dates of birth, or contact information. Only aggregated outputs are displayed.',
    recordCount: '2,000 per world',
    fields: [
      { field: 'patientId', type: 'string', description: 'Synthetic patient identifier. Format: P{WORLD}_{number}.', example: 'PGLP1_000042', trustKind: 'observed' },
      { field: 'state', type: 'string', description: 'US state. Population weighted distribution.', example: 'TX', trustKind: 'observed' },
      { field: 'ageBand', type: 'enum', description: 'Age range band. Never exact age.', example: '50_59', trustKind: 'observed' },
      { field: 'comorbidityScore', type: 'number', description: 'Score from 0 to 10 representing burden of comorbid conditions.', example: '4', trustKind: 'inferred' },
      { field: 'payerSegment', type: 'enum', description: 'Primary payer type.', example: 'medicare', trustKind: 'observed' },
      { field: 'diagnosisDateMonth', type: 'number', description: 'Month number (1 to 36) of initial qualifying diagnosis.', example: '8', trustKind: 'observed' },
      { field: 'socioeconomicBand', type: 'enum', description: 'Socioeconomic status proxy: low, medium, or high.', example: 'medium', trustKind: 'inferred' },
    ],
  },
  {
    name: 'Events',
    description: 'Longitudinal patient events. Each row is one clinical or administrative event. Never displayed at patient level.',
    recordCount: 'Variable (avg 14 to 28 per patient depending on world)',
    fields: [
      { field: 'patientId', type: 'string', description: 'Links to the patient record.', example: 'PGLP1_000042', trustKind: 'observed' },
      { field: 'month', type: 'number', description: 'Month number when the event occurred.', example: '12', trustKind: 'observed' },
      { field: 'eventType', type: 'enum', description: 'Type of event: visit, diagnosis, lab, prescription, procedure, authorization, denial, or reversal.', example: 'prescription', trustKind: 'observed' },
      { field: 'codeType', type: 'enum', description: 'Code system: icd10_proxy, cpt_proxy, ndc_proxy, loinc_proxy, or custom.', example: 'ndc_proxy', trustKind: 'observed' },
      { field: 'code', type: 'string', description: 'Synthetic code representing the clinical concept. Not a real billing code.', example: 'NDC_SEMA_INJ', trustKind: 'observed' },
      { field: 'providerId', type: 'string', description: 'Fictional provider who recorded the event.', example: '9012345678', trustKind: 'observed' },
      { field: 'siteOfCare', type: 'enum', description: 'Where care was delivered: office, hospital outpatient, hospital inpatient, infusion center, home, or telehealth.', example: 'office', trustKind: 'observed' },
      { field: 'paidAmountProxy', type: 'number', description: 'Synthetic paid amount in USD. Not real pricing.', example: '450.00', trustKind: 'inferred' },
      { field: 'oopAmountProxy', type: 'number', description: 'Synthetic out of pocket cost in USD.', example: '35.00', trustKind: 'inferred' },
      { field: 'sourceSystem', type: 'enum', description: 'Data source: claims, ehr, pharmacy, lab, or hub.', example: 'claims', trustKind: 'observed' },
    ],
  },
  {
    name: 'Journeys',
    description: 'Derived patient journey summaries. Each row is one line of therapy for one patient. Line of therapy assignment is an inferred construct.',
    recordCount: 'Variable (avg 1.2 to 2.2 lines per patient depending on world)',
    fields: [
      { field: 'patientId', type: 'string', description: 'Links to the patient record.', example: 'PGLP1_000042', trustKind: 'observed' },
      { field: 'lineNumber', type: 'number', description: 'Line of therapy number. First line is 1.', example: '1', trustKind: 'inferred' },
      { field: 'lineStartMonth', type: 'number', description: 'Month when this line of therapy began.', example: '9', trustKind: 'observed' },
      { field: 'lineEndMonth', type: 'number | null', description: 'Month when this line ended. Null if still active.', example: '18', trustKind: 'observed' },
      { field: 'switchFlag', type: 'boolean', description: 'Whether the patient switched to a different therapy.', example: 'true', trustKind: 'inferred' },
      { field: 'discontinueFlag', type: 'boolean', description: 'Whether the patient discontinued therapy.', example: 'false', trustKind: 'inferred' },
      { field: 'restartFlag', type: 'boolean', description: 'Whether this line represents a restart after a gap.', example: 'false', trustKind: 'inferred' },
      { field: 'refillGapDays', type: 'number', description: 'Average days between refills. Longer gaps predict discontinuation.', example: '12', trustKind: 'observed' },
      { field: 'pdcProxy', type: 'number', description: 'Proportion of days covered. Ranges from 0 to 1. A proxy for adherence.', example: '0.78', trustKind: 'inferred' },
      { field: 'timeToStartDays', type: 'number', description: 'Days from diagnosis to first treatment. Affected by payer friction and provider adoption.', example: '21', trustKind: 'inferred' },
    ],
  },
];
