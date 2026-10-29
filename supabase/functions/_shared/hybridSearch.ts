import lunr from 'npm:lunr@2.3.9';
import { cosine, embeddingText, fuseRanks } from './hybridRanking.ts';
import type { GroundFields } from './queryIntent.ts';

export class HybridError extends Error {
  constructor(public status: number, message: string) { super(message); }
}

// A UTF8 byte budget is a conservative upper bound, not an estimated token count.
// Split complete text without dropping any source content; default full vector dimensions.
function chunks(text: string): string[] {
  const out: string[] = []; let current = '', bytes = 0;
  for (const point of text) {
    const size = new TextEncoder().encode(point).length;
    if (bytes + size > 6000) { out.push(current); current = ''; bytes = 0; }
    current += point; bytes += size;
  }
  if (current) out.push(current);
  return out;
}

export async function hybridScores(query: string, fields: GroundFields[], apiKey: string, signal: AbortSignal) {
  const index = lunr(function () {
    this.ref('id'); this.field('title', { boost: 4 }); this.field('conditions', { boost: 6 }); this.field('keywords', { boost: 3 }); this.field('interventions', { boost: 2 });
    this.b(0.75); this.k1(1.2);
    fields.forEach((f, i) => this.add({ id: String(i), title: `${f.briefTitle} ${f.officialTitle}`, conditions: f.conditions.join(' '), keywords: f.keywords.join(' '), interventions: f.interventions.join(' ') }));
  });
  const keyword = fields.map(() => 0);
  index.query((q) => query.toLowerCase().match(/[\p{L}\p{N}]+/gu)?.forEach((term) => q.term(term))).forEach((r) => { keyword[Number(r.ref)] = r.score; });
  const documents = [query, ...fields.map(embeddingText)];
  const inputs: string[] = [], owners: number[] = [];
  documents.forEach((text, owner) => chunks(text || 'Not reported').forEach((part) => { inputs.push(part); owners.push(owner); }));
  const vectors: number[][][] = documents.map(() => []);
  for (let start = 0; start < inputs.length; start += 100) {
    const batch = inputs.slice(start, start + 100);
    const response = await fetch('https://ai.gateway.lovable.dev/v1/embeddings', {
      method: 'POST', signal, headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: 'google/gemini-embedding-2', input: batch }),
    });
    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new HybridError(response.status, error.message || error.error?.message || `Vector search unavailable (${response.status}).`);
    }
    const result = await response.json() as { data: { index: number; embedding: number[] }[] };
    const ordered: (number[] | undefined)[] = Array.from({ length: batch.length });
    for (const item of result.data ?? []) {
      if (!Number.isInteger(item.index) || item.index < 0 || item.index >= batch.length || ordered[item.index] || !item.embedding?.length || item.embedding.some((v) => !Number.isFinite(v))) throw new HybridError(502, 'Invalid vector response.');
      ordered[item.index] = item.embedding;
    }
    ordered.forEach((vector, i) => { if (!vector) throw new HybridError(502, 'Missing vector response.'); vectors[owners[start + i]].push(vector); });
  }
  const dense = fields.map((_, i) => Math.max(...vectors[i + 1].flatMap((vector) => vectors[0].map((q) => cosine(q, vector)))));
  return { keyword, dense, fused: fuseRanks(keyword, dense), model: 'google/gemini-embedding-2' };
}