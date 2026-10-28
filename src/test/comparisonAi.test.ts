import { describe, it, expect } from 'vitest';
import { compactTrial, validNcts } from '../../supabase/functions/_shared/comparisonAiContext';

describe('comparison AI grounding', () => {
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