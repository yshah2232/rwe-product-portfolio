import { expect, it, vi } from 'vitest';
import { retiredCohortService } from '../../supabase/functions/_shared/retiredService';
it('refuses retired processing without reading input or fetching records', async () => {
  const req = new Request('https://portfolio.ysclin.xyz', { method: 'POST', body: '{"cohortId":"private"}' });
  const read = vi.spyOn(req, 'json');
  const fetchSpy = vi.spyOn(globalThis, 'fetch');
  const response = retiredCohortService(req);
  expect(response.status).toBe(410);
  expect((await response.json()).error).toBe('service_retired');
  expect(read).not.toHaveBeenCalled();
  expect(fetchSpy).not.toHaveBeenCalled();
  vi.restoreAllMocks();
});