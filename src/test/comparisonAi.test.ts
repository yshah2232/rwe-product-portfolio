import { describe, it, expect } from 'vitest';
import { compactTrial, validNcts, validGuideNcts, visibleCensusRows } from '../../supabase/functions/_shared/comparisonAiContext';

describe('comparison AI grounding', () => {
  it('allows the homepage guide without inventing a selection and bounds result context to ten', () => {
    expect(validGuideNcts([])).toBe(true);
    expect(validGuideNcts(['NCT00003666'])).toBe(true);
    expect(validGuideNcts(['NCT00003666', 'NCT00003666'])).toBe(false);
    expect(validGuideNcts(Array.from({ length: 11 }, (_, i) => `NCT${String(i).padStart(8, '0')}`))).toBe(false);
  });
  it('excludes cache rows that are not displayed on the current page', () => {
    const rows = [{ state: 'Massachusetts', acs_year: 2022 }, { state: 'California', acs_year: 2022 }, { state: 'Massachusetts', acs_year: 2021 }];
    expect(visibleCensusRows(rows, [{ state: 'Massachusetts', year: 2022 }])).toEqual([rows[0]]);
    expect(visibleCensusRows(rows, [])).toEqual([]);
  });
  it('accepts only 2 to 4 distinct registry identifiers', () => {
    expect(validNcts(['NCT00340600', 'NCT00247013'])).toBe(true);
    expect(validNcts(['NCT00340600'])).toBe(false);
    expect(validNcts(['NCT00340600', 'NCT00340600'])).toBe(false);
    expect(validNcts(['NCT00340600', 'not-a-trial'])).toBe(false);
    expect(validNcts(['NCT00340600', 'NCT00247013', 'NCT00075764', 'NCT04042701', 'NCT02275871'])).toBe(false);
  });
  it('keeps missing enrollment unknown and omits contacts from context', () => {
    const value = compactTrial({ protocolSection: { identificationModule: { nctId: 'NCT00340600' }, contactsLocationsModule: { centralContacts: [{ phone: 'private' }] } } });
    expect(value.enrollment).toBeNull();
    expect(value.listedSiteCount).toBeNull();
    expect(value).not.toHaveProperty('contacts');
    expect(JSON.stringify(value)).not.toContain('private');
    expect(value.source).toBe('https://clinicaltrials.gov/study/NCT00340600');
  });
});