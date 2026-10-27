// Admin-only access to visitor issue reports. Requires a verified AdminCEO
// session (x-admin-session header), same as analytics-heatmap.
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { verifiedAdmin } from '../_shared/adminServer.ts';

const headers = { ...corsHeaders, 'Access-Control-Allow-Headers': `${corsHeaders['Access-Control-Allow-Headers']}, x-admin-session`, 'Content-Type': 'application/json', 'Cache-Control': 'no-store' };
const STATUSES = ['new', 'in_review', 'resolved', 'dismissed'] as const;

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers });
  const session = await verifiedAdmin(req);
  if (!session) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers });
  const supabase = session.client;

  if (req.method === 'GET') {
    const { data, error } = await supabase
      .from('issue_reports')
      .select('id, category, message, page_url, status, created_at')
      .order('created_at', { ascending: false })
      .limit(200);
    if (error) return new Response(JSON.stringify({ error: 'Query failed' }), { status: 500, headers });
    return new Response(JSON.stringify({ rows: data ?? [] }), { headers });
  }

  if (req.method === 'PATCH') {
    let body: Record<string, unknown>;
    try {
      body = await req.json();
    } catch {
      return new Response(JSON.stringify({ error: 'Invalid request body' }), { status: 400, headers });
    }
    const id = typeof body.id === 'string' ? body.id : '';
    const status = typeof body.status === 'string' ? body.status : '';
    if (!/^[0-9a-f-]{36}$/i.test(id) || !STATUSES.includes(status as (typeof STATUSES)[number])) {
      return new Response(JSON.stringify({ error: 'Invalid id or status' }), { status: 400, headers });
    }
    const { error } = await supabase.from('issue_reports').update({ status }).eq('id', id);
    if (error) return new Response(JSON.stringify({ error: 'Update failed' }), { status: 500, headers });
    return new Response(JSON.stringify({ ok: true }), { headers });
  }

  return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405, headers });
});
