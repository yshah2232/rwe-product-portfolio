// /cohorts — list of saved cohorts owned by the current browser session.

import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Layers, Plus, Loader2, Trash2, RefreshCw, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { getSessionId } from '@/lib/searchSession';
import { useSeo } from '@/hooks/useSeo';
import { toast } from 'sonner';

interface CohortRow {
  id: string;
  name: string;
  notes: string | null;
  query_text: string | null;
  trial_count: number;
  refreshed_at: string | null;
  created_at: string;
  filter_phase: string | null;
  filter_status: string | null;
  filter_country_us: boolean | null;
}

const Cohorts = () => {
  useSeo({
    title: 'Saved Cohorts — Clinical Trial Diversity Studio',
    description: 'Reusable trial cohorts grouped by therapeutic area or program, with canonicalized sponsors and indications for apples-to-apples comparison.',
    canonical: '/cohorts',
  });
  const [cohorts, setCohorts] = useState<CohortRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void load();
  }, []);

  const load = async () => {
    setLoading(true);
    const sessionId = getSessionId();
    const { data, error } = await supabase
      .from('saved_cohorts')
      .select('id, name, notes, query_text, trial_count, refreshed_at, created_at, filter_phase, filter_status, filter_country_us')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: false });
    if (error) {
      toast.error('Failed to load cohorts');
    } else {
      setCohorts(data ?? []);
    }
    setLoading(false);
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete cohort "${name}"? This cannot be undone.`)) return;
    try {
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ctg-cohort-delete`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({ cohortId: id, sessionId: getSessionId() }),
        },
      );
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error ?? 'Failed to delete');
      toast.success('Cohort deleted');
      setCohorts((prev) => prev.filter((c) => c.id !== id));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to delete');
    }
  };

  return (
    <div className="bg-background min-h-screen">
      <section className="ctg-hero">
        <div className="ctg-hero-inner">
          <p className="text-[12px] font-semibold uppercase tracking-wider mb-2" style={{ color: 'hsl(var(--link))' }}>
            Home &nbsp;›&nbsp; Cohorts
          </p>
          <h1 className="ctg-hero-title">Saved cohorts</h1>
          <p className="mt-4 text-[16px] text-foreground/80 leading-[1.6] max-w-3xl">
            A cohort is a reusable group of trials saved from a Search Registry query. Each cohort
            keeps the originating query and re-pulls the underlying records from CTG.gov on demand.
          </p>
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <Button asChild className="gap-2 rounded-sm">
              <Link to="/search-registry">
                <Plus className="h-4 w-4" /> Build a new cohort
              </Link>
            </Button>
            <p className="text-[13px] text-muted-foreground">
              Cohorts are scoped to this browser session. Bookmark each cohort link to return.
            </p>
          </div>
        </div>
      </section>

      <section className="px-6 md:px-10 lg:px-16 py-10">
        <div className="max-w-5xl mx-auto">
          {loading && (
            <div className="flex items-center justify-center py-20 text-muted-foreground">
              <Loader2 className="h-6 w-6 animate-spin mr-2" /> Loading cohorts…
            </div>
          )}

          {!loading && cohorts.length === 0 && (
            <div className="text-center py-20 border border-dashed border-border/60 rounded-2xl">
              <Layers className="h-8 w-8 text-muted-foreground/60 mx-auto mb-4" />
              <p className="font-display text-xl text-foreground">No cohorts yet</p>
              <p className="text-sm text-muted-foreground mt-2 max-w-sm mx-auto">
                Run a search, select trials, and save them as a cohort to compare and revisit later.
              </p>
              <Button asChild className="mt-6 gap-2">
                <Link to="/search-registry">
                  <Plus className="h-4 w-4" /> Open Search Registry
                </Link>
              </Button>
            </div>
          )}

          {!loading && cohorts.length > 0 && (
            <ul className="space-y-3">
              {cohorts.map((c, idx) => (
                <motion.li
                  key={c.id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.04 }}
                  className="rounded-xl border border-border/60 bg-card p-5 hover:border-primary/40 transition-colors"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <Link
                        to={`/cohorts/${c.id}`}
                        className="font-display text-[18px] font-medium text-foreground hover:text-primary transition-colors"
                      >
                        {c.name}
                      </Link>
                      {c.notes && (
                        <p className="text-[12.5px] text-muted-foreground mt-1 line-clamp-2">{c.notes}</p>
                      )}
                      <div className="flex flex-wrap items-center gap-3 mt-3 text-[11px] text-muted-foreground">
                        <Badge variant="outline" className="text-[10px]">
                          {c.trial_count} trial{c.trial_count === 1 ? '' : 's'}
                        </Badge>
                        {c.query_text && (
                          <span className="italic max-w-md truncate">"{c.query_text}"</span>
                        )}
                        {c.filter_phase && <span>· {c.filter_phase}</span>}
                        {c.filter_status && <span>· {c.filter_status.replace(/_/g, ' ')}</span>}
                        {c.filter_country_us && <span>· US</span>}
                      </div>
                      <p className="text-[11px] text-muted-foreground/70 mt-2 flex items-center gap-1.5">
                        <Calendar className="h-3 w-3" />
                        Created {new Date(c.created_at).toLocaleDateString()}
                        {c.refreshed_at && (
                          <>
                            <RefreshCw className="h-3 w-3 ml-2" />
                            Refreshed {new Date(c.refreshed_at).toLocaleDateString()}
                          </>
                        )}
                      </p>
                    </div>
                    <button
                      onClick={() => handleDelete(c.id, c.name)}
                      className="text-muted-foreground hover:text-destructive transition-colors p-1.5 rounded-md hover:bg-destructive/10"
                      aria-label="Delete cohort"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </motion.li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </div>
  );
};

export default Cohorts;
