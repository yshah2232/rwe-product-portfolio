import { describe, it, expect } from 'vitest';
import { parseQuery, prefersUS, rankKey } from '../../supabase/functions/_shared/queryIntent';

describe('US site priority', () => {
  it('prefers US when the query names the US', () => {
    expect(prefersUS('diabetes trials in US', parseQuery('diabetes trials in US'), false)).toBe(true);
  });
  it('prefers US when the query names a US state', () => {
    expect(prefersUS('asthma in Texas', parseQuery('asthma in Texas'), false)).toBe(true);
  });
  it('prefers US when the browser region is US', () => {
    expect(prefersUS('type 2 diabetes', parseQuery('type 2 diabetes'), true)).toBe(true);
  });
  it('does not prefer US otherwise', () => {
    expect(prefersUS('type 2 diabetes', parseQuery('type 2 diabetes'), false)).toBe(false);
  });
  it('a US trial outranks a slightly more relevant non US trial', () => {
    expect(rankKey(70, ['United States'], true)).toBeGreaterThan(rankKey(80, ['China'], true));
  });
  it('no boost when US is not preferred', () => {
    expect(rankKey(70, ['United States'], false)).toBe(70);
  });
});
