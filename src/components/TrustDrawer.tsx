// Trust Drawer: shows raw → cleaned with source rule, confidence, and limitation note.
// Includes an inline "Suggest a correction" form that POSTs to ctg-mapping-override
// so users can grow the canonicalization seed from real corrections.

import { useState } from 'react';
import { Info, ShieldCheck, AlertTriangle, Pencil, Loader2, Check } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { getSessionId } from '@/lib/searchSession';
import type { MappingHit } from '@/lib/canonicalize';

const OVERRIDE_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ctg-mapping-override`;

type FieldType = 'sponsor' | 'indication' | 'asset';

interface Props {
  field: string;
  fieldType: FieldType;
  hit: MappingHit;
  sourceField: string; // CTG.gov v2 path, e.g. "protocolSection.sponsorCollaboratorsModule.leadSponsor.name"
  refreshedAt?: string;
  className?: string;
}

const TrustDrawer = ({ field, fieldType, hit, sourceField, refreshedAt, className }: Props) => {
  const isPassthrough = hit.source === 'passthrough';
  const [editing, setEditing] = useState(false);
  const [suggestion, setSuggestion] = useState(hit.clean);
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const submit = async () => {
    const trimmed = suggestion.trim();
    if (trimmed.length < 2) {
      toast.error('Suggestion is too short.');
      return;
    }
    if (trimmed === hit.clean.trim()) {
      toast.info('Suggestion is identical to the current cleaned value.');
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch(OVERRIDE_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          fieldType,
          rawValue: hit.raw,
          suggestedClean: trimmed,
          note: note.trim() || undefined,
          sessionId: getSessionId(),
        }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error || `Request failed (${res.status})`);
      setSubmitted(true);
      setEditing(false);
      toast.success(
        body.deduped
          ? `Thanks — your vote brings this suggestion to ${body.voteCount} support${body.voteCount === 1 ? '' : 's'}.`
          : 'Thanks — submitted for review.',
      );
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to submit suggestion.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label={`Trust details for ${field}`}
          className={cn(
            'inline-flex items-center justify-center h-4 w-4 rounded-full border border-border/60 text-muted-foreground hover:text-primary hover:border-primary/60 transition-colors align-middle ml-1.5',
            className,
          )}
        >
          <Info className="h-2.5 w-2.5" />
        </button>
      </PopoverTrigger>
      <PopoverContent side="top" align="start" className="w-96 p-0 text-xs">
        <div className="p-4">
          <div className="flex items-center gap-2 mb-3 pb-2 border-b border-border/60">
            {isPassthrough ? (
              <AlertTriangle className="h-3.5 w-3.5 text-amber-600" />
            ) : (
              <ShieldCheck className="h-3.5 w-3.5 text-primary" />
            )}
            <p className="font-semibold text-foreground text-[11px] uppercase tracking-wider">
              Trust drawer · {field}
            </p>
          </div>

          {/* Side-by-side raw vs clean */}
          <div className="grid grid-cols-2 gap-3 mb-3">
            <div className="rounded-md border border-border/60 bg-muted/30 p-2.5">
              <p className="text-[9px] uppercase tracking-wider text-muted-foreground/70 mb-1">Raw (CTG.gov)</p>
              <p className="font-mono text-[11px] text-foreground break-words leading-snug">
                {hit.raw || '—'}
              </p>
            </div>
            <div className="rounded-md border border-primary/30 bg-primary/5 p-2.5">
              <p className="text-[9px] uppercase tracking-wider text-primary/80 mb-1">Cleaned</p>
              <p className="text-[12px] text-foreground break-words leading-snug font-medium">
                {hit.clean || '—'}
              </p>
            </div>
          </div>

          <dl className="space-y-2 text-muted-foreground">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <dt className="text-[9px] uppercase tracking-wider text-muted-foreground/70">Source</dt>
                <dd className="text-foreground capitalize text-[11px]">{hit.source}</dd>
              </div>
              <div>
                <dt className="text-[9px] uppercase tracking-wider text-muted-foreground/70">Confidence</dt>
                <dd className="text-foreground text-[11px]">{hit.confidence}%</dd>
              </div>
            </div>
            <div>
              <dt className="text-[9px] uppercase tracking-wider text-muted-foreground/70">Mapping rule</dt>
              <dd className="text-foreground text-[11px]">{hit.note}</dd>
            </div>
            <div>
              <dt className="text-[9px] uppercase tracking-wider text-muted-foreground/70">Source field</dt>
              <dd className="text-foreground font-mono text-[10px] break-all">{sourceField}</dd>
            </div>
            {refreshedAt && (
              <div>
                <dt className="text-[9px] uppercase tracking-wider text-muted-foreground/70">Refreshed</dt>
                <dd className="text-foreground text-[11px]">{new Date(refreshedAt).toLocaleString()}</dd>
              </div>
            )}
            {isPassthrough && (
              <p className="text-[11px] text-amber-700 mt-1 pt-2 border-t border-border/40">
                No mapping rule matched. Raw registry value shown as-is — treat as observed, not normalized.
              </p>
            )}
          </dl>

          {/* Override loop */}
          <div className="mt-3 pt-3 border-t border-border/60">
            {!editing && !submitted && (
              <button
                onClick={() => setEditing(true)}
                className="inline-flex items-center gap-1.5 text-[11px] font-medium text-primary hover:underline"
              >
                <Pencil className="h-3 w-3" /> Suggest a better cleaned value
              </button>
            )}
            {submitted && (
              <p className="inline-flex items-center gap-1.5 text-[11px] font-medium text-primary">
                <Check className="h-3 w-3" /> Submitted — thanks for improving the mapping.
              </p>
            )}
            {editing && (
              <div className="space-y-2">
                <div>
                  <Label htmlFor="suggestion" className="text-[10px] uppercase tracking-wider text-muted-foreground">
                    Your suggested cleaned value
                  </Label>
                  <Input
                    id="suggestion"
                    value={suggestion}
                    onChange={(e) => setSuggestion(e.target.value)}
                    className="h-8 text-[12px] mt-1"
                    maxLength={200}
                  />
                </div>
                <div>
                  <Label htmlFor="note" className="text-[10px] uppercase tracking-wider text-muted-foreground">
                    Why? (optional)
                  </Label>
                  <Textarea
                    id="note"
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="e.g. Subsidiary should roll up to parent."
                    className="text-[12px] mt-1 min-h-[60px]"
                    maxLength={500}
                  />
                </div>
                <div className="flex justify-end gap-2 pt-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 text-[11px]"
                    onClick={() => setEditing(false)}
                    disabled={submitting}
                  >
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    className="h-7 text-[11px] gap-1.5"
                    onClick={submit}
                    disabled={submitting}
                  >
                    {submitting ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />}
                    Submit
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default TrustDrawer;
