import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { z } from 'npm:zod@3';
import { ADMIN_SESSION_SECONDS, credentialsMatch, digest } from '../_shared/adminAccess.ts';
import { adminClient, credentialVersion, verifiedAdmin } from '../_shared/adminServer.ts';

const headers = { ...corsHeaders, 'Access-Control-Allow-Headers': `${corsHeaders['Access-Control-Allow-Headers']}, x-admin-session`, 'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS', 'Content-Type': 'application/json', 'Cache-Control': 'no-store' };
const respond = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers });
const Login = z.object({ username: z.string().trim().min(1).max(64), password: z.string().min(1).max(1024) });

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers });
  try {
    if (req.method === 'GET' || req.method === 'DELETE') {
      const session = await verifiedAdmin(req);
      if (!session) return respond({ error: 'Sign in required.' }, 401);
      if (req.method === 'DELETE') {
        const { error } = await session.client.from('admin_access_sessions').delete().eq('token_hash', session.hash);
        return error ? respond({ error: 'Sign out failed.' }, 500) : respond({ ok: true });
      }
      return respond({ username: Deno.env.get('ANALYTICS_ADMIN_USERNAME'), expiresAt: session.expiresAt });
    }
    if (req.method !== 'POST') return respond({ error: 'Method not allowed.' }, 405);
    const body = Login.safeParse(await req.json().catch(() => null));
    if (!body.success) return respond({ error: 'Enter your username and password.' }, 400);
    const secret = Deno.env.get('ADMIN_SESSION_SECRET');
    const username = Deno.env.get('ANALYTICS_ADMIN_USERNAME');
    const password = Deno.env.get('ANALYTICS_ADMIN_PASSWORD');
    if (!secret || !username || !password) return respond({ error: 'Admin access unavailable.' }, 503);
    const client = adminClient();
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
    const [ipLimit, globalLimit] = await Promise.all([
      client.rpc('consume_admin_login_attempt', { p_key: await digest(`ip:${ip}`, secret), p_limit: 10 }),
      client.rpc('consume_admin_login_attempt', { p_key: 'global', p_limit: 100 }),
    ]);
    if (ipLimit.error || globalLimit.error) return respond({ error: 'Admin access unavailable.' }, 503);
    if (!ipLimit.data || !globalLimit.data) return respond({ error: 'Too many sign in attempts. Try again in 15 minutes.' }, 429);
    if (!await credentialsMatch(body.data.username, body.data.password, username, password, secret)) return respond({ error: 'Incorrect username or password.' }, 401);
    const token = Array.from(crypto.getRandomValues(new Uint8Array(32)), (b) => b.toString(16).padStart(2, '0')).join('');
    const expiresAt = new Date(Date.now() + ADMIN_SESSION_SECONDS * 1000).toISOString();
    const { error } = await client.from('admin_access_sessions').insert({ token_hash: await digest(token, secret), credential_version: await credentialVersion(), expires_at: expiresAt });
    if (error) return respond({ error: 'Sign in unavailable.' }, 503);
    return respond({ token, username, expiresAt });
  } catch {
    return respond({ error: 'Admin access unavailable.' }, 503);
  }
});