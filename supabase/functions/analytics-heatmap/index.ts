import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { verifiedAdmin } from '../_shared/adminServer.ts';

const headers = { ...corsHeaders, 'Access-Control-Allow-Headers': `${corsHeaders['Access-Control-Allow-Headers']}, x-admin-session`, 'Content-Type': 'application/json', 'Cache-Control': 'no-store' };
const PATHS = ['/', '/search-registry'];



Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers });
  const session = await verifiedAdmin(req);
  if (!session) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers });
  const path = new URL(req.url).searchParams.get('path') ?? '/';
  if (!PATHS.includes(path)) {
    return new Response(JSON.stringify({ error: 'Invalid path' }), { status: 400, headers });
  }
  const supabase = session.client;
  const since = new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString();
  const { data, error } = await supabase
    .from('ui_interactions')
    .select('id, path, event_type, x_norm, y_norm, scroll_depth_pct, selector, element_text, created_at')
    .eq('path', path)
    .gte('created_at', since)
    .order('created_at', { ascending: false })
    .limit(5000);
  if (error) return new Response(JSON.stringify({ error: 'Query failed' }), { status: 500, headers });
  return new Response(JSON.stringify({ rows: data ?? [] }), { headers });
});
