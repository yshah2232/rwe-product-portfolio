import { describe, it, expect } from 'vitest';
import { isAllowedSearchOrigin } from '../../supabase/functions/_shared/searchOrigin';

describe('search origin protection', () => {
  it('allows the actual browser preview origin', () => {
    expect(isAllowedSearchOrigin('https://7540bb06-bb05-4ecb-9cb3-0ad86355f1bc.lovableproject.com')).toBe(true);
  });
  it('allows published, preview and custom domain pages', () => {
    for (const origin of ['https://rwe-ctg-new.lovable.app', 'https://id-preview--7540bb06-bb05-4ecb-9cb3-0ad86355f1bc.lovable.app', 'https://portfolio.ysclin.xyz', 'http://localhost:8080']) {
      expect(isAllowedSearchOrigin(origin)).toBe(true);
    }
  });
  it('rejects missing origins and lookalike domains', () => {
    for (const origin of ['', 'null', 'https://lovable.app.attacker.com', 'https://notlovableproject.com', 'https://attacker.com/lovable.app', 'http://rwe-ctg-new.lovable.app']) {
      expect(isAllowedSearchOrigin(origin)).toBe(false);
    }
  });
});