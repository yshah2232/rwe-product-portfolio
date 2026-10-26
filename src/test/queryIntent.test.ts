import { describe, it, expect } from 'vitest';
import { parseQuery, groundConcepts, verifyQuotes, isWeak, RETRIEVAL_LIMITS, type GroundFields } from '../../supabase/functions/_shared/queryIntent';

const rec: GroundFields = {
  briefTitle: 'Sotorasib in KRAS G12C Mutated NSCLC',
  officialTitle: '',
  conditions: ['Non Small Cell Lung Cancer'],
  interventions: ['Sotorasib'],
  keywords: [],
  eligibility: 'Inclusion: progression after prior platinum chemotherapy.',
  locations: ['MGH, Boston, Massachusetts, United States'],
  status: 'RECRUITING',
  phase: ['PHASE3'],
};

describe('parseQuery', () => {
  it('extracts condition, biomarker, location, status, phase and prior treatment', () => {
    const i = parseQuery('recruiting phase 3 KRAS G12C lung cancer trials near Boston after platinum chemotherapy');
    expect(i.biomarkers).toContain('kras g12c');
    expect(i.location).toBe('Boston');
    expect(i.status).toBe('RECRUITING');
    expect(i.phase).toBe('PHASE3');
    expect(i.priorTreatments[0]).toContain('platinum');
    expect(i.conditionTerms).toEqual(expect.arrayContaining(['lung', 'cancer']));
    expect(i.complexity).toBe(6);
  });
  it('treats a simple query as low complexity', () => {
    expect(parseQuery('diabetes').complexity).toBe(1);
  });
});

describe('grounding', () => {
  it('only reports concepts present in registry fields', () => {
    const i = parseQuery('KRAS G12C lung cancer near Chicago phase 2');
    const g = groundConcepts(i, rec);
    expect(g.evidence.map((e) => e.concept)).toContain('kras g12c');
    expect(g.notFound.map((n) => n.concept)).toEqual(expect.arrayContaining(['Chicago', 'PHASE2']));
  });
  it('rejects quotes that are not in the record', () => {
    expect(verifyQuotes([{ field: 'eligibility', quote: 'prior platinum' }], rec)).toBe(true);
    expect(verifyQuotes([{ field: 'eligibility', quote: 'prior immunotherapy' }], rec)).toBe(false);
    expect(verifyQuotes([], rec)).toBe(false);
  });
});

describe('adaptive retrieval limits', () => {
  it('flags weak pools and caps candidates at 75 over 3 calls', () => {
    expect(isWeak(9, 1)).toBe(true);
    expect(isWeak(25, 0.2)).toBe(true);
    expect(isWeak(25, 0.5)).toBe(false);
    expect(RETRIEVAL_LIMITS.MAX_CANDIDATES).toBe(75);
    expect(RETRIEVAL_LIMITS.MAX_CTG_CALLS).toBe(3);
  });
});
