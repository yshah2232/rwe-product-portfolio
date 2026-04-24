// Trust Drawer: shows raw → cleaned with source rule, confidence, and limitation note.
// Renders inside a popover so it can sit next to any cleaned value in the UI.

import { Info, ShieldCheck, AlertTriangle } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import type { MappingHit } from '@/lib/canonicalize';

interface Props {
  field: string;
  hit: MappingHit;
  sourceField: string; // CTG.gov v2 path, e.g. "protocolSection.sponsorCollaboratorsModule.leadSponsor.name"
  refreshedAt?: string;
  className?: string;
}

const TrustDrawer = ({ field, hit, sourceField, refreshedAt, className }: Props) => {
  const isPassthrough = hit.source === 'passthrough';
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label={`Trust details for ${field}`}
          className={cn(
            'inline-flex items-center justify-center h-4 w-4 rounded-full border border-border/60 text-muted-foreground hover:text-primary hover:border-primary/60 transition-colors align-middle ml-1',
            className,
          )}
        >
          <Info className="h-2.5 w-2.5" />
        </button>
      </PopoverTrigger>
      <PopoverContent side="top" align="start" className="w-80 p-4 text-xs">
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
        <dl className="space-y-2 text-muted-foreground">
          <div>
            <dt className="text-[10px] uppercase tracking-wider text-muted-foreground/70">Raw value</dt>
            <dd className="text-foreground font-mono text-[11px] break-words">{hit.raw || '—'}</dd>
          </div>
          <div>
            <dt className="text-[10px] uppercase tracking-wider text-muted-foreground/70">Cleaned value</dt>
            <dd className="text-foreground text-[12px] break-words">{hit.clean || '—'}</dd>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <dt className="text-[10px] uppercase tracking-wider text-muted-foreground/70">Source</dt>
              <dd className="text-foreground capitalize">{hit.source}</dd>
            </div>
            <div>
              <dt className="text-[10px] uppercase tracking-wider text-muted-foreground/70">Confidence</dt>
              <dd className="text-foreground">{hit.confidence}%</dd>
            </div>
          </div>
          <div>
            <dt className="text-[10px] uppercase tracking-wider text-muted-foreground/70">Mapping rule</dt>
            <dd className="text-foreground text-[11px]">{hit.note}</dd>
          </div>
          <div>
            <dt className="text-[10px] uppercase tracking-wider text-muted-foreground/70">Source field</dt>
            <dd className="text-foreground font-mono text-[10px] break-all">{sourceField}</dd>
          </div>
          {refreshedAt && (
            <div>
              <dt className="text-[10px] uppercase tracking-wider text-muted-foreground/70">Refreshed</dt>
              <dd className="text-foreground text-[11px]">{new Date(refreshedAt).toLocaleString()}</dd>
            </div>
          )}
          {isPassthrough && (
            <p className="text-[11px] text-amber-700 mt-2 pt-2 border-t border-border/40">
              No mapping rule matched. Raw registry value shown as-is — treat as observed, not normalized.
            </p>
          )}
        </dl>
      </PopoverContent>
    </Popover>
  );
};

export default TrustDrawer;
