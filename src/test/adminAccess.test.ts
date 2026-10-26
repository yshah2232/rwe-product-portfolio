import { describe, expect, it } from 'vitest';
import { webcrypto } from 'node:crypto';
import { credentialsMatch, sessionIsCurrent } from '../../supabase/functions/_shared/adminAccess';

Object.defineProperty(globalThis, 'crypto', { value: webcrypto, configurable: true });
describe('administrator credential verification', () => {
  it('requires the exact AdminCEO username and configured password', async () => {
    expect(await credentialsMatch('AdminCEO', 'test-only-password', 'AdminCEO', 'test-only-password', 'test-only-key')).toBe(true);
    expect(await credentialsMatch('Other', 'test-only-password', 'AdminCEO', 'test-only-password', 'test-only-key')).toBe(false);
    expect(await credentialsMatch('AdminCEO', 'wrong', 'AdminCEO', 'test-only-password', 'test-only-key')).toBe(false);
  });
  it('refuses expired sessions and sessions from replaced credentials', () => {
    expect(sessionIsCurrent('2026-10-26T21:30:00Z', 'current', 'current', Date.parse('2026-10-26T21:29:00Z'))).toBe(true);
    expect(sessionIsCurrent('2026-10-26T21:30:00Z', 'current', 'current', Date.parse('2026-10-26T21:30:00Z'))).toBe(false);
    expect(sessionIsCurrent('2026-10-26T21:30:00Z', 'old', 'current', Date.parse('2026-10-26T21:29:00Z'))).toBe(false);
  });
});