// Public aggregate counts for issue reports. Returns only counts — no message
// content, no URLs, nothing identifying. Read via the service role because the
// issue_reports table has no direct Data API access.
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { adminClient } from '../_shared/adminServer.ts';

const headers = { ...corsHeaders, 'Content-Type': 'application/json', 'Cache-Control': 'no-store' };

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers });
  if (req.method !== 'GET') return new Response(JSON.stringify({ error: 'GET only' }), { status: 405, headers });

  const supabase = adminClient();
  const { data, error } = await supabase
    .from('issue_reports')
    .select('status', { count: 'exact' });
  if (error) return new Response(JSON.stringify({ error: 'Could not load report stats' }), { status: 500, headers });

  const counts = { total: data?.length ?? 0, resolved: 0, in_review: 0, new: 0, dismissed: 0 };
  for (const row of data ?? []) {
    if (row.status in counts) counts[row.status as keyof typeof counts] += 1;
  }

  return new Response(JSON.stringify(counts), { headers });
});
