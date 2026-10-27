import { describe, it, expect } from 'vitest';
import { parseQuery, groundConcepts, verifyQuotes, isWeak, RETRIEVAL_LIMITS, dedupeEvidence, matchLocation, type GroundFields, type Evidence } from '../../supabase/functions/_shared/queryIntent';

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

describe("location parsing (any urban or rural place)", () => {
  it("reads lowercase 'near boston'", () => {
    expect(parseQuery("lung cancer trials near boston").location).toBe("Boston");
  });
  it("skips the rural qualifier and keeps the state", () => {
    expect(parseQuery("diabetes study in rural Ohio").location).toBe("Ohio");
  });
  it("reads a small town name", () => {
    expect(parseQuery("breast cancer near Bozeman Montana").location).toBe("Bozeman Montana");
  });
  it("does not treat 'in patients' as a place", () => {
    expect(parseQuery("KRAS G12C in patients after chemo").location).toBeNull();
  });
});

describe("location parsing without a cue word", () => {
  it("reads a trailing capitalized city as a possible location", () => {
    const i = parseQuery("non small cell lung cancer Boston");
    expect(i.location).toBe("Boston");
    expect(i.locationConfidence).toBe("low");
    expect(i.conditionTerms).toEqual(expect.arrayContaining(["lung", "cancer"]));
    expect(i.conditionTerms).not.toContain("boston");
  });
  it("keeps cue-word locations high confidence", () => {
    const i = parseQuery("non small cell lung cancer in Boston");
    expect(i.location).toBe("Boston");
    expect(i.locationConfidence).toBe("high");
  });
  it("reads a multi-word state anywhere in the query", () => {
    const i = parseQuery("breast cancer New Jersey");
    expect(i.location).toBe("New Jersey");
    expect(i.locationConfidence).toBe("high");
    expect(i.conditionTerms).not.toContain("jersey");
  });
  it("joins a capitalized city before a state", () => {
    const i = parseQuery("diabetes Dallas Texas");
    expect(i.location).toBe("Dallas Texas");
    expect(i.locationConfidence).toBe("high");
  });
  it("reads a state after a condition with an apostrophe", () => {
    const i = parseQuery("Alzheimer's California");
    expect(i.location).toBe("California");
    expect(i.locationConfidence).toBe("high");
  });
  it("does not guess a location from a title-cased condition", () => {
    expect(parseQuery("Small Cell Lung Cancer").location).toBeNull();
  });
  it("does not guess a location from a trailing biomarker", () => {
    expect(parseQuery("lung cancer KRAS").location).toBeNull();
  });
});

describe("dedupeEvidence", () => {
  const ev = (concept: string, type: string, field: Evidence["field"], snippet: string): Evidence =>
    ({ concept, type, field, snippet });
  it("removes repeated snippets and repeated concepts", () => {
    const out = dedupeEvidence([
      ev("lung cancer", "condition", "conditions", "Non Small Cell Lung Cancer"),
      ev("lung cancer", "condition", "conditions", "Non Small Cell Lung Cancer"),
      ev("lung cancer", "condition", "title", "…lung cancer…"),
    ]);
    expect(out).toHaveLength(1);
  });
  it("caps at three items in priority order", () => {
    const out = dedupeEvidence([
      ev("PHASE3", "phase", "phase", "PHASE3"),
      ev("chemo", "prior treatment", "eligibility", "…prior chemo…"),
      ev("Boston", "location", "locations", "3 listed sites in Boston"),
      ev("RECRUITING", "status", "status", "RECRUITING"),
      ev("lung cancer", "condition", "conditions", "Lung Cancer"),
    ]);
    expect(out.map((e) => e.type)).toEqual(["condition", "status", "location"]);
  });
  it("collapses multi-word condition evidence to one row per field", () => {
    const out = dedupeEvidence([
      ev("non", "condition", "conditions", "…Non Small Cell Lung Cancer…"),
      ev("small", "condition", "conditions", "…Non Small Cell Lung Cancer…"),
      ev("cell", "condition", "conditions", "…Non Small Cell Lung Cancer…"),
      ev("lung", "condition", "title", "…lung cancer trial…"),
    ]);
    expect(out).toHaveLength(2);
    expect(out.map((e) => e.field)).toEqual(["conditions", "title"]);
  });
});

describe("matchLocation with city + state", () => {
  const sites = [
    { city: "Dallas", state: "Texas", country: "United States", status: "RECRUITING" },
    { city: "Houston", state: "Texas", country: "United States", status: "RECRUITING" },
    { city: "Boston", state: "Massachusetts", country: "United States", status: "RECRUITING" },
  ];
  it("confirms a city + state pair against the city", () => {
    const m = matchLocation("Dallas Texas", sites);
    expect(m.confirmed).toBe(true);
    expect(m.matchedSites).toBe(1);
  });
  it("falls back to the state when the city is not listed", () => {
    const m = matchLocation("Plano Texas", sites);
    expect(m.confirmed).toBe(true);
    expect(m.matchedSites).toBe(2);
  });
  it("still matches a bare state or city", () => {
    expect(matchLocation("Texas", sites).matchedSites).toBe(2);
    expect(matchLocation("Boston", sites).matchedSites).toBe(1);
  });
});
