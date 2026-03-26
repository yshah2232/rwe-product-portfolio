import type {
  TherapeuticWorld, Provider, Payer, Patient, PatientEvent, Journey,
  WorldDataset, AgeBand, PayerSegment, VolumeTier, AdoptionSegment,
  OrgType, PlanType, FormularyTier, CopayTier, SocioeconomicBand,
  EventType, SiteOfCare, SourceSystem, CodeType,
} from './types';
import {
  WORLD_META, US_STATES, STATE_WEIGHTS, SPECIALTIES,
  DRUG_CODES, DIAGNOSIS_CODES, LAB_CODES, WORLD_DISTRIBUTIONS,
} from './worldConfigs';

// ── Seeded PRNG for reproducibility ──
class SeededRNG {
  private s: number;
  constructor(seed: number) { this.s = seed; }
  next(): number {
    this.s = (this.s * 16807) % 2147483647;
    return (this.s - 1) / 2147483646;
  }
  nextInt(min: number, max: number): number {
    return Math.floor(this.next() * (max - min + 1)) + min;
  }
  nextGaussian(mean: number, std: number): number {
    const u1 = this.next();
    const u2 = this.next();
    return mean + std * Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
  }
  pick<T>(arr: T[]): T {
    return arr[Math.floor(this.next() * arr.length)];
  }
  weightedPick<T>(items: T[], weights: number[]): T {
    const total = weights.reduce((a, b) => a + b, 0);
    let r = this.next() * total;
    for (let i = 0; i < items.length; i++) {
      r -= weights[i];
      if (r <= 0) return items[i];
    }
    return items[items.length - 1];
  }
}

function worldSeed(world: TherapeuticWorld): number {
  return world === 'glp1' ? 42 : world === 'nsclc' ? 137 : 256;
}

// ── Generate fictional 10-digit provider IDs (not real NPIs) ──
function genProviderId(rng: SeededRNG): string {
  // Start with 9 to avoid real NPI patterns (start with 1)
  let id = '9';
  for (let i = 0; i < 9; i++) id += rng.nextInt(0, 9).toString();
  return id;
}

function pickState(rng: SeededRNG): string {
  const states = Object.keys(STATE_WEIGHTS);
  const weights = states.map(s => STATE_WEIGHTS[s]);
  return rng.weightedPick(states, weights);
}

function pickAgeBand(rng: SeededRNG, world: TherapeuticWorld): AgeBand {
  const dist = WORLD_DISTRIBUTIONS[world];
  const bands = Object.keys(dist.ageBandWeights) as AgeBand[];
  const weights = bands.map(b => dist.ageBandWeights[b]);
  return rng.weightedPick(bands, weights);
}

// ── Generators ──

function generateProviders(rng: SeededRNG, world: TherapeuticWorld, count: number): Provider[] {
  const specs = SPECIALTIES[world];
  const providers: Provider[] = [];
  for (let i = 0; i < count; i++) {
    providers.push({
      providerId: genProviderId(rng),
      specialty: rng.pick(specs),
      state: pickState(rng),
      orgType: rng.weightedPick<OrgType>(['academic', 'community', 'integrated'], [0.2, 0.55, 0.25]),
      volumeTier: rng.weightedPick<VolumeTier>(['low', 'medium', 'high'], [0.4, 0.4, 0.2]),
      adoptionSegment: rng.weightedPick<AdoptionSegment>(['early_adopter', 'mainstream', 'laggard'], [0.15, 0.55, 0.30]),
      investigatorFlag: rng.next() < 0.12,
      publicationsCount: rng.nextInt(0, 25),
      referralHubScore: Math.round(rng.next() * 100),
    });
  }
  return providers;
}

function generatePayers(rng: SeededRNG, count: number): Payer[] {
  const payers: Payer[] = [];
  for (let i = 0; i < count; i++) {
    const segment = rng.weightedPick<PayerSegment>(
      ['commercial', 'medicare', 'medicaid', 'cash'],
      [0.45, 0.25, 0.20, 0.10]
    );
    const priorAuth = segment === 'medicaid' ? rng.next() < 0.6 : segment === 'commercial' ? rng.next() < 0.3 : rng.next() < 0.15;
    const stepTherapy = priorAuth && rng.next() < 0.5;
    const denialRate = priorAuth ? 0.08 + rng.next() * 0.15 : 0.02 + rng.next() * 0.06;

    payers.push({
      payerSegment: segment,
      planType: rng.weightedPick<PlanType>(['hmo', 'ppo', 'pos', 'hdhp', 'fee_for_service'], [0.25, 0.35, 0.10, 0.15, 0.15]),
      formularyTier: rng.weightedPick<FormularyTier>(['preferred', 'non_preferred', 'specialty', 'not_covered'], [0.3, 0.3, 0.3, 0.1]),
      priorAuthFlag: priorAuth,
      stepTherapyFlag: stepTherapy,
      copayTier: rng.weightedPick<CopayTier>(['low', 'medium', 'high', 'very_high'], [0.25, 0.35, 0.25, 0.15]),
      denialProxyRate: Math.round(denialRate * 1000) / 1000,
    });
  }
  return payers;
}

function generatePatients(rng: SeededRNG, world: TherapeuticWorld, count: number): Patient[] {
  const dist = WORLD_DISTRIBUTIONS[world];
  const patients: Patient[] = [];
  for (let i = 0; i < count; i++) {
    const comorbidity = Math.max(0, Math.min(10, Math.round(rng.nextGaussian(dist.comorbidityMean, dist.comorbidityStd))));
    patients.push({
      patientId: `P${world.toUpperCase()}_${String(i + 1).padStart(6, '0')}`,
      state: pickState(rng),
      ageBand: pickAgeBand(rng, world),
      comorbidityScore: comorbidity,
      payerSegment: rng.weightedPick<PayerSegment>(['commercial', 'medicare', 'medicaid', 'cash'], [0.45, 0.25, 0.20, 0.10]),
      diagnosisDateMonth: rng.nextInt(1, 36),
      socioeconomicBand: rng.weightedPick<SocioeconomicBand>(['low', 'medium', 'high'], [0.30, 0.45, 0.25]),
    });
  }
  return patients;
}

function generateEvents(
  rng: SeededRNG,
  world: TherapeuticWorld,
  patients: Patient[],
  providers: Provider[],
  payers: Payer[],
): PatientEvent[] {
  const dist = WORLD_DISTRIBUTIONS[world];
  const drugs = DRUG_CODES[world];
  const diagnoses = DIAGNOSIS_CODES[world];
  const labs = LAB_CODES[world];
  const events: PatientEvent[] = [];

  const payerMap = new Map<PayerSegment, Payer[]>();
  for (const p of payers) {
    if (!payerMap.has(p.payerSegment)) payerMap.set(p.payerSegment, []);
    payerMap.get(p.payerSegment)!.push(p);
  }

  for (const patient of patients) {
    // Higher comorbidity → more events
    const comorbidityMult = 1 + (patient.comorbidityScore / 10) * 0.8;
    const eventCount = Math.max(3, Math.round(dist.avgEventsPerPatient * comorbidityMult * (0.7 + rng.next() * 0.6)));
    const patientPayers = payerMap.get(patient.payerSegment) || payers.slice(0, 3);
    const patientPayer = rng.pick(patientPayers);
    const provider = rng.pick(providers);

    for (let e = 0; e < eventCount; e++) {
      const month = patient.diagnosisDateMonth + rng.nextInt(0, 24);
      const roll = rng.next();
      let eventType: EventType;
      let codeType: CodeType;
      let code: string;

      if (roll < 0.20) {
        eventType = 'visit';
        codeType = 'cpt_proxy';
        code = rng.pick(['CPT_99213', 'CPT_99214', 'CPT_99215', 'CPT_99243']);
      } else if (roll < 0.35) {
        eventType = 'diagnosis';
        codeType = 'icd10_proxy';
        const dx = rng.pick(diagnoses);
        code = dx.code;
      } else if (roll < 0.50) {
        eventType = 'lab';
        codeType = 'loinc_proxy';
        const lab = rng.pick(labs);
        code = lab.code;
      } else if (roll < 0.70) {
        eventType = 'prescription';
        codeType = 'ndc_proxy';
        const drug = rng.pick(drugs);
        code = drug.code;
      } else if (roll < 0.80) {
        eventType = 'procedure';
        codeType = 'cpt_proxy';
        code = rng.pick(['CPT_PROC_A', 'CPT_PROC_B', 'CPT_PROC_C']);
      } else if (roll < 0.88) {
        eventType = 'authorization';
        codeType = 'custom';
        code = 'AUTH_REQ';
      } else if (roll < 0.95) {
        // Denials more common with prior auth / step therapy
        const denialChance = patientPayer.priorAuthFlag ? 0.7 : 0.3;
        if (rng.next() < denialChance) {
          eventType = 'denial';
          codeType = 'custom';
          code = rng.pick(['DENIAL_PA', 'DENIAL_FORMULARY', 'DENIAL_MEDICAL']);
        } else {
          eventType = 'authorization';
          codeType = 'custom';
          code = 'AUTH_APPROVED';
        }
      } else {
        // Reversals more common under step therapy
        const reversalChance = patientPayer.stepTherapyFlag ? 0.6 : 0.2;
        if (rng.next() < reversalChance) {
          eventType = 'reversal';
          codeType = 'custom';
          code = 'REVERSAL_CLAIM';
        } else {
          eventType = 'visit';
          codeType = 'cpt_proxy';
          code = 'CPT_99214';
        }
      }

      const basePaid = eventType === 'prescription' ? 200 + rng.next() * 800 :
                       eventType === 'procedure' ? 500 + rng.next() * 2000 :
                       50 + rng.next() * 200;

      const oopRatio = patientPayer.copayTier === 'very_high' ? 0.25 :
                       patientPayer.copayTier === 'high' ? 0.15 :
                       patientPayer.copayTier === 'medium' ? 0.08 : 0.03;

      events.push({
        patientId: patient.patientId,
        month,
        eventType,
        codeType,
        code,
        providerId: provider.providerId,
        siteOfCare: rng.weightedPick<SiteOfCare>(
          ['office', 'hospital_outpatient', 'hospital_inpatient', 'infusion_center', 'home', 'telehealth'],
          world === 'nsclc' ? [0.15, 0.30, 0.15, 0.25, 0.05, 0.10] :
          world === 'alzheimer' ? [0.35, 0.20, 0.10, 0.05, 0.15, 0.15] :
          [0.40, 0.20, 0.05, 0.10, 0.10, 0.15]
        ),
        paidAmountProxy: Math.round(basePaid * 100) / 100,
        oopAmountProxy: Math.round(basePaid * oopRatio * 100) / 100,
        sourceSystem: rng.weightedPick<SourceSystem>(['claims', 'ehr', 'pharmacy', 'lab', 'hub'], [0.40, 0.25, 0.20, 0.10, 0.05]),
      });
    }
  }

  return events;
}

function generateJourneys(
  rng: SeededRNG,
  world: TherapeuticWorld,
  patients: Patient[],
  providers: Provider[],
  payers: Payer[],
): Journey[] {
  const dist = WORLD_DISTRIBUTIONS[world];
  const journeys: Journey[] = [];

  const payerMap = new Map<PayerSegment, Payer[]>();
  for (const p of payers) {
    if (!payerMap.has(p.payerSegment)) payerMap.set(p.payerSegment, []);
    payerMap.get(p.payerSegment)!.push(p);
  }

  const providerAdoptionMap = new Map<string, AdoptionSegment>();
  for (const p of providers) providerAdoptionMap.set(p.providerId, p.adoptionSegment);

  for (const patient of patients) {
    const lineCount = Math.max(1, Math.round(dist.avgLinesPerPatient + (rng.next() - 0.5)));
    const patientPayers = payerMap.get(patient.payerSegment) || payers.slice(0, 3);
    const patientPayer = rng.pick(patientPayers);
    const assignedProvider = rng.pick(providers);
    const adoption = assignedProvider.adoptionSegment;

    // Correlation: payer friction → longer time to start
    const payerFrictionMult = patientPayer.priorAuthFlag ? 1.5 : 1.0;
    const stepMult = patientPayer.stepTherapyFlag ? 1.3 : 1.0;
    // Correlation: provider adoption → affects time to start
    const adoptionMult = adoption === 'early_adopter' ? 0.7 : adoption === 'laggard' ? 1.4 : 1.0;

    let currentMonth = patient.diagnosisDateMonth;

    for (let line = 1; line <= lineCount; line++) {
      const timeToStart = Math.max(1, Math.round(
        dist.baseTimeToStartDays * payerFrictionMult * stepMult * adoptionMult * (0.5 + rng.next())
      ));

      const lineStart = currentMonth;
      const lineDuration = rng.nextInt(3, 18);
      const lineEnd = lineStart + lineDuration;

      // Correlation: higher refill gap → more discontinuation
      const refillGap = Math.max(0, Math.round(
        dist.baseRefillGapDays * (1 + patient.comorbidityScore * 0.05) * (0.6 + rng.next() * 0.8)
      ));
      const discontinueRisk = dist.baseDiscontinueRate + (refillGap / 100) * 0.3;
      const discontinue = line < lineCount ? false : rng.next() < discontinueRisk;
      const switchFlag = line < lineCount;

      // PDC: adoption and payer affect adherence
      const adoptionPdcBonus = adoption === 'early_adopter' ? 0.08 : adoption === 'laggard' ? -0.06 : 0;
      const pdc = Math.max(0, Math.min(1,
        dist.basePdc + adoptionPdcBonus - (refillGap / 100) * 0.4 + (rng.next() - 0.5) * 0.15
      ));

      journeys.push({
        patientId: patient.patientId,
        lineNumber: line,
        lineStartMonth: lineStart,
        lineEndMonth: discontinue ? lineEnd : (line < lineCount ? lineEnd : null),
        switchFlag,
        discontinueFlag: discontinue,
        restartFlag: line > 1 && rng.next() < 0.15,
        refillGapDays: refillGap,
        pdcProxy: Math.round(pdc * 100) / 100,
        timeToStartDays: timeToStart,
      });

      currentMonth = lineEnd + rng.nextInt(0, 3);
    }
  }

  return journeys;
}

// ── Main generator ──
const PROVIDER_COUNT = 500;
const PAYER_COUNT = 200;
const PATIENT_COUNT = 2000; // Synthetic cohort (aggregated only, never shown at patient level)

const cache = new Map<TherapeuticWorld, WorldDataset>();

export function generateWorld(world: TherapeuticWorld): WorldDataset {
  if (cache.has(world)) return cache.get(world)!;

  const rng = new SeededRNG(worldSeed(world));
  const providers = generateProviders(rng, world, PROVIDER_COUNT);
  const payers = generatePayers(rng, PAYER_COUNT);
  const patients = generatePatients(rng, world, PATIENT_COUNT);
  const events = generateEvents(rng, world, patients, providers, payers);
  const journeys = generateJourneys(rng, world, patients, providers, payers);

  const dataset: WorldDataset = {
    meta: WORLD_META[world],
    providers,
    payers,
    patients,
    events,
    journeys,
  };

  cache.set(world, dataset);
  return dataset;
}
