/** Validate host boundaries, never substring matches against a whole URL. */
export function isAllowedSearchOrigin(origin: string): boolean {
  try {
    const url = new URL(origin);
    if (url.username || url.password || url.pathname !== '/' || url.search || url.hash) return false;
    if (url.hostname === 'localhost' || url.hostname === '127.0.0.1') return url.protocol === 'http:' || url.protocol === 'https:';
    if (url.protocol !== 'https:') return false;
    return ['lovable.app', 'lovable.dev', 'lovableproject.com'].some((domain) => url.hostname === domain || url.hostname.endsWith(`.${domain}`))
      || url.hostname === 'portfolio.ysclin.xyz';
  } catch {
    return false;
  }
}