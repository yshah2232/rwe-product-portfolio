import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { z } from 'npm:zod@4.6.6';
import { convertToModelMessages, type UIMessage } from 'npm:ai@7';
import { createResponsesCall } from '../_shared/responses.ts';
import { withLovableAiGatewayRunIdHeader } from '../_shared/run-id.ts';
import { isAllowedSearchOrigin } from '../_shared/searchOrigin.ts';
import { adminClient } from '../_shared/adminServer.ts';
import { compactTrial, COMPARISON_INSTRUCTIONS, COMPARISON_TERMS_VERSION, validNcts, validGuideNcts, WEBSITE_GUIDE, visibleCensusRows } from '../_shared/comparisonAiContext.ts';
import { readBoundedBody, untrustedModelHistory } from '../_shared/aiSafety.ts';
import { consumeAiRequest } from '../_shared/aiAbuse.ts';

const headers = { ...corsHeaders, 'Content-Type': 'application/json', 'Cache-Control': 'no-store' };
const schema = z.object({
  ncts: z.array(z.string()).max(10),
  acceptance: z.object({ accepted: z.literal(true), termsVersion: z.literal(COMPARISON_TERMS_VERSION), audience: z.enum(['clinical', 'patient']) }),
  mode: z.enum(['summary', 'chat', 'guide']),
  visibleCensus: z.array(z.object({ state: z.string().max(80), year: z.number().int().min(2000).max(2100) })).max(30).default([]),
  messages: z.array(z.object({ id: z.string().max(100), role: z.enum(['user', 'assistant']), parts: z.array(z.object({ type: z.enum(['text', 'reasoning', 'step-start']), text: z.string().max(12000).optional() }).passthrough()).max(20) }).passthrough()).min(1).max(40),
}).passthrough().refine((value) => value.mode === 'guide' ? validGuideNcts(value.ncts) : validNcts(value.ncts));
const reply = (error: string, status: number) => new Response(JSON.stringify({ error }), { status, headers });

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: { ...corsHeaders, 'Access-Control-Allow-Headers': `${corsHeaders['Access-Control-Allow-Headers']}, x-lovable-aig-run-id` } });
  if (req.method !== 'POST') return reply('POST only', 405);
  if (!isAllowedSearchOrigin(req.headers.get('origin') ?? '')) return reply('Origin not allowed', 403);
  const body = await readBoundedBody(req, 100000);
  if (body === null) return reply('Conversation is too long. Start a new conversation.', 413);
  let input;
  try { input = schema.safeParse(JSON.parse(body)); } catch { return reply('Invalid request', 400); }
  if (!input.success) return reply('Select 2 to 4 distinct trials and accept the current agreement before using AI.', 400);
  const limit = await consumeAiRequest(req, 'comparison');
  if (limit !== 'allowed') return reply(limit === 'limited' ? 'AI request limit reached. Please try again later.' : 'AI is temporarily unavailable.', limit === 'limited' ? 429 : 503);
  const apiKey = Deno.env.get('LOVABLE_API_KEY');
  if (!apiKey) return reply('AI is not configured.', 401);
  try {
    const records = await Promise.all(input.data.ncts.map(async (nct) => {
      const r = await fetch(`https://clinicaltrials.gov/api/v2/studies/${nct}`, { signal: req.signal });
      if (!r.ok) throw new Error('Registry records could not be verified. Please try again later.');
      const study = await r.json();
      if (study.protocolSection?.identificationModule?.nctId !== nct) throw new Error('Registry record mismatch.');
      return compactTrial(study);
    }));
    const states = [...new Set(records.flatMap((r) => r.usStates))];
    // Use only verified public cache rows. No client supplied demographic values or new Census estimates.
    const { data: fips } = await adminClient().from('state_fips').select('state_name,state_fips').in('state_name', states);
    const stateIds = (fips ?? []).map((s) => s.state_fips);
    const { data: cache } = stateIds.length ? await adminClient().from('acs_cache').select('geo_id,acs_year,total_population,pop_hispanic,pop_black_nh,pop_asian_nh,pop_age_65plus,median_household_income,source_url,fetched_at').eq('geo_type', 'state').in('geo_id', stateIds).gt('expires_at', new Date().toISOString()) : { data: [] };
    const census = visibleCensusRows((cache ?? []).map((c) => {
      let source: string | null = null;
      try { const url = new URL(c.source_url); url.searchParams.delete('key'); if (url.hostname === 'api.census.gov') source = url.toString(); } catch { /* missing source */ }
      return { ...c, state: fips?.find((s) => s.state_fips === c.geo_id)?.state_name, source_url: source };
    }).filter((c) => c.source_url), input.data.visibleCensus);
    const messages = input.data.messages.map((message) => ({ ...message, parts: message.parts.filter((part) => part.type === 'text') })) as UIMessage[];
    const guideInstructions = input.data.mode === 'guide' ? '\nThis is the website guide, not necessarily a comparison page. Use only supplied website facts and the verified current search result records. With no records, answer website questions only and direct trial questions to Search Registry; do not invent trials. Cite website facts with supplied app page links. Do not execute a search yourself or imply that a search has run. Do not use other website pages or general medical knowledge as evidence.' : '';
    const call = createResponsesCall(req, { baseURL: 'https://ai.gateway.lovable.dev/v1', apiKey, model: 'openai/gpt-6-astra' }, await convertToModelMessages(untrustedModelHistory(input.data.messages)), `${COMPARISON_INSTRUCTIONS}${guideInstructions}\nMode: ${input.data.mode}\n<untrusted_registry_context>${JSON.stringify({ records, census, ...(input.data.mode === 'guide' ? { website: WEBSITE_GUIDE } : {}), missingCensusStates: states.filter((s) => !census.some((c) => c.state === s)) })}</untrusted_registry_context>`);
    const response = call.result.toUIMessageStreamResponse({ originalMessages: messages, sendReasoning: false, onFinish: () => { /* No persistence. */ }, onError: () => 'AI request failed. Please try again later.' });
    return await withLovableAiGatewayRunIdHeader(response, call.gateway, { ...corsHeaders, 'Cache-Control': 'no-store' });
  } catch (error) {
    if (req.signal.aborted) return reply('Request stopped.', 499);
    return reply('AI source verification or processing failed. Please try again later.', 502);
  }
});