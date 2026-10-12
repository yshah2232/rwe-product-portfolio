import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { createClient } from 'npm:@supabase/supabase-js@2';

const headers = { ...corsHeaders, 'Access-Control-Allow-Headers': `${corsHeaders['Access-Control-Allow-Headers']}, x-admin-password`, 'Content-Type': 'application/json', 'Cache-Control': 'no-store' };
const PATHS = ['/', '/search-registry'];

function safeEqual(a: string, b: string) {
  if (a.length !== b.length) return false;
  let r = 0;
  for (let i = 0; i < a.length; i++) r |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return r === 0;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers });
  const expected = Deno.env.get('ANALYTICS_ADMIN_PASSWORD');
  const given = req.headers.get('x-admin-password') ?? '';
  if (!expected || !safeEqual(given, expected)) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers });
  }
  const path = new URL(req.url).searchParams.get('path') ?? '/';
  if (!PATHS.includes(path)) {
    return new Response(JSON.stringify({ error: 'Invalid path' }), { status: 400, headers });
  }
  const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
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
