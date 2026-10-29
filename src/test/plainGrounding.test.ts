import { describe, expect, it } from 'vitest';
import { supportedNumbers, enrollmentStatement } from '../../supabase/functions/_shared/plainGrounding';
describe('Easy read quantity grounding', () => {
  it('rejects an invented 37 milliliter collection amount', () => expect(supportedNumbers('37 milliliters collected', { criteria: 'no more than 50 ml', enrollment: 500 })).toBe(false));
  it('retains source reported quantities', () => expect(supportedNumbers('36 days and 6 phone calls', { summary: '36 day study; six calls', calls: 6 })).toBe(true));
  it('does not turn estimated enrollment into actual participation', () => expect(enrollmentStatement(680, 'ESTIMATED')).toBe('680 participants planned as estimated enrollment'));
  it('keeps missing enrollment type explicit', () => expect(enrollmentStatement(2120, undefined)).toBe('2120 participants listed; actual or estimated enrollment is not specified'));
});