import { describe, it, expect } from 'vitest';
import { toggleSelection, fieldValue, fieldDiffers, MAX_COMPARE } from '@/lib/trialCompare';

describe('trial comparison selection', () => {
  it('allows at most four trials', () => {
    let s: string[] = [];
    for (const n of ['A', 'B', 'C', 'D', 'E']) s = toggleSelection(s, n);
    expect(s).toEqual(['A', 'B', 'C', 'D']);
    expect(MAX_COMPARE).toBe(4);
  });
  it('deselects a selected trial', () => {
    expect(toggleSelection(['A', 'B'], 'A')).toEqual(['B']);
  });
});

describe('trial comparison values', () => {
  it('keeps missing fields empty instead of filling them', () => {
    expect(fieldValue({ nctId: 'NCT00000001' }, 'enrollment')).toBeNull();
    expect(fieldValue({ nctId: 'NCT00000001' }, 'age')).toBeNull();
  });
  it('flags a difference when one trial is missing a value', () => {
    expect(fieldDiffers([{ nctId: 'a', enrollment: 100 }, { nctId: 'b' }], 'enrollment')).toBe(true);
  });
  it('does not flag identical values', () => {
    expect(fieldDiffers([{ nctId: 'a', status: 'RECRUITING' }, { nctId: 'b', status: 'RECRUITING' }], 'status')).toBe(false);
  });
});
