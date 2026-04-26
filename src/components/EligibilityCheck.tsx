// Document checklist + AI-powered self-check.
// Flow:
//  1. Show the per-trial checklist (cached from plain-language layer).
//  2. User drops up to 6 files (PDF/image/text) — files stay in browser memory
//     until "Run check" — at which point they're posted to ctg-eligibility-check
//     and immediately discarded after the response. We never store files.
//  3. Render per-item verdict with evidence.

import { useState, useRef } from 'react';
import { FileCheck2, Upload, Loader2, ShieldCheck, AlertTriangle, HelpCircle, X, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { DocChecklistItem } from '@/lib/usePlainTrial';
import { getSessionId } from '@/lib/searchSession';

interface Props {
  nctId: string;
  checklist: DocChecklistItem[];
}

interface Verdict {
  label: string;
  verdict: 'likely_meets' | 'unclear' | 'likely_does_not_meet' | 'no_docs';
  evidence: string;
}

const URL_FN = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ctg-eligibility-check`;
const MAX_FILES = 6;
const MAX_BYTES = 8 * 1024 * 1024;

export default function EligibilityCheck({ nctId, checklist }: Props) {
  const [files, setFiles] = useState<File[]>([]);
  const [notes, setNotes] = useState('');
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ items: Verdict[]; overall: string; summary: string; disclaimer: string } | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  if (!checklist || checklist.length === 0) return null;

  const totalBytes = files.reduce((s, f) => s + f.size, 0);

  const onPick = (incoming: FileList | null) => {
    if (!incoming) return;
    const next = [...files];
    for (const f of Array.from(incoming)) {
      if (next.length >= MAX_FILES) break;
      if (next.find((x) => x.name === f.name && x.size === f.size)) continue;
      next.push(f);
    }
    if (next.reduce((s, f) => s + f.size, 0) > MAX_BYTES) {
      setError(`Combined size exceeds ${MAX_BYTES / 1024 / 1024} MB.`);
      return;
    }
    setError(null);
    setFiles(next);
  };

  const removeFile = (idx: number) => setFiles((prev) => prev.filter((_, i) => i !== idx));

  const fileToBase64 = (f: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const r = new FileReader();
      r.onload = () => {
        const s = r.result as string;
        const i = s.indexOf(',');
        resolve(i >= 0 ? s.slice(i + 1) : s);
      };
      r.onerror = reject;
      r.readAsDataURL(f);
    });

  const run = async () => {
    setRunning(true);
    setError(null);
    setResult(null);
    try {
      const payload = {
        nctId,
        sessionId: getSessionId(),
        notes,
        files: await Promise.all(
          files.map(async (f) => ({
            name: f.name,
            mimeType: f.type || 'application/octet-stream',
            dataBase64: await fileToBase64(f),
          })),
        ),
      };
      const r = await fetch(URL_FN, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify(payload),
      });
      const body = await r.json();
      if (!r.ok) throw new Error(body.error ?? `HTTP ${r.status}`);
      setResult({
        items: body.items ?? [],
        overall: body.overall_signal ?? 'unclear',
        summary: body.summary ?? '',
        disclaimer: body.disclaimer ?? '',
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Check failed');
    } finally {
      setRunning(false);
    }
  };

  return (
    <div className="rounded-sm border border-border bg-card overflow-hidden">
      <div className="px-4 py-3 border-b border-border/60 bg-accent/30 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FileCheck2 className="h-3.5 w-3.5" style={{ color: 'hsl(var(--primary))' }} />
          <p className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: 'hsl(var(--primary))' }}>
            Documents to bring · AI self-check (not medical advice)
          </p>
        </div>
      </div>

      <div className="p-4 space-y-3">
        <p className="text-[12px] text-muted-foreground leading-snug">
          Bring these to your appointment. You can also drop them here and an AI model will flag which
          criteria they appear to address — <strong className="text-foreground">this is not a determination
          of eligibility</strong>. Only the trial site can confirm whether you qualify.{' '}
          <strong className="text-foreground">Files are not stored</strong> — they're sent for analysis and discarded.{' '}
          <a href="/medical-disclaimer" className="underline text-primary">Read full disclaimer</a>.
        </p>

        <ul className="space-y-1.5">
          {checklist.map((c, i) => (
            <li key={i} className="text-[12.5px] flex items-start gap-2">
              <CheckCircle2 className="h-3.5 w-3.5 shrink-0 mt-0.5" style={{ color: 'hsl(var(--primary))' }} />
              <div className="min-w-0">
                <p className="text-foreground font-medium leading-snug">{c.label}</p>
                {c.why && <p className="text-[11.5px] text-muted-foreground leading-snug">{c.why}</p>}
              </div>
            </li>
          ))}
        </ul>

        {/* File picker */}
        <div className="border border-dashed border-border rounded-sm p-3 bg-muted/20">
          <input
            ref={inputRef}
            type="file"
            multiple
            accept="image/*,application/pdf,text/plain"
            className="hidden"
            onChange={(e) => onPick(e.target.files)}
          />
          <div className="flex items-center gap-3">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => inputRef.current?.click()}
              disabled={files.length >= MAX_FILES || running}
              className="gap-1.5"
            >
              <Upload className="h-3.5 w-3.5" />
              Add files
            </Button>
            <p className="text-[11px] text-muted-foreground">
              {files.length}/{MAX_FILES} files · {(totalBytes / 1024 / 1024).toFixed(1)} MB · PDF, images, text
            </p>
          </div>

          {files.length > 0 && (
            <ul className="mt-2 space-y-1">
              {files.map((f, i) => (
                <li key={i} className="flex items-center justify-between text-[11.5px] bg-background rounded-sm px-2 py-1 border border-border/60">
                  <span className="truncate text-foreground">{f.name}</span>
                  <button
                    onClick={() => removeFile(i)}
                    className="ml-2 text-muted-foreground hover:text-destructive shrink-0"
                    disabled={running}
                  >
                    <X className="h-3 w-3" />
                  </button>
                </li>
              ))}
            </ul>
          )}

          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value.slice(0, 400))}
            placeholder="Optional: anything the AI should know (e.g. 'Diagnosed Stage IV in March 2024, on cycle 3 of treatment')"
            rows={2}
            className="mt-2 w-full text-[12px] rounded-sm border border-border bg-background px-2 py-1.5 placeholder:text-muted-foreground/60"
            disabled={running}
          />

          <div className="mt-2 flex items-center justify-between">
            <p className="text-[10.5px] text-muted-foreground italic">
              Not medical advice. Final eligibility is decided by the trial site.
            </p>
            <Button onClick={run} disabled={running || files.length === 0} size="sm" className="gap-1.5">
              {running ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ShieldCheck className="h-3.5 w-3.5" />}
              {running ? 'Checking…' : 'Run check'}
            </Button>
          </div>
        </div>

        {error && (
          <div className="text-[12px] text-destructive bg-destructive/10 border border-destructive/30 rounded-sm p-2">
            {error}
          </div>
        )}

        {result && (
          <div className="space-y-2 pt-1">
            <div
              className="rounded-sm p-3 border"
              style={{
                background:
                  result.overall === 'likely_eligible' ? 'hsl(140 60% 96%)' :
                  result.overall === 'likely_not_eligible' ? 'hsl(0 70% 96%)' :
                  'hsl(45 80% 96%)',
                borderColor:
                  result.overall === 'likely_eligible' ? 'hsl(140 50% 75%)' :
                  result.overall === 'likely_not_eligible' ? 'hsl(0 60% 80%)' :
                  'hsl(40 70% 75%)',
              }}
            >
              <p className="text-[12px] font-semibold text-foreground capitalize">
                Overall: {result.overall.replace(/_/g, ' ')}
              </p>
              {result.summary && <p className="text-[12px] text-foreground/80 mt-1 leading-snug">{result.summary}</p>}
            </div>

            <ul className="space-y-1.5">
              {result.items.map((it, i) => {
                const Icon = it.verdict === 'likely_meets' ? CheckCircle2 :
                             it.verdict === 'likely_does_not_meet' ? AlertTriangle :
                             HelpCircle;
                const color = it.verdict === 'likely_meets' ? '#0d8050' :
                              it.verdict === 'likely_does_not_meet' ? '#b1331a' :
                              '#9a7400';
                return (
                  <li key={i} className="flex items-start gap-2 text-[12.5px] border border-border/60 rounded-sm p-2 bg-background">
                    <Icon className="h-4 w-4 shrink-0 mt-0.5" style={{ color }} />
                    <div className="min-w-0">
                      <p className="text-foreground font-medium leading-snug">{it.label}</p>
                      {it.evidence && (
                        <p className="text-[11.5px] text-muted-foreground italic leading-snug mt-0.5">"{it.evidence}"</p>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>

            {result.disclaimer && (
              <p className="text-[10.5px] text-muted-foreground italic">{result.disclaimer}</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
