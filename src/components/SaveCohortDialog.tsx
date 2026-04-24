// Save Cohort dialog — writes selected trials + the originating query to
// saved_cohorts/cohort_trials, then navigates to the new cohort detail page.

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, Save } from 'lucide-react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { getSessionId } from '@/lib/searchSession';
import { cleanSponsor, cleanIndication, cleanAsset } from '@/lib/canonicalize';
import { toast } from 'sonner';

export interface SaveTrial {
  nctId: string;
  briefTitle: string;
  status: string;
  phase: string[];
  leadSponsor: string;
  conditions: string[];
  interventions: string[];
  enrollment: number | null;
  countries: string[];
  semanticScore: number;
  semanticReason: string;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  trials: SaveTrial[];
  query: string;
  filters: { phase: string; status: string; countryUS: boolean };
}

const SaveCohortDialog = ({ open, onOpenChange, trials, query, filters }: Props) => {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    const cleanName = name.trim();
    if (cleanName.length < 2) {
      toast.error('Cohort name must be at least 2 characters');
      return;
    }
    if (trials.length === 0) {
      toast.error('Select at least one trial');
      return;
    }
    setSaving(true);
    try {
      const sessionId = getSessionId();
      const { data: cohort, error: cohortErr } = await supabase
        .from('saved_cohorts')
        .insert({
          session_id: sessionId,
          name: cleanName,
          notes: notes.trim() || null,
          query_text: query,
          filter_phase: filters.phase !== 'any' ? filters.phase : null,
          filter_status: filters.status !== 'any' ? filters.status : null,
          filter_country_us: filters.countryUS,
          trial_count: trials.length,
          refreshed_at: new Date().toISOString(),
        })
        .select('id')
        .single();
      if (cohortErr || !cohort) throw new Error(cohortErr?.message ?? 'Failed to create cohort');

      const rows = trials.map((t) => ({
        cohort_id: cohort.id,
        nct_id: t.nctId,
        brief_title: t.briefTitle,
        overall_status: t.status,
        phase: t.phase,
        sponsor_raw: t.leadSponsor,
        sponsor_clean: cleanSponsor(t.leadSponsor).clean,
        conditions_raw: t.conditions,
        conditions_clean: t.conditions.map((c) => cleanIndication(c).clean),
        interventions_raw: t.interventions,
        interventions_clean: t.interventions.map((i) => cleanAsset(i).clean),
        enrollment: t.enrollment,
        countries: t.countries,
        semantic_score: t.semanticScore,
        semantic_reason: t.semanticReason,
      }));
      const { error: trialsErr } = await supabase.from('cohort_trials').insert(rows);
      if (trialsErr) throw new Error(trialsErr.message);

      toast.success(`Saved cohort "${cleanName}"`);
      onOpenChange(false);
      setName('');
      setNotes('');
      navigate(`/cohorts/${cohort.id}`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to save cohort');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Save {trials.length} trial{trials.length === 1 ? '' : 's'} as cohort</DialogTitle>
          <DialogDescription>
            Cohorts are scoped to this browser session. The link is stable — bookmark it to come back.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div>
            <Label htmlFor="cohort-name" className="text-xs uppercase tracking-wider text-muted-foreground">
              Cohort name
            </Label>
            <Input
              id="cohort-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. NSCLC pembro late-line, Q2 review"
              className="mt-1.5"
              maxLength={120}
              autoFocus
            />
          </div>
          <div>
            <Label htmlFor="cohort-notes" className="text-xs uppercase tracking-wider text-muted-foreground">
              Notes (optional)
            </Label>
            <Textarea
              id="cohort-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Why this cohort matters, what to do next, who to share with…"
              className="mt-1.5 text-sm"
              rows={3}
              maxLength={500}
            />
          </div>
          <p className="text-[11px] text-muted-foreground bg-accent/30 border border-border/40 rounded-md p-2.5">
            Originating query: <span className="text-foreground">"{query}"</span>
            {filters.phase !== 'any' && <> · {filters.phase}</>}
            {filters.status !== 'any' && <> · {filters.status.replace(/_/g, ' ')}</>}
            {filters.countryUS && <> · US sites only</>}
          </p>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving} className="gap-2">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Save cohort
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default SaveCohortDialog;
