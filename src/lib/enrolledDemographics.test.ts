import { describe, it, expect } from 'vitest';
import { parseEnrolledDemographics } from './enrolledDemographics';

const mod = {
  groups: [{ id: 'BG000', title: 'Drug' }, { id: 'BG001', title: 'Total' }],
  measures: [
    { title: 'Race (NIH/OMB)', paramType: 'COUNT_OF_PARTICIPANTS', classes: [{ categories: [
      { title: 'White', measurements: [{ groupId: 'BG000', value: '10' }, { groupId: 'BG001', value: '75' }] },
      { title: 'Black or African American', measurements: [{ groupId: 'BG001', value: '25' }] },
    ] }] },
  ],
};

describe('parseEnrolledDemographics', () => {
  it('uses the Total group counts exactly as reported', () => {
    const d = parseEnrolledDemographics(mod);
    expect(d.race?.total).toBe(100);
    expect(d.race?.categories[1]).toEqual({ label: 'Black or African American', count: 25, share: 0.25 });
  });
  it('returns nothing when ethnicity is not posted', () => {
    expect(parseEnrolledDemographics(mod).ethnicity).toBeNull();
  });
  it('returns nothing when the trial has no posted results', () => {
    expect(parseEnrolledDemographics(undefined)).toEqual({ race: null, ethnicity: null });
  });
});
