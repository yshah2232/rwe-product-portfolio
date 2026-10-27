import { AlertTriangle } from 'lucide-react';

export interface SearchInterpretation {
  conditionTerms: string[];
  biomarkers: string[];
  location: string | null;
  locationConfidence?: 'high' | 'low' | null;
  priorTreatments: string[];
  status: string | null;
  phase: string | null;
  statusFromQuery?: boolean;
  phaseFromQuery?: boolean;
  complexity: number;
}
export interface SearchRetrieval {
  passes: { label: string; returned: number; totalCount: number }[];
  candidatesFetched: number;
  adaptive: boolean;
  reasons: string[];
}
export interface SearchWarning { code: string; message: string }
export interface Evidence { concept: string; type: string; field: string; snippet: string }

const human = (s: string) => s.replace(/_/g, ' ').toLowerCase();

const Chip = ({ label, value }: { label: string; value: string }) => (
  <span className="inline-flex items-center gap-1 rounded-sm border border-border bg-background px-2 py-0.5 text-[12px]">
    <span className="text-muted-foreground">{label}:</span>
    <span className="font-semibold text-foreground">{value}</span>
  </span>
);

export const SearchDiagnostics = ({
  interpretation, retrieval, warnings, onConfirmLocation, onRemoveLocation,
}: {
  interpretation?: SearchInterpretation; retrieval?: SearchRetrieval; warnings?: SearchWarning[];
  onConfirmLocation?: (loc: string) => void; onRemoveLocation?: (loc: string) => void;
}) => {
  if (!interpretation && !warnings?.length) return null;
  const i = interpretation;
  return (
    <div className="mb-5 space-y-3">
      {i && (
        <div className="ctg-panel p-3">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-2">How we read your search</p>
          <div className="flex flex-wrap gap-1.5">
            {i.conditionTerms.length > 0 && <Chip label="Condition" value={i.conditionTerms.join(' ')} />}
            {i.biomarkers.map((b) => <Chip key={b} label="Biomarker" value={b.toUpperCase()} />)}
            {i.location && i.locationConfidence !== 'low' && <Chip label="Location" value={i.location} />}
            {i.location && i.locationConfidence === 'low' && (
              <span className="inline-flex items-center gap-1.5 rounded-sm border border-primary/40 bg-primary/5 px-2 py-0.5 text-[12px]">
                <span className="text-muted-foreground">Possible location:</span>
                <span className="font-semibold text-foreground">{i.location}</span>
                {onConfirmLocation && (
                  <button
                    type="button"
                    onClick={() => onConfirmLocation(i.location!)}
                    className="font-semibold text-primary hover:underline"
                  >
                    Confirm
                  </button>
                )}
                {onRemoveLocation && (
                  <button
                    type="button"
                    onClick={() => onRemoveLocation(i.location!)}
                    className="font-semibold text-muted-foreground hover:text-destructive hover:underline"
                  >
                    Remove
                  </button>
                )}
              </span>
            )}
            {i.status && <Chip label="Status" value={human(i.status) + (i.statusFromQuery ? ' (from wording)' : '')} />}
            {i.phase && <Chip label="Phase" value={human(i.phase) + (i.phaseFromQuery ? ' (from wording)' : '')} />}
            {i.priorTreatments.map((p) => <Chip key={p} label="Prior treatment" value={p} />)}
          </div>
          {retrieval && (
            <p className="text-[12px] text-muted-foreground mt-2">
              {retrieval.adaptive
                ? `Expanded retrieval: ${retrieval.passes.length} registry queries, ${retrieval.candidatesFetched} candidates reviewed.`
                : `${retrieval.candidatesFetched} candidates reviewed in one registry query.`}
            </p>
          )}
        </div>
      )}
      {warnings && warnings.length > 0 && (
        <div className="ctg-warning rounded-sm p-3" role="status">
          <p className="flex items-center gap-1.5 text-[12px] font-semibold text-foreground mb-1.5">
            <AlertTriangle className="h-3.5 w-3.5" /> Results may be incomplete
          </p>
          <ul className="list-disc pl-5 space-y-0.5 text-[12.5px] text-foreground/85">
            {warnings.map((w) => <li key={w.code}>{w.message}</li>)}
          </ul>
        </div>
      )}
    </div>
  );
};

const FIELD: Record<string, string> = {
  title: 'Title', conditions: 'Conditions', interventions: 'Interventions', keywords: 'Keywords',
  eligibility: 'Eligibility', locations: 'Locations', status: 'Status', phase: 'Phase',
};

export const EvidenceList = ({ evidence, notFound }: { evidence?: Evidence[]; notFound?: { concept: string }[] }) => {
  if (!evidence?.length && !notFound?.length) return null;
  return (
    <div className="mt-2 space-y-1">
      {evidence?.slice(0, 5).map((e, k) => (
        <p key={k} className="text-[12px] text-foreground/75">
          <span className="font-semibold text-primary/80">{FIELD[e.field] ?? e.field}:</span> {e.snippet}
        </p>
      ))}
      {notFound && notFound.length > 0 && (
        <p className="text-[12px] text-muted-foreground">Not stated in registry record: {notFound.map((n) => n.concept).join(', ')}</p>
      )}
    </div>
  );
};
