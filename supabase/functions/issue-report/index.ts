// Public issue-report intake. Visitors deliberately submit a short message;
// nothing else is collected (no identity, no tracking). Insert-only via the
// service role; the table has no direct Data API access.
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { adminClient } from '../_shared/adminServer.ts';

const headers = { ...corsHeaders, 'Content-Type': 'application/json', 'Cache-Control': 'no-store' };
const CATEGORIES = ['bug', 'wrong_information', 'feature_request', 'other'] as const;

function clientKey(req: Request): string {
  const fwd = req.headers.get('x-forwarded-for') ?? '';
  return fwd.split(',')[0]?.trim() || 'unknown';
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers });
  if (req.method !== 'POST') return new Response(JSON.stringify({ error: 'POST only' }), { status: 405, headers });

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid request body' }), { status: 400, headers });
  }

  const category = typeof body.category === 'string' ? body.category : '';
  const message = typeof body.message === 'string' ? body.message.trim() : '';
  const pageUrl = typeof body.pageUrl === 'string' ? body.pageUrl.slice(0, 500) : null;

  if (!CATEGORIES.includes(category as (typeof CATEGORIES)[number])) {
    return new Response(JSON.stringify({ error: 'Choose a valid category' }), { status: 400, headers });
  }
  if (message.length < 10 || message.length > 2000) {
    return new Response(JSON.stringify({ error: 'Message must be between 10 and 2000 characters' }), { status: 400, headers });
  }
  if (pageUrl && !/^https?:\/\//.test(pageUrl)) {
    return new Response(JSON.stringify({ error: 'Invalid page URL' }), { status: 400, headers });
  }

  const supabase = adminClient();

  // Basic rate limit: max 5 reports per client per hour, using the existing
  // login-limit bucket table with a distinct key prefix.
  const bucket = `issue:${clientKey(req)}`;
  const { data: allowed, error: limitError } = await supabase.rpc('consume_admin_login_attempt', { p_key: bucket, p_limit: 5 });
  if (limitError) return new Response(JSON.stringify({ error: 'Could not submit right now' }), { status: 500, headers });
  if (!allowed) return new Response(JSON.stringify({ error: 'Too many reports. Please try again later.' }), { status: 429, headers });

  const { error } = await supabase.from('issue_reports').insert({ category, message, page_url: pageUrl });
  if (error) return new Response(JSON.stringify({ error: 'Could not save the report' }), { status: 500, headers });
  return new Response(JSON.stringify({ ok: true }), { headers });
});
