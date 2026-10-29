/** Retired saved cohort services never parse, fetch or mutate visitor data. */
export function retiredCohortService(req: Request): Response {
  const headers = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type', 'Content-Type': 'application/json', 'Cache-Control': 'no-store' };
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers });
  return new Response(JSON.stringify({ error: 'service_retired', message: 'Saved cohort processing is no longer available. Use trial comparison instead.' }), { status: 410, headers });
}