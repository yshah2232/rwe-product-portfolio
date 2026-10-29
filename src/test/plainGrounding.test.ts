import { describe, expect, it } from 'vitest';
import { supportedNumbers, enrollmentStatement, sourceClinicalView } from '../../supabase/functions/_shared/plainGrounding';
describe('Easy read quantity grounding', () => {
  it('rejects an invented 37 milliliter collection amount', () => expect(supportedNumbers('37 milliliters collected', { criteria: 'no more than 50 ml', enrollment: 500 })).toBe(false));
  it('retains source reported quantities', () => expect(supportedNumbers('36 days and 6 phone calls', { summary: '36 day study; six calls', calls: 6 })).toBe(true));
  it('does not turn estimated enrollment into actual participation', () => expect(enrollmentStatement(680, 'ESTIMATED')).toBe('680 participants planned as estimated enrollment'));
  it('keeps missing enrollment type explicit', () => expect(enrollmentStatement(2120, undefined)).toBe('2120 participants listed; actual or estimated enrollment is not specified'));
});
describe('clinical meaning preservation', () => {
  it('does not convert six 28 day courses into months', () => {
    const source = { brief_summary: 'Treatment repeats every 28 days for a minimum of six courses.' };
    const view = sourceClinicalView(source);
    expect(view.plain_summary).toBe(source.brief_summary);
    expect(view.journey_steps).toEqual([]);
    expect(view.plain_time_commitment).not.toContain('six months');
  });
  it('preserves metformin dose alternatives and lifetime exclusions exactly', () => {
    const eligibility_criteria = 'Metformin at least 1500 mg or maximal tolerated dose.\nNo prior anthracycline at any time.';
    const view = sourceClinicalView({ eligibility_criteria });
    expect(view.plain_eligibility).toBe(eligibility_criteria);
    expect(view.doc_checklist.map((item) => item.why).join('\n')).toBe(eligibility_criteria);
    expect(view.key_numbers).toEqual([]);
  });
  it('does not invent a seven day lead in or five tubes from unrelated numbers', () => {
    const view = sourceClinicalView({ detailed_description: 'Testing two days before the test meal.', enrollment_count: 500, enrollment_type: 'ESTIMATED', listed_site_count: 4 });
    expect(view.plain_what_happens).toBe('Testing two days before the test meal.');
    expect(view.key_numbers).toEqual(['500 participants planned as estimated enrollment', '4 facility listings on the registry record']);
    expect(view.journey_steps).toEqual([]);
  });
});