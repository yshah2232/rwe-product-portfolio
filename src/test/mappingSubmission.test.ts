import { describe, expect, it } from 'vitest';
import { MAPPING_BODY_BYTES, MAPPING_HOURLY_LIMIT, parseMappingSubmission } from '../../supabase/functions/_shared/mappingSubmission';

const submission = { fieldType: 'sponsor', rawValue: 'National Cancer Institute', suggestedClean: 'National Cancer Institute (NCI)', acceptance: { accepted: true, termsVersion: '2026-10-27', audience: 'clinical' } };
describe('mapping correction safeguards', () => {
  it('requires the current agreement and an audience', () => {
    expect(parseMappingSubmission(submission)?.fieldType).toBe('sponsor');
    expect(parseMappingSubmission({ ...submission, acceptance: { ...submission.acceptance, accepted: false } })).toBeNull();
    expect(parseMappingSubmission({ ...submission, acceptance: { ...submission.acceptance, termsVersion: 'old' } })).toBeNull();
    expect(parseMappingSubmission({ ...submission, acceptance: { ...submission.acceptance, audience: 'unspecified' } })).toBeNull();
  });
  it('rejects visitor identifiers and overlong input instead of silently truncating', () => {
    expect(parseMappingSubmission({ ...submission, sessionId: 'not-retained' })).toBeNull();
    expect(parseMappingSubmission({ ...submission, note: 'x'.repeat(501) })).toBeNull();
    expect(parseMappingSubmission({ ...submission, suggestedClean: 'x'.repeat(201) })).toBeNull();
  });
  it('bounds the hourly intake and complete request size', () => {
    expect(MAPPING_HOURLY_LIMIT).toBe(5);
    expect(MAPPING_BODY_BYTES).toBe(8192);
  });
});