import { Outlet } from 'react-router-dom';
import SiteNav from '@/components/SiteNav';
import SiteFooter from '@/components/SiteFooter';
import AgentChatbot from '@/components/AgentChatbot';

const SiteLayout = () => (
  <div className="min-h-screen flex flex-col bg-background">
    <SiteNav />
    <main className="flex-1">
      <Outlet />
    </main>
    <SiteFooter />
    <AgentChatbot />
  </div>
);

export default SiteLayout;
