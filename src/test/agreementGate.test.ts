import { describe, it, expect, vi } from 'vitest';
import { createPendingSearchGate, readAcceptance, KEY_ACCEPTANCE, TERMS_VERSION } from '@/lib/agreementGate';

const store = (v?: object) => { const m = new Map<string, string>(); if (v) m.set(KEY_ACCEPTANCE, JSON.stringify(v)); return { getItem: (k: string) => m.get(k) ?? null }; };
const ok = { audience: 'clinical', accepted: true, termsVersion: TERMS_VERSION, acceptedAt: '2026-10-27' };

describe('agreement gate', () => {
  it('makes no request before acceptance', () => {
    const run = vi.fn(); const g = createPendingSearchGate(run);
    g.offer('breast cancer', false); g.release(false);
    expect(run).not.toHaveBeenCalled();
  });
  it('preserves the direct URL query while waiting', () => {
    const g = createPendingSearchGate(vi.fn());
    g.offer('breast cancer', false);
    expect(g.pending).toBe('breast cancer');
  });
  it('executes the preserved query exactly once after acceptance', () => {
    const run = vi.fn(); const g = createPendingSearchGate(run);
    g.offer('breast cancer', false);
    g.release(true); g.release(true); g.offer('breast cancer', true);
    expect(run).toHaveBeenCalledTimes(1);
    expect(run).toHaveBeenCalledWith('breast cancer');
  });
  it('runs immediately for returning accepted users', () => {
    const run = vi.fn(); const g = createPendingSearchGate(run);
    g.offer('diabetes', !!readAcceptance(store(ok)));
    expect(run).toHaveBeenCalledTimes(1);
  });
  it('requires acceptance again after storage is cleared', () => {
    expect(readAcceptance(store())).toBeNull();
  });
  it('requires acceptance again when the terms version changes', () => {
    expect(readAcceptance(store(ok), '2027-01-01')).toBeNull();
    expect(readAcceptance(store({ ...ok, termsVersion: '2025-01-01' }))).toBeNull();
  });
});
