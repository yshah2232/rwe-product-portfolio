import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ArrowRight, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { track } from '@/lib/track';

/**
 * Bottom sticky CTA bar.
 * - Appears after the user scrolls past the hero (~600px).
 * - Only on the homepage.
 * - Dismissible per session.
 */
const StickyCTA = () => {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [visible, setVisible] = useState(false);
  const [dismissed, setDismissed] = useState(() => {
    if (typeof window === 'undefined') return false;
    return sessionStorage.getItem('stickyCTA:dismissed') === '1';
  });

  useEffect(() => {
    if (pathname !== '/') {
      setVisible(false);
      return;
    }
    const onScroll = () => {
      setVisible(window.scrollY > 300);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [pathname]);

  if (pathname !== '/' || dismissed || !visible) return null;

  return (
    <div
      role="region"
      aria-label="Explore dashboard call to action"
      className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40 w-[calc(100%-1.5rem)] sm:w-auto max-w-2xl animate-in fade-in slide-in-from-bottom-4 duration-500"
    >
      <div className="flex items-center gap-3 sm:gap-4 px-4 sm:px-5 py-3 rounded-2xl border border-border/60 bg-background/95 backdrop-blur-md shadow-2xl">
        <div className="flex-1 min-w-0">
          <p className="text-xs sm:text-sm font-semibold text-foreground truncate">
            Search 500K+ trials by meaning
          </p>
          <p className="text-[10px] sm:text-xs text-muted-foreground truncate">
            Live CTG.gov v2 · semantic re-rank · adaptive
          </p>
        </div>
        <Button
          size="sm"
          onClick={() => {
            track('cta_click', { location: 'sticky_bar', target: '/search-registry' });
            navigate('/search-registry');
          }}
          className="gap-1.5 text-xs font-bold shrink-0"
        >
          Search Registry <ArrowRight className="h-3.5 w-3.5" />
        </Button>
        <button
          type="button"
          aria-label="Dismiss"
          onClick={() => {
            sessionStorage.setItem('stickyCTA:dismissed', '1');
            setDismissed(true);
            track('cta_dismiss', { location: 'sticky_bar' });
          }}
          className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors shrink-0"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};

export default StickyCTA;
