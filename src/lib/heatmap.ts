/**
 * Lightweight click + scroll-depth tracker.
 * - Captures every click with normalized (0-1) coordinates and a CSS selector.
 * - Captures max scroll depth per page in 25% buckets.
 * - Flags rage-clicks (3+ clicks within 1s in a 40px radius).
 * - Batches inserts (every 5s or on pagehide) to keep payloads small.
 *
 * Only enabled on a whitelist of paths so we don't pollute the table.
 */
import { supabase } from '@/integrations/supabase/client';
import { getSessionId } from './searchSession';

type Interaction = {
  session_id: string;
  path: string;
  event_type: 'click' | 'rage_click' | 'scroll_depth';
  x_norm?: number;
  y_norm?: number;
  viewport_w?: number;
  viewport_h?: number;
  scroll_depth_pct?: number;
  selector?: string;
  element_text?: string;
  element_id?: string;
};

const TRACKED_PATHS = ['/', '/search-registry'];

let queue: Interaction[] = [];
let flushTimer: number | null = null;
let currentPath = '';
let maxScrollBucket = 0;
let recentClicks: { x: number; y: number; t: number }[] = [];
let installed = false;

function shouldTrack(pathname: string) {
  return TRACKED_PATHS.includes(pathname);
}

function buildSelector(el: Element | null): string {
  if (!el || !(el instanceof Element)) return '';
  const parts: string[] = [];
  let node: Element | null = el;
  let depth = 0;
  while (node && depth < 4 && node.tagName.toLowerCase() !== 'body') {
    let part = node.tagName.toLowerCase();
    if (node.id) {
      part += `#${node.id}`;
      parts.unshift(part);
      break;
    }
    const cls = (node.getAttribute('class') || '')
      .split(/\s+/)
      .filter((c) => c && !c.startsWith('hover:') && !c.startsWith('focus:') && c.length < 24)
      .slice(0, 2)
      .join('.');
    if (cls) part += `.${cls}`;
    parts.unshift(part);
    node = node.parentElement;
    depth += 1;
  }
  return parts.join(' > ').slice(0, 240);
}

function flush() {
  if (queue.length === 0) return;
  const batch = queue;
  queue = [];
  // Fire-and-forget insert. Errors are swallowed — analytics must not break UX.
  supabase.from('ui_interactions').insert(batch).then(({ error }) => {
    if (error) console.warn('[heatmap] insert failed', error.message);
  });
}

function scheduleFlush() {
  if (flushTimer != null) return;
  flushTimer = window.setTimeout(() => {
    flushTimer = null;
    flush();
  }, 5000);
}

function enqueue(ev: Interaction) {
  queue.push(ev);
  if (queue.length >= 20) flush();
  else scheduleFlush();
}

function onClick(e: MouseEvent) {
  if (!shouldTrack(currentPath)) return;
  const target = e.target as Element | null;
  if (!target) return;

  const vw = window.innerWidth || 1;
  const vh = window.innerHeight || 1;
  const x = Math.max(0, Math.min(1, e.clientX / vw));
  const y = Math.max(0, Math.min(1, e.clientY / vh));

  // Rage-click detection
  const now = performance.now();
  recentClicks = recentClicks.filter((c) => now - c.t < 1000);
  recentClicks.push({ x: e.clientX, y: e.clientY, t: now });
  const cluster = recentClicks.filter(
    (c) => Math.hypot(c.x - e.clientX, c.y - e.clientY) < 40
  );
  const isRage = cluster.length >= 3;

  const interactive = target.closest('a, button, [role="button"], input, label') as Element | null;
  const subject = interactive || target;
  const text = (subject.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 120);
  const id = (subject as HTMLElement).id || undefined;

  enqueue({
    session_id: getSessionId(),
    path: currentPath,
    event_type: isRage ? 'rage_click' : 'click',
    x_norm: Number(x.toFixed(4)),
    y_norm: Number(y.toFixed(4)),
    viewport_w: vw,
    viewport_h: vh,
    selector: buildSelector(subject),
    element_text: text || undefined,
    element_id: id,
  });
}

function onScroll() {
  if (!shouldTrack(currentPath)) return;
  const scrolled = window.scrollY + window.innerHeight;
  const total = Math.max(document.documentElement.scrollHeight, 1);
  const pct = Math.min(100, Math.round((scrolled / total) * 100));
  const bucket = Math.floor(pct / 25) * 25; // 0, 25, 50, 75, 100
  if (bucket > maxScrollBucket) {
    maxScrollBucket = bucket;
    enqueue({
      session_id: getSessionId(),
      path: currentPath,
      event_type: 'scroll_depth',
      scroll_depth_pct: bucket,
      viewport_w: window.innerWidth,
      viewport_h: window.innerHeight,
    });
  }
}

function onHide() {
  flush();
}

export function installHeatmap() {
  if (installed || typeof window === 'undefined') return;
  installed = true;
  document.addEventListener('click', onClick, { capture: true, passive: true });
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('pagehide', onHide);
  window.addEventListener('beforeunload', onHide);
}

export function setHeatmapPath(pathname: string) {
  if (pathname === currentPath) return;
  // Flush any pending events from the previous page before switching context.
  flush();
  currentPath = pathname;
  maxScrollBucket = 0;
  recentClicks = [];
}
