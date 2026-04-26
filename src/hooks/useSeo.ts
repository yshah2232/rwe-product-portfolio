import { useEffect } from 'react';

interface SeoOptions {
  title: string;
  description?: string;
  canonical?: string; // pathname or full URL
  ogImage?: string;
  jsonLd?: Record<string, unknown> | Record<string, unknown>[];
  noindex?: boolean;
}

const SITE_ORIGIN = 'https://rwe-ctg-new.lovable.app'; // canonical published origin

const ensureMeta = (selector: string, attr: 'name' | 'property', key: string) => {
  let el = document.head.querySelector<HTMLMetaElement>(selector);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  return el;
};

const ensureLink = (rel: string) => {
  let el = document.head.querySelector<HTMLLinkElement>(`link[rel="${rel}"]`);
  if (!el) {
    el = document.createElement('link');
    el.setAttribute('rel', rel);
    document.head.appendChild(el);
  }
  return el;
};

/**
 * useSeo — sets <title>, meta description, canonical URL, Open Graph,
 * Twitter card, and (optionally) JSON-LD structured data for the current page.
 * Restores prior values on unmount so SPA navigation stays clean.
 */
export const useSeo = ({
  title,
  description,
  canonical,
  ogImage,
  jsonLd,
  noindex = false,
}: SeoOptions) => {
  useEffect(() => {
    const prevTitle = document.title;
    document.title = title;

    const descMeta = ensureMeta('meta[name="description"]', 'name', 'description');
    const prevDesc = descMeta.getAttribute('content') ?? '';
    if (description) descMeta.setAttribute('content', description);

    const canonicalUrl = canonical
      ? canonical.startsWith('http')
        ? canonical
        : `${SITE_ORIGIN}${canonical.startsWith('/') ? '' : '/'}${canonical}`
      : `${SITE_ORIGIN}${window.location.pathname}`;

    const linkCanonical = ensureLink('canonical');
    const prevCanonical = linkCanonical.getAttribute('href') ?? '';
    linkCanonical.setAttribute('href', canonicalUrl);

    const ogTitle = ensureMeta('meta[property="og:title"]', 'property', 'og:title');
    const prevOgTitle = ogTitle.getAttribute('content') ?? '';
    ogTitle.setAttribute('content', title);

    const ogDesc = ensureMeta('meta[property="og:description"]', 'property', 'og:description');
    const prevOgDesc = ogDesc.getAttribute('content') ?? '';
    if (description) ogDesc.setAttribute('content', description);

    const ogUrl = ensureMeta('meta[property="og:url"]', 'property', 'og:url');
    const prevOgUrl = ogUrl.getAttribute('content') ?? '';
    ogUrl.setAttribute('content', canonicalUrl);

    const ogType = ensureMeta('meta[property="og:type"]', 'property', 'og:type');
    if (!ogType.getAttribute('content')) ogType.setAttribute('content', 'website');

    let prevOgImg = '';
    if (ogImage) {
      const ogImg = ensureMeta('meta[property="og:image"]', 'property', 'og:image');
      prevOgImg = ogImg.getAttribute('content') ?? '';
      ogImg.setAttribute('content', ogImage);
    }

    const twTitle = ensureMeta('meta[name="twitter:title"]', 'name', 'twitter:title');
    const prevTwTitle = twTitle.getAttribute('content') ?? '';
    twTitle.setAttribute('content', title);

    const twDesc = ensureMeta('meta[name="twitter:description"]', 'name', 'twitter:description');
    const prevTwDesc = twDesc.getAttribute('content') ?? '';
    if (description) twDesc.setAttribute('content', description);

    // Robots noindex toggle (used for ephemeral pages)
    let robotsEl: HTMLMetaElement | null = null;
    let prevRobots: string | null = null;
    if (noindex) {
      robotsEl = ensureMeta('meta[name="robots"]', 'name', 'robots');
      prevRobots = robotsEl.getAttribute('content');
      robotsEl.setAttribute('content', 'noindex,nofollow');
    }

    // JSON-LD
    const jsonLdScript = jsonLd ? document.createElement('script') : null;
    if (jsonLd && jsonLdScript) {
      jsonLdScript.type = 'application/ld+json';
      jsonLdScript.dataset.seo = 'page';
      jsonLdScript.textContent = JSON.stringify(jsonLd);
      document.head.appendChild(jsonLdScript);
    }

    return () => {
      document.title = prevTitle;
      if (description && prevDesc) descMeta.setAttribute('content', prevDesc);
      if (prevCanonical) linkCanonical.setAttribute('href', prevCanonical);
      if (prevOgTitle) ogTitle.setAttribute('content', prevOgTitle);
      if (description && prevOgDesc) ogDesc.setAttribute('content', prevOgDesc);
      if (prevOgUrl) ogUrl.setAttribute('content', prevOgUrl);
      if (ogImage && prevOgImg) {
        const ogImg = document.head.querySelector<HTMLMetaElement>('meta[property="og:image"]');
        ogImg?.setAttribute('content', prevOgImg);
      }
      if (prevTwTitle) twTitle.setAttribute('content', prevTwTitle);
      if (description && prevTwDesc) twDesc.setAttribute('content', prevTwDesc);
      if (robotsEl) {
        if (prevRobots) robotsEl.setAttribute('content', prevRobots);
        else robotsEl.remove();
      }
      jsonLdScript?.remove();
    };
  }, [title, description, canonical, ogImage, JSON.stringify(jsonLd ?? null), noindex]);
};

// Backwards-compatible shim: existing pages call usePageTitle(title)
export const usePageTitle = (title: string) => {
  useSeo({ title });
};
