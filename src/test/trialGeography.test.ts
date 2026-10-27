import { describe, it, expect } from 'vitest';
import { summarizeGeography } from '@/lib/trialGeography';

describe('summarizeGeography', () => {
  const s = summarizeGeography([
    { nctId: 'NCT1', locations: [
      { state: 'California', country: 'United States', status: 'RECRUITING' } as any,
      { state: 'California', country: 'United States', status: 'COMPLETED' } as any,
      { state: 'Texas', country: 'United States' } as any,
    ] },
    { nctId: 'NCT2', locations: [] },
    { nctId: 'NCT3', locations: [{ country: 'Canada', state: 'Ontario' } as any] },
    { nctId: 'NCT4', locations: [{ country: 'United States', state: '' } as any] },
  ]);

  it('counts sites and recruiting sites per state', () => {
    const ca = s.states.find((r) => r.state === 'California')!;
    expect(ca.siteCount).toBe(2);
    expect(ca.recruitingSites).toBe(1);
    expect(ca.trials).toEqual(['NCT1']);
  });

  it('keeps missing site status as unreported, not as not recruiting', () => {
    const tx = s.states.find((r) => r.state === 'Texas')!;
    expect(tx.recruitingSites).toBe(0);
    expect(tx.statusUnreported).toBe(1);
  });

  it('marks trials without facility data instead of counting zero sites', () => {
    const cov = Object.fromEntries(s.trials.map((t) => [t.nctId, t.coverage]));
    expect(cov).toEqual({ NCT1: 'us', NCT2: 'none_listed', NCT3: 'non_us_only', NCT4: 'us_state_missing' });
  });

  it('groups states into Census regions', () => {
    expect(s.regions.map((r) => r.region).sort()).toEqual(['South', 'West']);
  });
});
