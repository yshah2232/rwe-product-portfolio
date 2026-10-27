import { describe, it, expect } from 'vitest';
import { matchLocation, locationSentence, stripLocationClaims, matchLabels, scoresAreDifferentiated, groundConcepts, parseQuery } from '../../supabase/functions/_shared/queryIntent';

describe('location evidence', () => {
  const sites = [{ city: 'Newark', state: 'New Jersey', country: 'United States', status: 'RECRUITING' }, { city: 'Paris', country: 'France' }];
  it('confirms a state from structured facility data', () => {
    expect(matchLocation('New Jersey', sites)).toEqual({ confirmed: true, matchedSites: 1, recruitingMatched: 1 });
  });
  it('does not confirm an unlisted state', () => {
    expect(matchLocation('Texas', sites).confirmed).toBe(false);
  });
  it('uses the required wording', () => {
    expect(locationSentence('New Jersey', true, true)).toBe('Recruiting trial with one or more listed sites in New Jersey.');
    expect(locationSentence('New Jersey', false, true)).toBe('The available registry record does not confirm a site in New Jersey.');
  });
  it('groundConcepts reports location from sites', () => {
    const f = { briefTitle: 'Breast cancer', officialTitle: '', conditions: ['Breast Cancer'], interventions: [], keywords: [], eligibility: '', locations: [], status: 'RECRUITING', phase: [], sites };
    const g = groundConcepts(parseQuery('Recruiting breast cancer trials in New Jersey'), f);
    expect(g.notFound.some((n) => n.type === 'location')).toBe(false);
  });
  it('strips reranker geography claims', () => {
    expect(stripLocationClaims('Recruits breast cancer patients. The location is not stated in the record.', 'New Jersey')).toBe('Recruits breast cancer patients.');
  });
});

describe('scores', () => {
  it('hides identical scores', () => { expect(scoresAreDifferentiated(Array(10).fill(50))).toBe(false); });
  it('keeps differentiated scores', () => { expect(scoresAreDifferentiated([90, 72, 55, 40])).toBe(true); });
  it('labels only evidenced concepts', () => {
    expect(matchLabels([{ concept: 'breast', type: 'condition', field: 'conditions', snippet: '' }], false)).toEqual(['Condition match']);
  });
});
