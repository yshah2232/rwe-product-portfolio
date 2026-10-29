import { describe, expect, it } from 'vitest';
import { cosine, diabetesSubtype, fuseRanks, subtypeTier, passesSubtype } from '../../supabase/functions/_shared/hybridRanking';
import { parseQuery, groundConcepts, type GroundFields } from '../../supabase/functions/_shared/queryIntent';

const fields = (conditions: string[]): GroundFields => ({ conditions, briefTitle: '', officialTitle: '', keywords: [], interventions: [], eligibility: '', locations: [], status: '', phase: [] });
describe('hybrid search constraints', () => {
  it('does not return prediabetes records that only mention type 2 in an exclusion', () => {
    const f = fields(['Prediabetes']); f.eligibility = 'Exclusion: currently diagnosed with type 2 diabetes';
    expect(passesSubtype('type 2 diabetes', subtypeTier('type 2 diabetes', f))).toBe(false);
    expect(passesSubtype('type 2 diabetes', subtypeTier('type 2 diabetes', fields(['Diabetes Mellitus, Type 2'])))).toBe(true);
  });
  it('allows explicitly declared mixed type 1 and type 2 populations', () => {
    expect(subtypeTier('type 2 diabetes', fields(['Type 1 Diabetes', 'Type 2 Diabetes']))).toBe(2);
  });
  it('excludes prevention trials that list type 2 but explicitly exclude current type 2 patients', () => {
    const f = fields(['Type 2 Diabetes Mellitus']);
    f.eligibility = 'Inclusion Criteria: Prediabetic\nExclusion Criteria: Currently type 2 diabetic';
    expect(subtypeTier('type 2 diabetes', f)).toBe(-1);
    expect(passesSubtype('type 2 diabetes', subtypeTier('type 2 diabetes', f))).toBe(false);
  });
  it('preserves the 2 in type 2 diabetes retrieval', () => { expect(parseQuery('type 2 diabetes').conditionTerms).toContain('type 2 diabetes'); });
  it('recognises registry subtype order and aliases', () => { expect(diabetesSubtype('Diabetes Mellitus, Type 2')).toBe(2); expect(diabetesSubtype('T1D')).toBe(1); expect(diabetesSubtype('diabetes')).toBeNull(); });
  it('does not label type 1 fields as type 2 evidence when phrase order changes', () => { expect(groundConcepts(parseQuery('type 2 diabetes'), fields(['Diabetes Mellitus, Type 1'])).evidence).toHaveLength(0); });
  it('cannot promote type 1 over explicit type 2 matches through similarity or geography', () => { expect(subtypeTier('type 2 diabetes', fields(['Diabetes Mellitus, Type 2']))).toBe(2); expect(subtypeTier('type 2 diabetes', fields(['Type 1 Diabetes']))).toBe(-1); });
  it('does not infer a subtype from an exclusion in eligibility', () => { const f = fields(['Diabetes']); f.eligibility = 'Exclude type 2 diabetes'; expect(subtypeTier('T2D', f)).toBe(0); });
  it('uses cosine over actual vectors', () => { expect(cosine([1, 0], [1, 0])).toBe(1); expect(cosine([1, 0], [0, 1])).toBe(0); expect(() => cosine([1], [1, 2])).toThrow(); });
  it('fusion rewards agreement across both rankings rather than raw score scale', () => { const fused = fuseRanks([100, 90, 0], [0.1, 0.9, 0.8]); expect(fused[1]).toBeGreaterThan(fused[0]); expect(fused[1]).toBeGreaterThan(fused[2]); });
});