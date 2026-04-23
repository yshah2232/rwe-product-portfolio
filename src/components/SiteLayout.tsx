import { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import SiteNav from '@/components/SiteNav';
import SiteFooter from '@/components/SiteFooter';
import AgentChatbot from '@/components/AgentChatbot';
import StickyCTA from '@/components/StickyCTA';
import { track } from '@/lib/track';

const SiteLayout = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    track('page_view', { path: pathname });
  }, [pathname]);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <SiteNav />
      <main className="flex-1">
        <Outlet />
      </main>
      <SiteFooter />
      <AgentChatbot />
      <StickyCTA />
    </div>
  );
};

export default SiteLayout;
