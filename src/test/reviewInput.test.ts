import { expect, it } from 'vitest';
import { validateReviewFiles } from '../../supabase/functions/_shared/reviewInput';
const file = { name: 'test.txt', mimeType: 'text/plain', dataBase64: 'eA==' };
it('rejects more than six files instead of silently dropping any', () => {
  expect(validateReviewFiles(Array(7).fill(file)).error).toBeTruthy();
  expect(validateReviewFiles(Array(6).fill(file)).files).toHaveLength(6);
});
it('rejects empty or malformed encoded data', () => {
  expect(validateReviewFiles([{ ...file, dataBase64: '' }]).error).toBeTruthy();
  expect(validateReviewFiles([{ ...file, dataBase64: '<bad>' }]).error).toBeTruthy();
});
it('rejects combined content exceeding eight MB', () => {
  expect(validateReviewFiles([{ ...file, dataBase64: 'AAAA'.repeat(3 * 1024 * 1024) }]).error).toBe('Combined files exceed 8 MB.');
});