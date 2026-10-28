import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { verifiedAdmin } from '../_shared/adminServer.ts';

const headers = { ...corsHeaders, 'Access-Control-Allow-Headers': `${corsHeaders['Access-Control-Allow-Headers']}, x-admin-session`, 'Content-Type': 'application/json', 'Cache-Control': 'no-store' };
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers });
  const session = await verifiedAdmin(req);
  if (!session) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers });
  if (req.method !== 'GET') return new Response(JSON.stringify({ error: 'GET only' }), { status: 405, headers });
  const { data, error } = await session.client.from('report_feedback').select('id, rating, comment, created_at').order('created_at', { ascending: false }).limit(200);
  return new Response(JSON.stringify(error ? { error: 'Could not load feedback' } : { rows: data ?? [] }), { status: error ? 500 : 200, headers });
});