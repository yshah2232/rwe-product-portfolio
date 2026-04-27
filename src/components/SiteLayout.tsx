import { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import SiteNav from '@/components/SiteNav';
import SiteFooter from '@/components/SiteFooter';
import AgentChatbot from '@/components/AgentChatbot';
import StickyCTA from '@/components/StickyCTA';
import ErrorBoundary from '@/components/ErrorBoundary';
import { track } from '@/lib/track';
import { usePlainMode } from '@/contexts/PlainModeContext';

const SiteLayout = () => {
  const { pathname } = useLocation();
  const { plainMode } = usePlainMode();

  useEffect(() => {
    track('page_view', { path: pathname });
  }, [pathname]);

  // Reset boundary whenever the route OR plain-language mode changes,
  // so a transient toggle-time render glitch self-recovers on the next paint.
  const resetKey = `${pathname}::${plainMode ? 'plain' : 'standard'}`;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <SiteNav />
      <main className="flex-1">
        <ErrorBoundary resetKey={resetKey}>
          <Outlet />
        </ErrorBoundary>
      </main>
      <SiteFooter />
      <AgentChatbot />
      <StickyCTA />
    </div>
  );
};

export default SiteLayout;
