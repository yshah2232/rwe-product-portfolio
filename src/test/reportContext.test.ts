import { describe, it, expect } from 'vitest';
import { reportInsights, populationPercent } from '@/lib/reportContext';

describe('report observations', () => {
  it('counts only differences in concise fields without inventing missing enrollment', () => {
    const result = reportInsights([{ nctId: 'NCT00000001', status: 'RECRUITING' }, { nctId: 'NCT00000002', status: 'COMPLETED' }]);
    expect(result.trialCount).toBe(2);
    expect(result.differenceCount).toBe(1);
    expect(result.stateCount).toBe(0);
  });
  it('calculates Census percentages from the statewide denominator only', () => {
    expect(populationPercent(250, 1000)).toBe('25.0%');
    expect(populationPercent(undefined, 1000)).toBe('Not reported');
    expect(populationPercent(250, 0)).toBe('Not reported');
  });
});