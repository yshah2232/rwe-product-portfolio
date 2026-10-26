export const ADMIN_SESSION_SECONDS = 30 * 60;

export async function digest(value: string, secret: string): Promise<string> {
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const bytes = new Uint8Array(await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(value)));
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
}

export async function credentialsMatch(username: string, password: string, expectedUsername: string, expectedPassword: string, secret: string) {
  if (!expectedUsername || !expectedPassword || !secret) return false;
  const a = await digest(JSON.stringify([username, password]), secret);
  const b = await digest(JSON.stringify([expectedUsername, expectedPassword]), secret);
  let difference = 0;
  for (let i = 0; i < a.length; i++) difference |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return difference === 0;
}

export function sessionIsCurrent(expiresAt: string, version: string, expectedVersion: string, now = Date.now()) {
  return Date.parse(expiresAt) > now && version === expectedVersion;
}