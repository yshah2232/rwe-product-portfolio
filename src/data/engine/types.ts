// ── Synthetic Data Engine Types ──
// No PHI. No real NPIs. US only. Aggregated outputs only.

export type TherapeuticWorld = 'glp1' | 'nsclc' | 'alzheimer';

export interface WorldMeta {
  id: TherapeuticWorld;
  label: string;
  shortLabel: string;
  description: string;
  color: string;
}

// ── Provider ──
export type VolumeTier = 'low' | 'medium' | 'high';
export type AdoptionSegment = 'early_adopter' | 'mainstream' | 'laggard';
export type OrgType = 'academic' | 'community' | 'integrated';

export interface Provider {
  providerId: string;
  specialty: string;
  state: string;
  orgType: OrgType;
  volumeTier: VolumeTier;
  adoptionSegment: AdoptionSegment;
  investigatorFlag: boolean;
  publicationsCount: number;
  referralHubScore: number;
}

// ── Payer ──
export type PayerSegment = 'commercial' | 'medicare' | 'medicaid' | 'cash';
export type PlanType = 'hmo' | 'ppo' | 'pos' | 'hdhp' | 'fee_for_service';
export type FormularyTier = 'preferred' | 'non_preferred' | 'specialty' | 'not_covered';
export type CopayTier = 'low' | 'medium' | 'high' | 'very_high';

export interface Payer {
  payerSegment: PayerSegment;
  planType: PlanType;
  formularyTier: FormularyTier;
  priorAuthFlag: boolean;
  stepTherapyFlag: boolean;
  copayTier: CopayTier;
  denialProxyRate: number;
}

// ── Patient ──
export type AgeBand = '18_29' | '30_39' | '40_49' | '50_59' | '60_69' | '70_79' | '80_plus';
export type SocioeconomicBand = 'low' | 'medium' | 'high';

export interface Patient {
  patientId: string;
  state: string;
  ageBand: AgeBand;
  comorbidityScore: number; // 0-10
  payerSegment: PayerSegment;
  diagnosisDateMonth: number; // 1-36
  socioeconomicBand: SocioeconomicBand;
}

// ── Event ──
export type EventType = 'visit' | 'diagnosis' | 'lab' | 'prescription' | 'procedure' | 'authorization' | 'denial' | 'reversal';
export type CodeType = 'icd10_proxy' | 'cpt_proxy' | 'ndc_proxy' | 'loinc_proxy' | 'custom';
export type SiteOfCare = 'office' | 'hospital_outpatient' | 'hospital_inpatient' | 'infusion_center' | 'home' | 'telehealth';
export type SourceSystem = 'claims' | 'ehr' | 'pharmacy' | 'lab' | 'hub';

export interface PatientEvent {
  patientId: string;
  month: number;
  eventType: EventType;
  codeType: CodeType;
  code: string;
  providerId: string;
  siteOfCare: SiteOfCare;
  paidAmountProxy: number;
  oopAmountProxy: number;
  sourceSystem: SourceSystem;
}

// ── Journey ──
export interface Journey {
  patientId: string;
  lineNumber: number;
  lineStartMonth: number;
  lineEndMonth: number | null;
  switchFlag: boolean;
  discontinueFlag: boolean;
  restartFlag: boolean;
  refillGapDays: number;
  pdcProxy: number; // 0-1
  timeToStartDays: number;
}

// ── Trust & Confidence ──
export type MetricKind = 'observed' | 'inferred';

export interface TrustInfo {
  kind: MetricKind;
  confidence: number; // 0-100
  reason: string;
}

// ── Complete World Dataset ──
export interface WorldDataset {
  meta: WorldMeta;
  providers: Provider[];
  payers: Payer[];
  patients: Patient[];
  events: PatientEvent[];
  journeys: Journey[];
}

// ── Aggregation helpers ──
export interface AggregatedMetric {
  label: string;
  value: number;
  count: number; // raw count for suppression check
  trust: TrustInfo;
  suppressed: boolean; // true if count < 11
}
