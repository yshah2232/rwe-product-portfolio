import { describe, it, expect } from 'vitest';
import { hasBannedLanguage, sanitizeReviewText, ALLOWED_MIME } from '../../supabase/functions/_shared/reviewLanguage';
import { VERDICT_LABEL } from '@/components/EligibilityCheck';

describe('document review safe language', () => {
  it.each(['You are eligible.', 'Likely eligible for this study.', 'You qualify.', 'This is a recommended trial.', 'You are not eligible.'])('flags "%s"', (t) => {
    expect(hasBannedLanguage(t)).toBe(true);
  });
  it('drops banned sentences, keeps neutral ones', () => {
    expect(sanitizeReviewText('The report lists stage III disease. You are likely eligible.')).toBe('The report lists stage III disease.');
  });
  it('labels are only the four allowed ones', () => {
    expect(Object.values(VERDICT_LABEL).sort()).toEqual([
      'Information supports this listed criterion', 'Insufficient information', 'No supporting information found', 'Potential conflict identified',
    ].sort());
  });
  it('rejects unsupported file types', () => {
    expect(ALLOWED_MIME.test('application/zip')).toBe(false);
    expect(ALLOWED_MIME.test('application/pdf')).toBe(true);
  });
});
