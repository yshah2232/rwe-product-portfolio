// ── Data Loader ──
// Loads pre-computed JSON datasets from public/data/{world}/
// Replaces the runtime generator with authentic, calibrated synthetic data.

import type {
  TherapeuticWorld, WorldDataset, Provider, Payer, Patient,
  Journey, Referral, Codeset, CalibrationParameter, EventsSummary,
} from './types';
import { WORLD_META } from './worldConfigs';

const cache = new Map<TherapeuticWorld, WorldDataset>();

async function fetchJson<T>(path: string): Promise<T> {
  const res = await fetch(path);
  if (!res.ok) throw new Error(`Failed to load ${path}: ${res.status}`);
  return res.json();
}

export async function loadWorld(world: TherapeuticWorld): Promise<WorldDataset> {
  if (cache.has(world)) return cache.get(world)!;

  const base = `/data/${world}`;

  const [providers, payers, patients, eventsSummary, journeys, referrals, codesets, parameters] =
    await Promise.all([
      fetchJson<Provider[]>(`${base}/providers.json`),
      fetchJson<Payer[]>(`${base}/payers.json`),
      fetchJson<Patient[]>(`${base}/patients.json`),
      fetchJson<EventsSummary>(`${base}/events_summary.json`),
      fetchJson<Journey[]>(`${base}/journeys.json`),
      fetchJson<Referral[]>(`${base}/referrals.json`),
      fetchJson<Codeset[]>(`${base}/codesets.json`),
      fetchJson<CalibrationParameter[]>(`${base}/parameters.json`),
    ]);

  const dataset: WorldDataset = {
    meta: WORLD_META[world],
    providers,
    payers,
    patients,
    eventsSummary,
    journeys,
    referrals,
    codesets,
    parameters,
  };

  cache.set(world, dataset);
  return dataset;
}

// Synchronous fallback using the old generator for initial render
// This gets replaced once async data loads
export function getWorldSync(world: TherapeuticWorld): WorldDataset | null {
  return cache.get(world) || null;
}

export function clearWorldCache(world?: TherapeuticWorld) {
  if (world) cache.delete(world);
  else cache.clear();
}
