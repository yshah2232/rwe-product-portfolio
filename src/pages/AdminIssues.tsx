import { useCallback, useEffect, useState } from 'react';
import { Flag, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAdminAccess } from '@/contexts/AdminAccessContext';
import { useSeo } from '@/hooks/useSeo';

type Report = {
  id: string;
  category: string;
  message: string;
  page_url: string | null;
  status: 'new' | 'in_review' | 'resolved' | 'dismissed';
  created_at: string;
};

const STATUSES: Report['status'][] = ['new', 'in_review', 'resolved', 'dismissed'];
const CATEGORY_LABELS: Record<string, string> = {
  bug: 'Broken',
  wrong_information: 'Wrong info',
  feature_request: 'Suggestion',
  other: 'Other',
};

export default function AdminIssues() {
  useSeo({ title: 'Issue reports | Admin', canonical: '/admin/issues', noindex: true });
  const { request } = useAdminAccess();
  const [rows, setRows] = useState<Report[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await request('admin-issues');
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || 'Could not load reports.');
      setRows(data.rows ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not load reports.');
    } finally {
      setLoading(false);
    }
  }, [request]);

  useEffect(() => { void load(); }, [load]);

  const setStatus = async (id: string, status: Report['status']) => {
    const response = await request('admin-issues', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, status }),
    });
    if (response.ok) setRows((prev) => prev.map((r) => (r.id === id ? { ...r, status } : r)));
  };

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-6 py-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Flag className="h-6 w-6 text-primary" />
          <h1 className="text-xl font-bold tracking-tight">Issue reports</h1>
        </div>
        <Button variant="outline" size="sm" onClick={() => void load()} disabled={loading} className="gap-2">
          <RefreshCw className="h-4 w-4" /> Refresh
        </Button>
      </div>

      {error && <p className="text-sm text-destructive mb-4">{error}</p>}
      {!error && !loading && rows.length === 0 && (
        <p className="text-sm text-muted-foreground">No reports yet. Visitors can submit them from the “Report a problem” link in the footer.</p>
      )}

      <div className="space-y-3">
        {rows.map((r) => (
          <article key={r.id} className="ctg-panel p-4">
            <div className="flex flex-wrap items-center gap-2 mb-2 text-xs">
              <span className="font-semibold px-2 py-0.5 rounded-sm bg-accent text-primary">{CATEGORY_LABELS[r.category] ?? r.category}</span>
              <span className="text-muted-foreground">{new Date(r.created_at).toLocaleString()}</span>
              {r.page_url && (
                <a href={r.page_url} target="_blank" rel="noopener noreferrer" className="text-primary underline underline-offset-2 truncate max-w-xs">
                  {r.page_url}
                </a>
              )}
            </div>
            <p className="text-sm leading-relaxed whitespace-pre-wrap mb-3">{r.message}</p>
            <div className="flex items-center gap-2 text-xs">
              <span className="text-muted-foreground">Status:</span>
              <select
                value={r.status}
                onChange={(e) => void setStatus(r.id, e.target.value as Report['status'])}
                className="rounded-sm border border-border bg-background px-2 py-1 text-xs"
                aria-label="Report status"
              >
                {STATUSES.map((s) => (
                  <option key={s} value={s}>{s.replace('_', ' ')}</option>
                ))}
              </select>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
