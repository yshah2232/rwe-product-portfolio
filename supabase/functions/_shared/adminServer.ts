import { createClient } from 'npm:@supabase/supabase-js@2';
import { digest, sessionIsCurrent } from './adminAccess.ts';

export function adminClient() {
  const url = Deno.env.get('SUPABASE_URL');
  const key = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!url || !key) throw new Error('Admin access unavailable');
  return createClient(url, key);
}

export async function credentialVersion() {
  const secret = Deno.env.get('ADMIN_SESSION_SECRET');
  const username = Deno.env.get('ANALYTICS_ADMIN_USERNAME');
  const password = Deno.env.get('ANALYTICS_ADMIN_PASSWORD');
  if (!secret || !username || !password) throw new Error('Admin access unavailable');
  return digest(JSON.stringify([username, password]), secret);
}

export async function verifiedAdmin(req: Request) {
  const token = req.headers.get('x-admin-session');
  const secret = Deno.env.get('ADMIN_SESSION_SECRET');
  if (!token || !/^[a-f0-9]{64}$/.test(token) || !secret) return null;
  const client = adminClient();
  const hash = await digest(token, secret);
  const { data, error } = await client.from('admin_access_sessions').select('expires_at, credential_version').eq('token_hash', hash).maybeSingle();
  if (error || !data || !sessionIsCurrent(data.expires_at, data.credential_version, await credentialVersion())) return null;
  return { client, hash, expiresAt: data.expires_at };
}