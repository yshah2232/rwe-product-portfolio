import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { adminClient } from '../_shared/adminServer.ts';
import { isAllowedSearchOrigin } from '../_shared/searchOrigin.ts';
import { ReportFeedbackSchema } from '../_shared/reportFeedback.ts';

const headers = { ...corsHeaders, 'Content-Type': 'application/json', 'Cache-Control': 'no-store' };
const buckets = new Map<string, { count: number; until: number }>();
const reply = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers });

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers });
  if (req.method !== 'POST') return reply({ error: 'POST only' }, 405);
  if (!isAllowedSearchOrigin(req.headers.get('origin') ?? '')) return reply({ error: 'Origin not allowed' }, 403);
  if (Number(req.headers.get('content-length')) > 10000) return reply({ error: 'Request too large' }, 413);
  const parsed = ReportFeedbackSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return reply({ error: 'Choose a rating from 1 to 5 and keep comments within 1000 characters.' }, 400);
  // Best effort, instance-local abuse protection. No IP or identifier written to storage.
  const now = Date.now();
  for (const [key, value] of buckets) if (value.until <= now) buckets.delete(key);
  const key = (req.headers.get('x-forwarded-for') ?? 'unknown').split(',')[0].trim();
  const bucket = buckets.get(key) ?? { count: 0, until: now + 3600000 };
  if (bucket.count >= 5 || buckets.size >= 10000) return reply({ error: 'Too many submissions. Please try again later.' }, 429);
  bucket.count += 1;
  buckets.set(key, bucket);
  const { error } = await adminClient().from('report_feedback').insert(parsed.data);
  return error ? reply({ error: 'Feedback could not be saved. Please try again.' }, 500) : reply({ ok: true });
});