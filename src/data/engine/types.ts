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
export type VolumeTier = 'low' | 'medium' | 'high' | 'Low' | 'Medium' | 'High';
export type AdoptionSegment = 'early_adopter' | 'mainstream' | 'laggard' | 'Early' | 'Middle' | 'Late';
export type OrgType = string;

export interface Provider {
  providerId: string;
  specialty: string;
  state: string;
  orgType: OrgType;
  volumeTier: string;
  adoptionSegment: string;
  investigatorFlag: boolean | number;
  publicationsCount?: number;
  referralHubScore: number;
}

// ── Payer ──
export type PayerSegment = 'commercial' | 'medicare' | 'medicaid' | 'cash' | 'Commercial' | 'Medicare' | 'Medicaid' | 'CashOrOther';
export type PlanType = string;
export type FormularyTier = string;
export type CopayTier = string;

export interface Payer {
  payerSegment: string;
  planType: string;
  formularyTier: string | number;
  priorAuthFlag: boolean | number;
  stepTherapyFlag: boolean | number;
  copayTier: string | number;
  denialProxyRate: number;
}

// ── Patient ──
export type AgeBand = string;
export type SocioeconomicBand = string;

export interface Patient {
  patientId: string;
  state: string;
  ageBand: string;
  comorbidityScore: number;
  payerSegment: string;
  diagnosisMonth: string | number;
  socioeconomicBand?: string;
}

// ── Event ──
export type EventType = 'visit' | 'diagnosis' | 'lab' | 'prescription' | 'procedure' | 'authorization' | 'denial' | 'reversal';
export type CodeType = string;
export type SiteOfCare = string;
export type SourceSystem = string;

export interface PatientEvent {
  patientId: string;
  month: string | number;
  eventType: string;
  codeType: string;
  code: string;
  providerId: string;
  siteOfCare: string;
  paidAmountProxy: number | null;
  oopAmountProxy: number | null;
  sourceSystem: string;
}

// ── Journey ──
export interface Journey {
  patientId: string;
  lineNumber: number;
  lineStartMonth: string | number;
  lineEndMonth: string | number | null;
  switchFlag: boolean | number;
  discontinueFlag: boolean | number;
  restartFlag: boolean | number;
  refillGapDays: number;
  pdcProxy: number;
  timeToStartDays: number;
}

// ── Referral ──
export interface Referral {
  fromProviderId: string;
  toProviderId: string;
  annualReferralVolumeProxy: number;
  therapeuticWorld: string;
  fromSpecialty: string;
  toSpecialty: string;
}

// ── Codeset ──
export interface Codeset {
  world: string;
  codeSystem: string;
  code: string;
  plainDescription: string;
  sourceURL: string;
}

// ── Calibration Parameter ──
export interface CalibrationParameter {
  parameter: string;
  value: string | number;
  unit: string;
  notes: string;
  sourceURL: string;
}

// ── Events Summary (pre-aggregated) ──
export interface EventsSummary {
  totalEvents: number;
  byType: Record<string, number>;
  byMonth: Record<string, Record<string, number>>;
  denialsByPayer: Record<string, { denials: number; auths: number }>;
  patientProviderMap: Record<string, string>;
  codeFrequency: Record<string, number>;
  bySiteOfCare: Record<string, number>;
  bySourceSystem: Record<string, number>;
  rxByMonth: Record<string, Record<string, number>>;
}

// ── Trust & Confidence ──
export type MetricKind = 'observed' | 'inferred';

export interface TrustInfo {
  kind: MetricKind;
  confidence: number;
  reason: string;
}

// ── Complete World Dataset ──
export interface WorldDataset {
  meta: WorldMeta;
  providers: Provider[];
  payers: Payer[];
  patients: Patient[];
  eventsSummary: EventsSummary;
  journeys: Journey[];
  referrals: Referral[];
  codesets: Codeset[];
  parameters: CalibrationParameter[];
}

// ── Aggregation helpers ──
export interface AggregatedMetric {
  label: string;
  value: number;
  count: number;
  trust: TrustInfo;
  suppressed: boolean;
}
