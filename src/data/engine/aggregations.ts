import type {
  WorldDataset, AggregatedMetric, TrustInfo, MetricKind,
  Journey, Patient,
} from './types';

// ── Suppression: any count < 11 is suppressed ──
const SUPPRESSION_THRESHOLD = 11;

function makeTrust(kind: MetricKind, count: number, totalEvents: number, note?: string): TrustInfo {
  let confidence = kind === 'observed' ? 90 : 70;
  const missingness = totalEvents > 0 ? 1 - (count / totalEvents) : 1;
  if (missingness > 0.5) confidence -= 15;
  else if (missingness > 0.3) confidence -= 8;
  confidence = Math.max(10, Math.min(100, confidence));

  const reason = note ||
    (kind === 'observed'
      ? `Directly computed from ${count.toLocaleString()} events.`
      : `Derived using rules. ${missingness > 0.3 ? 'Higher missingness reduces confidence.' : 'Adequate data coverage.'}`);

  return { kind, confidence, reason };
}

function makeMetric(label: string, value: number, count: number, trust: TrustInfo): AggregatedMetric {
  return {
    label,
    value: Math.round(value * 1000) / 1000,
    count,
    trust,
    suppressed: count < SUPPRESSION_THRESHOLD,
  };
}

// Normalize payer segment strings for consistent grouping
function normalizePayer(seg: string): string {
  const lower = seg.toLowerCase();
  if (lower === 'cashorother' || lower === 'cash') return 'Cash';
  if (lower === 'commercial') return 'Commercial';
  if (lower === 'medicare') return 'Medicare';
  if (lower === 'medicaid') return 'Medicaid';
  return seg;
}

// ── Aggregation functions ──

export function getPatientCountByState(ds: WorldDataset): AggregatedMetric[] {
  const counts = new Map<string, number>();
  for (const p of ds.patients) counts.set(p.state, (counts.get(p.state) || 0) + 1);
  return Array.from(counts.entries()).map(([state, count]) =>
    makeMetric(state, count, count, makeTrust('observed', count, ds.patients.length))
  ).sort((a, b) => b.value - a.value);
}

export function getEventCountsByType(ds: WorldDataset): AggregatedMetric[] {
  const byType = ds.eventsSummary.byType;
  const total = ds.eventsSummary.totalEvents;
  return Object.entries(byType).map(([type, count]) =>
    makeMetric(type, count, count, makeTrust('observed', count, total))
  ).sort((a, b) => b.value - a.value);
}

export function getPersistenceByPayer(ds: WorldDataset): AggregatedMetric[] {
  const groups = new Map<string, { total: number; active: number }>();
  for (const j of ds.journeys) {
    const patient = ds.patients.find(p => p.patientId === j.patientId);
    if (!patient) continue;
    const seg = normalizePayer(patient.payerSegment);
    if (!groups.has(seg)) groups.set(seg, { total: 0, active: 0 });
    const g = groups.get(seg)!;
    g.total++;
    if (!j.discontinueFlag) g.active++;
  }
  return Array.from(groups.entries()).map(([seg, g]) => {
    const rate = g.total > 0 ? g.active / g.total : 0;
    return makeMetric(seg, rate, g.total, makeTrust('observed', g.total, ds.journeys.length));
  });
}

export function getAvgTimeToStartByPayer(ds: WorldDataset): AggregatedMetric[] {
  const groups = new Map<string, { sum: number; count: number }>();
  const patientPayerMap = new Map<string, string>();
  for (const p of ds.patients) patientPayerMap.set(p.patientId, normalizePayer(p.payerSegment));

  for (const j of ds.journeys) {
    if (j.lineNumber !== 1) continue;
    const seg = patientPayerMap.get(j.patientId);
    if (!seg) continue;
    if (!groups.has(seg)) groups.set(seg, { sum: 0, count: 0 });
    const g = groups.get(seg)!;
    g.sum += j.timeToStartDays;
    g.count++;
  }
  return Array.from(groups.entries()).map(([seg, g]) => {
    const avg = g.count > 0 ? g.sum / g.count : 0;
    return makeMetric(seg, avg, g.count, makeTrust('inferred', g.count, ds.journeys.length,
      'Time to start is inferred from the gap between diagnosis date and first prescription event.'));
  });
}

export function getDenialRateByPayer(ds: WorldDataset): AggregatedMetric[] {
  const denialsByPayer = ds.eventsSummary.denialsByPayer;
  return Object.entries(denialsByPayer).map(([seg, g]) => {
    const normSeg = normalizePayer(seg);
    const total = g.denials + g.auths;
    const rate = total > 0 ? g.denials / total : 0;
    return makeMetric(normSeg, rate, total, makeTrust('observed', total, ds.eventsSummary.totalEvents));
  });
}

export function getSwitchRateByLine(ds: WorldDataset): AggregatedMetric[] {
  const groups = new Map<number, { total: number; switches: number }>();
  for (const j of ds.journeys) {
    if (!groups.has(j.lineNumber)) groups.set(j.lineNumber, { total: 0, switches: 0 });
    const g = groups.get(j.lineNumber)!;
    g.total++;
    if (j.switchFlag) g.switches++;
  }
  return Array.from(groups.entries()).map(([line, g]) => {
    const rate = g.total > 0 ? g.switches / g.total : 0;
    return makeMetric(`Line ${line}`, rate, g.total, makeTrust('inferred', g.total, ds.journeys.length,
      'Line of therapy is inferred from sequential treatment patterns and gap rules.'));
  }).sort((a, b) => a.label.localeCompare(b.label));
}

export function getAvgPdcByAdoption(ds: WorldDataset): AggregatedMetric[] {
  const providerAdoption = new Map<string, string>();
  for (const p of ds.providers) providerAdoption.set(p.providerId, p.adoptionSegment);

  const patientProvider = ds.eventsSummary.patientProviderMap;

  const groups = new Map<string, { sum: number; count: number }>();
  for (const j of ds.journeys) {
    const provId = patientProvider[j.patientId];
    const adoption = provId ? providerAdoption.get(provId) || 'unknown' : 'unknown';
    if (!groups.has(adoption)) groups.set(adoption, { sum: 0, count: 0 });
    const g = groups.get(adoption)!;
    g.sum += j.pdcProxy;
    g.count++;
  }
  return Array.from(groups.entries())
    .filter(([seg]) => seg !== 'unknown')
    .map(([seg, g]) => {
      const avg = g.count > 0 ? g.sum / g.count : 0;
      return makeMetric(seg.replace('_', ' '), avg, g.count, makeTrust('inferred', g.count, ds.journeys.length,
        'PDC is a proxy derived from prescription fill patterns and gap analysis.'));
    });
}

export function getSummaryStats(ds: WorldDataset) {
  const totalPatients = ds.patients.length;
  const totalEvents = ds.eventsSummary.totalEvents;
  const totalProviders = ds.providers.length;

  const avgComorbidity = ds.patients.reduce((s, p) => s + p.comorbidityScore, 0) / totalPatients;
  const discontinuedCount = ds.journeys.filter(j => j.discontinueFlag).length;
  const totalJourneys = ds.journeys.length;
  const discontinueRate = totalJourneys > 0 ? discontinuedCount / totalJourneys : 0;

  const avgPdc = ds.journeys.reduce((s, j) => s + j.pdcProxy, 0) / totalJourneys;
  const line1Journeys = ds.journeys.filter(j => j.lineNumber === 1);
  const avgTimeToStart = line1Journeys.length > 0
    ? line1Journeys.reduce((s, j) => s + j.timeToStartDays, 0) / line1Journeys.length
    : 0;

  const denials = Object.values(ds.eventsSummary.denialsByPayer).reduce((s, g) => s + g.denials, 0);
  const denialRate = totalEvents > 0 ? denials / totalEvents : 0;

  return {
    totalPatients: makeMetric('Total patients', totalPatients, totalPatients, makeTrust('observed', totalPatients, totalPatients)),
    totalEvents: makeMetric('Total events', totalEvents, totalEvents, makeTrust('observed', totalEvents, totalEvents)),
    totalProviders: makeMetric('Total providers', totalProviders, totalProviders, makeTrust('observed', totalProviders, totalProviders)),
    avgComorbidity: makeMetric('Avg comorbidity score', Math.round(avgComorbidity * 10) / 10, totalPatients, makeTrust('observed', totalPatients, totalPatients)),
    discontinueRate: makeMetric('Discontinuation rate', Math.round(discontinueRate * 1000) / 1000, totalJourneys,
      makeTrust('inferred', totalJourneys, totalJourneys, 'Discontinuation is inferred from absence of subsequent fills beyond a gap threshold.')),
    avgPdc: makeMetric('Avg PDC', Math.round(avgPdc * 100) / 100, totalJourneys,
      makeTrust('inferred', totalJourneys, totalJourneys, 'PDC is a proxy calculated from fill dates and days supply estimates.')),
    avgTimeToStart: makeMetric('Avg time to start (days)', Math.round(avgTimeToStart), totalJourneys,
      makeTrust('inferred', totalJourneys, totalJourneys, 'Time to start inferred from gap between diagnosis and first treatment event.')),
    denialRate: makeMetric('Denial rate', Math.round(denialRate * 1000) / 1000, totalEvents, makeTrust('observed', denials, totalEvents)),
  };
}

// ── Referral aggregations ──
export function getReferralsBySpecialty(ds: WorldDataset): AggregatedMetric[] {
  const groups = new Map<string, number>();
  for (const r of ds.referrals) {
    const key = `${r.fromSpecialty} → ${r.toSpecialty}`;
    groups.set(key, (groups.get(key) || 0) + r.annualReferralVolumeProxy);
  }
  return Array.from(groups.entries()).map(([key, volume]) =>
    makeMetric(key, volume, volume, makeTrust('observed', volume, ds.referrals.length))
  ).sort((a, b) => b.value - a.value);
}

export function getTopReferralHubs(ds: WorldDataset): AggregatedMetric[] {
  return ds.providers
    .sort((a, b) => b.referralHubScore - a.referralHubScore)
    .slice(0, 20)
    .map(p => makeMetric(
      `${p.providerId} (${p.specialty})`,
      p.referralHubScore,
      1,
      makeTrust('observed', 1, 1)
    ));
}
