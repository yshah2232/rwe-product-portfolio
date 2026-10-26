import { NavLink, Navigate, Outlet, useLocation } from 'react-router-dom';
import { LogOut, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAdminAccess } from '@/contexts/AdminAccessContext';

export default function AdminLayout() {
  const { session, signOut } = useAdminAccess();
  const location = useLocation();
  if (!session) return <Navigate to="/admin/login" replace state={{ from: location.pathname }} />;
  return <div className="min-h-screen bg-background">
    <header className="border-b border-border bg-accent">
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3"><ShieldCheck className="h-6 w-6 text-primary" /><div><h1 className="text-xl">Admin workspace</h1><p className="text-sm text-muted-foreground">{session.username}</p></div></div>
        <Button variant="outline" onClick={() => void signOut().catch(() => {})}><LogOut />Sign out</Button>
      </div>
    </header>
    <nav aria-label="Admin navigation" className="max-w-7xl mx-auto px-4 md:px-6 flex flex-wrap gap-5 border-b border-border">
      {[['/admin', 'Overview'], ['/analytics/search-eval', 'Search evaluation'], ['/analytics/heatmap', 'Interaction analytics']].map(([url, label]) => <NavLink end key={url} to={url} className={({ isActive }) => `py-3 text-sm font-semibold border-b-2 ${isActive ? 'border-primary text-primary' : 'border-transparent text-muted-foreground'}`}>{label}</NavLink>)}
    </nav>
    <main><Outlet /></main>
  </div>;
}