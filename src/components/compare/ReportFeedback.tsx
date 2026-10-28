import { useState } from 'react';
import { Star, Loader2 } from 'lucide-react';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { usePlainMode } from '@/contexts/PlainModeContext';

export function ReportFeedback({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const { termsAccepted } = usePlainMode();
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [state, setState] = useState<'idle' | 'sending' | 'sent'>('idle');
  const [error, setError] = useState('');
  const submit = async () => {
    if (!termsAccepted || state !== 'idle') return;
    const parsed = z.object({ rating: z.number().int().min(1).max(5), comment: z.string().trim().max(1000) }).safeParse({ rating, comment });
    if (!parsed.success) { setError('Choose a rating and keep comments within 1000 characters.'); return; }
    setState('sending'); setError('');
    const { error: failure } = await supabase.functions.invoke('report-feedback', { body: parsed.data });
    if (failure) { setError('Feedback could not be sent. Please try again.'); setState('idle'); }
    else setState('sent');
  };
  return <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent className="max-w-md">
      <DialogHeader><DialogTitle>{state === 'sent' ? 'Thank you for your feedback' : 'How was your experience?'}</DialogTitle>
        <DialogDescription>{state === 'sent' ? 'Your anonymous feedback has been sent to the creator.' : 'Your download has started. Sharing feedback is optional.'}</DialogDescription></DialogHeader>
      {state !== 'sent' && <>
        <div role="group" aria-label="Experience rating" className="flex gap-2">
          {[1, 2, 3, 4, 5].map((n) => <Button key={n} variant="outline" size="icon" aria-label={`Rate ${n} out of 5`} aria-pressed={rating === n} disabled={state === 'sending'} onClick={() => setRating(n)}><Star className={`h-5 w-5 ${rating >= n ? 'fill-primary text-primary' : 'text-muted-foreground'}`} /></Button>)}
        </div>
        <p className="text-xs text-muted-foreground">1: Poor · 5: Excellent{rating > 0 ? ` · Selected: ${rating}` : ''}</p>
        <label htmlFor="report-comment" className="text-sm font-medium">What could be better? (optional)</label>
        <Textarea id="report-comment" value={comment} onChange={(e) => setComment(e.target.value)} maxLength={1000} disabled={state === 'sending'} />
        <p className="text-xs text-muted-foreground">Only your rating, comment and submission time are saved for admin review. No searches, selected trials or PDF contents are attached. Do not include names, contact details or medical information.</p>
        {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
        <div className="flex justify-end gap-2"><Button variant="ghost" onClick={() => onOpenChange(false)}>Not now</Button><Button disabled={!rating || state === 'sending'} onClick={() => void submit()}>{state === 'sending' && <Loader2 className="h-4 w-4 animate-spin mr-2" />}Send feedback</Button></div>
      </>}
      {state === 'sent' && <Button onClick={() => onOpenChange(false)}>Done</Button>}
    </DialogContent>
  </Dialog>;
}