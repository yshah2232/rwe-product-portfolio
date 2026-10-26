import { describe, expect, it } from 'vitest';
import { computeBarrierScore, barrierLevelLabel } from '@/lib/barrierScore';

// Real ACS 2022 5-year reference values (verified from api.census.gov):
// US national: LEP 8.6% (limited-English-speaking households, pop 5+),
// poverty 12.5% (B17001). County examples used below are plausible-shaped
// inputs; the formula under test is what matters, inputs are illustrative.

describe('computeBarrierScore', () => {
  it('scores a county with both rates well above national as high', () => {
    const r = computeBarrierScore(
      { pct: 12.9, nationalPct: 8.6 },   // 1.5x national LEP
      { pct: 18.75, nationalPct: 12.5 }, // 1.5x national poverty
    );
    expect(r.languageAccess.ratio).toBeCloseTo(150, 0);
    expect(r.languageAccess.level).toBe('high');
    expect(r.socioeconomicStrain.level).toBe('high');
    expect(r.barrierScore).toBe(100); // contributions capped at 100 each
  });

  it('does not inflate the score past the cap when a county dwarfs national', () => {
    const r = computeBarrierScore(
      { pct: 40, nationalPct: 8.6 },
      { pct: 5, nationalPct: 12.5 },
    );
    expect(r.languageAccess.ratio).toBeCloseTo(465.1, 1); // uncapped ratio, capped contribution
    expect(r.socioeconomicStrain.level).toBe('low');
    expect(r.barrierScore).toBe(70); // mean(100, 40)
  });

  it('classifies at-national and below-national rates', () => {
    const atNational = computeBarrierScore(
      { pct: 8.6, nationalPct: 8.6 },
      { pct: 12.5, nationalPct: 12.5 },
    );
    expect(atNational.languageAccess.level).toBe('moderate');
    expect(atNational.socioeconomicStrain.level).toBe('moderate');
    expect(atNational.barrierScore).toBe(100);

    const below = computeBarrierScore(
      { pct: 4.3, nationalPct: 8.6 },
      { pct: 6.25, nationalPct: 12.5 },
    );
    expect(below.languageAccess.level).toBe('low');
    expect(below.socioeconomicStrain.level).toBe('low');
    expect(below.barrierScore).toBe(50);
  });

  it('propagates unknown components as null, never fabricates', () => {
    const bothNull = computeBarrierScore(
      { pct: null, nationalPct: 8.6 },
      { pct: null, nationalPct: 12.5 },
    );
    expect(bothNull.languageAccess.level).toBe('unknown');
    expect(bothNull.socioeconomicStrain.level).toBe('unknown');
    expect(bothNull.barrierScore).toBeNull();

    const oneNull = computeBarrierScore(
      { pct: 4.3, nationalPct: 8.6 },
      { pct: null, nationalPct: 12.5 },
    );
    expect(oneNull.barrierScore).toBe(50); // single available component only
    expect(oneNull.socioeconomicStrain.level).toBe('unknown');
  });

  it('handles a zero national baseline without dividing by zero', () => {
    const r = computeBarrierScore(
      { pct: 5, nationalPct: 0 },
      { pct: 10, nationalPct: 12.5 },
    );
    expect(r.languageAccess.level).toBe('unknown');
    expect(r.socioeconomicStrain.level).toBe('moderate');
    expect(r.barrierScore).toBe(80);
  });

  it('labels levels', () => {
    expect(barrierLevelLabel('high')).toBe('High');
    expect(barrierLevelLabel('moderate')).toBe('Moderate');
    expect(barrierLevelLabel('low')).toBe('Low');
    expect(barrierLevelLabel('unknown')).toBe('Unknown');
  });
});
