import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { verifiedAdmin } from '../_shared/adminServer.ts';
import { z } from 'npm:zod@3';

const headers = { ...corsHeaders, 'Access-Control-Allow-Headers': `${corsHeaders['Access-Control-Allow-Headers']}, x-admin-session`, 'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS', 'Content-Type': 'application/json', 'Cache-Control': 'no-store' };
const res = (b: unknown, status = 200) => new Response(JSON.stringify(b), { status, headers });



const CaseSchema = z.object({
  action: z.literal('create_case'),
  query: z.string().trim().min(3).max(200),
  expected_concepts: z.array(z.string().trim().min(1).max(80)).max(15),
  notes: z.string().max(1000).optional(),
});
const RunSchema = z.object({
  action: z.literal('record_run'),
  case_id: z.string().uuid(),
  top5_ncts: z.array(z.string().regex(/^NCT\d{8}$/)).max(5),
  relevant_in_top5: z.boolean(),
  relevant_rank: z.number().int().min(1).max(5).nullable().optional(),
  candidates_fetched: z.number().int().min(0).max(1000).nullable().optional(),
  retrieval_passes: z.number().int().min(0).max(10).nullable().optional(),
  notes: z.string().max(1000).optional(),
});

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers });
  const session = await verifiedAdmin(req);
  if (!session) return res({ error: 'Unauthorized' }, 401);
  const sb = session.client;

  if (req.method === 'GET') {
    const [cases, runs] = await Promise.all([
      sb.from('search_eval_cases').select('*').order('created_at', { ascending: false }).limit(200),
      sb.from('search_eval_runs').select('*').order('created_at', { ascending: false }).limit(1000),
    ]);
    if (cases.error || runs.error) return res({ error: 'Query failed' }, 500);
    return res({ cases: cases.data, runs: runs.data });
  }
  if (req.method === 'DELETE') {
    const id = new URL(req.url).searchParams.get('id') ?? '';
    if (!z.string().uuid().safeParse(id).success) return res({ error: 'Invalid id' }, 400);
    const { error } = await sb.from('search_eval_cases').delete().eq('id', id);
    return error ? res({ error: 'Delete failed' }, 500) : res({ ok: true });
  }
  if (req.method === 'POST') {
    const body = await req.json().catch(() => null);
    if (body?.action === 'create_case') {
      const p = CaseSchema.safeParse(body);
      if (!p.success) return res({ error: p.error.flatten().fieldErrors }, 400);
      const { action: _a, ...row } = p.data;
      const { data, error } = await sb.from('search_eval_cases').insert(row).select().single();
      return error ? res({ error: 'Insert failed' }, 500) : res({ case: data });
    }
    if (body?.action === 'record_run') {
      const p = RunSchema.safeParse(body);
      if (!p.success) return res({ error: p.error.flatten().fieldErrors }, 400);
      const { action: _a, ...row } = p.data;
      const { data, error } = await sb.from('search_eval_runs').insert(row).select().single();
      return error ? res({ error: 'Insert failed' }, 500) : res({ run: data });
    }
    return res({ error: 'Unknown action' }, 400);
  }
  return res({ error: 'Method not allowed' }, 405);
});
