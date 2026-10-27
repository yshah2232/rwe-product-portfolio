import { describe, it, expect, vi } from 'vitest';
import { sendSignal, getSessionId } from '@/lib/searchSession';
import { track } from '@/lib/track';

describe('visitor activity privacy', () => {
  it('does not send visitor signals or save the request identifier', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch');
    const storageSpy = vi.spyOn(Storage.prototype, 'setItem');
    getSessionId();
    await sendSignal({ type: 'interaction', nctId: 'NCT00000001' });
    expect(fetchSpy).not.toHaveBeenCalled();
    expect(storageSpy).not.toHaveBeenCalled();
    vi.restoreAllMocks();
  });
  it('does not emit analytics events or console activity', () => {
    const eventSpy = vi.spyOn(window, 'dispatchEvent');
    const logSpy = vi.spyOn(console, 'info');
    track('search_registry_query', { query: 'diabetes' });
    expect(eventSpy).not.toHaveBeenCalled();
    expect(logSpy).not.toHaveBeenCalled();
    vi.restoreAllMocks();
  });
});