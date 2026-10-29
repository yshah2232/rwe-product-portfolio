import { describe, expect, it } from 'vitest';
import { audienceStatus, TRIAL_STATUSES } from '../../supabase/functions/_shared/trialStatus';
import { parseQuery } from '../../supabase/functions/_shared/queryIntent';
describe('audience status rules', () => {
  it('allows clinicians all statuses independent of reading format', () => {
    expect(audienceStatus('clinical', 'any')).toBe('any');
    for (const [status] of TRIAL_STATUSES) expect(audienceStatus('clinical', status)).toBe(status);
  });
  it('restricts patients and caregivers to recruiting', () => {
    expect(audienceStatus('patient', 'any')).toBe('RECRUITING');
    expect(audienceStatus('patient', 'COMPLETED')).toBe('RECRUITING');
  });
  for (const [status, label] of TRIAL_STATUSES) it(`parses ${status} without contaminating condition retrieval`, () => {
    expect(parseQuery(`${label} diabetes trials`).status).toBe(status);
    expect(parseQuery(`${label} diabetes trials`).conditionTerms).toEqual(['diabetes']);
    expect(parseQuery(`${status} diabetes trials`).status).toBe(status);
    expect(parseQuery(`${status} diabetes trials`).conditionTerms).toEqual(['diabetes']);
  });
});