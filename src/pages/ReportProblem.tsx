import { useEffect, useState } from 'react';
import { Flag, Send, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useSeo } from '@/hooks/useSeo';

type ReportStats = { total: number; resolved: number; in_review: number; new: number; dismissed: number };

const CATEGORIES = [
  { value: 'bug', label: 'Something is broken' },
  { value: 'wrong_information', label: 'Information looks wrong' },
  { value: 'feature_request', label: 'Suggest an improvement' },
  { value: 'other', label: 'Something else' },
] as const;

const base = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1`;
const publicKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

export default function ReportProblem() {
  useSeo({
    title: 'Report a problem | Clinical Trial Diversity Studio',
    description: 'Tell us about a bug, wrong information, or an improvement idea for Clinical Trial Diversity Studio.',
    canonical: '/report',
  });
  const [category, setCategory] = useState<string>('bug');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<ReportStats | null>(null);

  const loadStats = async () => {
    try {
      const response = await fetch(`${base}/issue-stats`, { cache: 'no-store', headers: { apikey: publicKey, Authorization: `Bearer ${publicKey}` } });
      const data = await response.json();
      if (response.ok && typeof data.total === 'number') setStats(data as ReportStats);
    } catch {
      // Stats are optional context; the form still works without them.
    }
  };

  useEffect(() => { void loadStats(); }, []);

  const submit = async () => {
    setError(null);
    if (message.trim().length < 10) {
      setError('Please describe the issue in at least 10 characters.');
      return;
    }
    setBusy(true);
    try {
      const response = await fetch(`${base}/issue-report`, {
        method: 'POST',
        cache: 'no-store',
        headers: { apikey: publicKey, Authorization: `Bearer ${publicKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ category, message: message.trim(), pageUrl: window.location.href }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || 'Could not send the report.');
      setDone(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not send the report.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 md:px-6 py-10">
      <div className="flex items-center gap-3 mb-2">
        <Flag className="h-6 w-6 text-primary" />
        <h1 className="text-2xl font-bold tracking-tight">Report a problem</h1>
      </div>
      <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
        Spotted a bug, information that looks wrong, or have an idea to improve the site?
        Tell us below. We only store what you type here — no account, no email, no tracking.
      </p>

      {done ? (
        <div className="ctg-panel p-6 flex items-start gap-3">
          <CheckCircle2 className="h-5 w-5 text-primary shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold">Thanks — your report was sent.</p>
            <p className="text-sm text-muted-foreground mt-1">The site owner reviews reports in the admin workspace.</p>
          </div>
        </div>
      ) : (
        <div className="ctg-panel p-6 space-y-5">
          <div>
            <label className="text-sm font-semibold block mb-2" htmlFor="report-category">What kind of issue is it?</label>
            <select
              id="report-category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full rounded-sm border border-border bg-background px-3 py-2 text-sm"
            >
              {CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-sm font-semibold block mb-2" htmlFor="report-message">Describe the issue</label>
            <textarea
              id="report-message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={6}
              maxLength={2000}
              placeholder="What happened? What did you expect instead? If it concerns a specific trial, include its NCT number."
              className="w-full rounded-sm border border-border bg-background px-3 py-2 text-sm leading-relaxed"
            />
            <p className="text-xs text-muted-foreground mt-1">{message.length}/2000</p>
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button onClick={submit} disabled={busy} className="gap-2">
            <Send className="h-4 w-4" /> {busy ? 'Sending…' : 'Send report'}
          </Button>
        </div>
      )}
    </div>
  );
}
