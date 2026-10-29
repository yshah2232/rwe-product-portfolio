import type { GroundFields } from './queryIntent.ts';

/** Disease subtypes are constraints, not interchangeable semantic neighbours. */
export function diabetesSubtype(text: string): 1 | 2 | null {
  const one = /\b(?:type[\s-]*1\s+(?:diabetes|diabetic)|diabetes(?:\s+mellitus)?[\s,]*(?:type[\s-]*1)|t1d(?:m)?)\b/i.test(text);
  const two = /\b(?:type[\s-]*2\s+(?:diabetes|diabetic)|diabetes(?:\s+mellitus)?[\s,]*(?:type[\s-]*2)|t2d(?:m)?)\b/i.test(text);
  return one === two ? null : one ? 1 : 2;
}

export function subtypeTier(query: string, fields: GroundFields): number {
  const requested = diabetesSubtype(query);
  if (!requested) return 0;
  // Eligibility can mention an excluded subtype; it is not evidence of the target condition.
  const declared = diabetesSubtype(fields.conditions.join(' '));
  const title = diabetesSubtype(`${fields.briefTitle} ${fields.officialTitle}`);
  const explicit = (text: string) => new RegExp(`\\b(?:type[\\s-]*${requested}\\s+(?:diabetes|diabetic)|diabetes(?:\\s+mellitus)?[\\s,]*type[\\s-]*${requested}|t${requested}d(?:m)?)\\b`, 'i').test(text);
  if (explicit(fields.conditions.join(' ')) || explicit(`${fields.briefTitle} ${fields.officialTitle}`)) return 2;
  const actual = declared ?? title;
  return actual === requested ? 2 : actual ? -1 : 0;
}

export const passesSubtype = (query: string, tier: number) => diabetesSubtype(query) ? tier === 2 : tier >= 0;

export function cosine(a: number[], b: number[]): number {
  if (!a.length || a.length !== b.length || [...a, ...b].some((v) => !Number.isFinite(v))) throw new Error('Invalid embedding dimensions.');
  let dot = 0, aa = 0, bb = 0;
  for (let i = 0; i < a.length; i++) { dot += a[i] * b[i]; aa += a[i] ** 2; bb += b[i] ** 2; }
  return aa && bb ? dot / Math.sqrt(aa * bb) : 0;
}

/** RRF combines ranks, not incomparable BM25 and cosine magnitudes. */
export function fuseRanks(keyword: number[], dense: number[]): number[] {
  const ranks = (values: number[]) => values.map((value) => 1 + values.filter((v) => v > value).length);
  const kr = ranks(keyword), dr = ranks(dense);
  return keyword.map((_, i) => (keyword[i] > 0 ? 1 / (60 + kr[i]) : 0) + (dense[i] > 0 ? 1 / (60 + dr[i]) : 0));
}

export function embeddingText(fields: GroundFields): string {
  return [fields.briefTitle, fields.officialTitle, fields.conditions.join('; '), fields.keywords.join('; '), fields.interventions.join('; ')].filter(Boolean).join('\n');
}