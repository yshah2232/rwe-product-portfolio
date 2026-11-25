// Enrolled participant race and ethnicity, read only from the posted results
// (resultsSection.baselineCharacteristicsModule) of a ClinicalTrials.gov record.
// Counts are used exactly as reported. Nothing is estimated when results are absent.

export interface DemoCategory { label: string; count: number; share: number }
export interface DemoMeasure { title: string; total: number; categories: DemoCategory[] }
export interface EnrolledDemographics { race: DemoMeasure | null; ethnicity: DemoMeasure | null }

interface RawMeasure {
  title?: string;
  paramType?: string;
  classes?: { categories?: { title?: string; measurements?: { groupId?: string; value?: string }[] }[] }[];
}
interface RawModule { groups?: { id?: string; title?: string }[]; measures?: RawMeasure[] }

function totalGroupId(groups: RawModule['groups']): string | null {
  if (!groups?.length) return null;
  const total = groups.find((g) => (g.title ?? '').trim().toLowerCase() === 'total');
  return (total ?? (groups.length === 1 ? groups[0] : null))?.id ?? null;
}

function readMeasure(m: RawMeasure | undefined, groupId: string): DemoMeasure | null {
  if (!m || m.paramType !== 'COUNT_OF_PARTICIPANTS') return null;
  const rows: { label: string; count: number }[] = [];
  for (const cl of m.classes ?? []) for (const c of cl.categories ?? []) {
    const raw = c.measurements?.find((x) => x.groupId === groupId)?.value;
    const n = raw == null ? NaN : Number(raw);
    if (!c.title || !Number.isFinite(n) || n < 0) continue;
    rows.push({ label: c.title.trim(), count: n });
  }
  const total = rows.reduce((s, r) => s + r.count, 0);
  if (!rows.length || total === 0) return null;
  return { title: m.title ?? '', total, categories: rows.map((r) => ({ ...r, share: r.count / total })) };
}

export function parseEnrolledDemographics(mod: RawModule | null | undefined): EnrolledDemographics {
  const empty = { race: null, ethnicity: null };
  const gid = totalGroupId(mod?.groups);
  if (!mod || !gid) return empty;
  const find = (re: RegExp) => mod.measures?.find((m) => re.test(m.title ?? ''));
  return {
    race: readMeasure(find(/^race\b/i), gid),
    ethnicity: readMeasure(find(/^ethnicity\b/i), gid),
  };
}

export async function fetchEnrolledDemographics(nctId: string, signal?: AbortSignal): Promise<EnrolledDemographics> {
  if (!/^NCT\d{8}$/.test(nctId)) throw new Error('Invalid NCT ID');
  const r = await fetch(`https://clinicaltrials.gov/api/v2/studies/${nctId}?fields=resultsSection.baselineCharacteristicsModule`, { signal });
  if (!r.ok) throw new Error(`Registry responded ${r.status}`);
  const body = await r.json();
  return parseEnrolledDemographics(body?.resultsSection?.baselineCharacteristicsModule);
}
