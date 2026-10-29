import { adminClient } from './adminServer.ts';
import { digest } from './adminAccess.ts';

export async function consumeAiRequest(req: Request, purpose: 'review' | 'comparison'): Promise<'allowed' | 'limited' | 'unavailable'> {
  const secret = Deno.env.get('ADMIN_SESSION_SECRET');
  if (!secret) return 'unavailable';
  const ip = (req.headers.get('x-forwarded-for') ?? req.headers.get('cf-connecting-ip') ?? 'unknown').split(',')[0].trim();
  const day = Math.floor(Date.now() / 86400000);
  const bucket = await digest(`ai-abuse:${purpose}:${day}:${ip}`, secret);
  const { data, error } = await adminClient().rpc('consume_public_ai_attempt', { p_key: bucket, p_purpose: purpose });
  return error ? 'unavailable' : data ? 'allowed' : 'limited';
}