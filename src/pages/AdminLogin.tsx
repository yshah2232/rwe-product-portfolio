import { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAdminAccess } from '@/contexts/AdminAccessContext';
import { useSeo } from '@/hooks/useSeo';

export default function AdminLogin() {
  useSeo({ title: 'Admin sign in | Clinical Trial Diversity Studio', canonical: '/admin/login', noindex: true });
  const { session, signIn } = useAdminAccess();
  const navigate = useNavigate();
  const location = useLocation();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  if (session) return <Navigate to="/admin" replace />;
  const input = 'w-full border border-input rounded-sm bg-background px-3 py-2 text-foreground';
  return <main className="min-h-screen bg-accent px-4 py-16">
    <div className="max-w-sm mx-auto">
      <ShieldCheck className="h-8 w-8 text-primary mb-4" />
      <h1 className="text-2xl mb-2">Admin sign in</h1>
      <p className="text-sm text-muted-foreground mb-6">Clinical Trial Diversity Studio</p>
      <form className="ctg-panel p-5 space-y-4" onSubmit={async (event) => {
        event.preventDefault(); setBusy(true); setError('');
        try {
          await signIn(username, password);
          setPassword('');
          const from = location.state?.from;
          navigate(['/analytics/search-eval', '/analytics/heatmap', '/admin'].includes(from) ? from : '/admin', { replace: true });
        } catch (err) { setError(err instanceof Error ? err.message : 'Sign in unavailable.'); setPassword(''); }
        finally { setBusy(false); }
      }}>
        <div><label htmlFor="admin-username" className="block text-sm font-semibold mb-1">Username</label><input id="admin-username" autoComplete="username" required maxLength={64} className={input} value={username} onChange={(e) => setUsername(e.target.value)} /></div>
        <div><label htmlFor="admin-password" className="block text-sm font-semibold mb-1">Password</label><input id="admin-password" type="password" autoComplete="current-password" required maxLength={1024} className={input} value={password} onChange={(e) => setPassword(e.target.value)} /></div>
        {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
        <Button type="submit" disabled={busy} className="w-full">{busy ? 'Signing in…' : 'Sign in'}</Button>
      </form>
      <Link to="/" className="inline-block mt-5 text-sm text-primary underline">Return to public search</Link>
    </div>
  </main>;
}