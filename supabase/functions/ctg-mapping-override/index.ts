import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { adminClient } from '../_shared/adminServer.ts';
import { digest } from '../_shared/adminAccess.ts';
import { isAllowedSearchOrigin } from '../_shared/searchOrigin.ts';
import { MAPPING_BODY_BYTES, parseMappingSubmission } from '../_shared/mappingSubmission.ts';

const headers = { ...corsHeaders, 'Content-Type': 'application/json', 'Cache-Control': 'no-store' };
const reply = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers });

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers });
  if (req.method !== 'POST') return reply({ error: 'POST only' }, 405);
  if (!isAllowedSearchOrigin(req.headers.get('origin') ?? '')) return reply({ error: 'Origin not allowed' }, 403);
  const declaredLength = Number(req.headers.get('content-length'));
  if (declaredLength > MAPPING_BODY_BYTES) return reply({ error: 'Request too large' }, 413);
  try {
    // Bound the actual stream too; Content-Length alone is not trustworthy.
    const reader = req.body?.getReader();
    if (!reader) return reply({ error: 'Invalid correction' }, 400);
    const chunks: Uint8Array[] = [];
    let size = 0;
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > MAPPING_BODY_BYTES) { await reader.cancel(); return reply({ error: 'Request too large' }, 413); }
      chunks.push(value);
    }
    const bytes = new Uint8Array(size);
    let offset = 0;
    for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.length; }
    const parsed = parseMappingSubmission(JSON.parse(new TextDecoder().decode(bytes)));
    if (!parsed) return reply({ error: 'Accept the current agreement and submit a valid correction.' }, 400);
    const secret = Deno.env.get('ADMIN_SESSION_SECRET');
    if (!secret) return reply({ error: 'Correction submissions are temporarily unavailable.' }, 503);
    const ip = (req.headers.get('x-forwarded-for') ?? req.headers.get('cf-connecting-ip') ?? 'unknown').split(',')[0].trim();
    const hour = Math.floor(Date.now() / 3600000);
    const bucket = await digest(`mapping:${hour}:${ip}`, secret);
    const { data, error } = await adminClient().rpc('submit_mapping_correction', { p_bucket: bucket, p_field: parsed.fieldType, p_raw: parsed.rawValue, p_clean: parsed.suggestedClean, p_note: parsed.note });
    if (error) return reply({ error: 'Correction could not be saved. Please try again later.' }, 503);
    if (data === 'limited') return reply({ error: 'Too many corrections. Please try again in an hour.' }, 429);
    if (data !== 'created' && data !== 'duplicate') return reply({ error: 'Invalid correction' }, 400);
    return reply({ ok: true, deduped: data === 'duplicate' });
  } catch {
    return reply({ error: 'Correction could not be processed.' }, 400);
  }
});
