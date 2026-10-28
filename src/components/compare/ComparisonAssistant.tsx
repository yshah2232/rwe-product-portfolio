import { useEffect, useMemo, useRef, useState } from 'react';
import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport } from 'ai';
import { MessageCircle, X, RotateCcw, Square } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Conversation, ConversationContent, ConversationScrollButton } from '@/components/ai-elements/conversation';
import { Message, MessageContent, MessageResponse } from '@/components/ai-elements/message';
import { PromptInput, PromptInputTextarea, PromptInputFooter, PromptInputSubmit } from '@/components/ai-elements/prompt-input';
import { Shimmer } from '@/components/ai-elements/shimmer';
import { usePlainMode, TERMS_VERSION } from '@/contexts/PlainModeContext';
import mrTrial from '@/assets/mr-trial.png';
import type { ReportPopulation } from '@/lib/reportContext';

function useComparisonChat(ncts: string[], mode: 'summary' | 'chat', population?: ReportPopulation | null) {
  const { termsAccepted, audience } = usePlainMode();
  const visibleCensus = useMemo(() => population?.rows.flatMap((r) => r.data?.acs_year && !r.error ? [{ state: r.state, year: r.data.acs_year }] : []) ?? [], [population]);
  const transport = useMemo(() => new DefaultChatTransport({
    api: `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/comparison-ai`,
    headers: { Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`, apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY },
    body: { ncts, mode, visibleCensus, acceptance: { accepted: termsAccepted, termsVersion: TERMS_VERSION, audience } },
    fetch: async (url, init) => {
      if (!termsAccepted) throw new Error('Accept the agreement before using AI.');
      const response = await fetch(url, init);
      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body.error || body.message || `AI request failed (${response.status}).`);
      }
      return response;
    },
  }), [ncts, mode, visibleCensus, termsAccepted, audience]);
  const chat = useChat({ transport });
  return { ...chat, termsAccepted, busy: chat.status === 'submitted' || chat.status === 'streaming' };
}

export function ComparisonSummary({ ncts, ready, population }: { ncts: string[]; ready: boolean; population?: ReportPopulation | null }) {
  const chat = useComparisonChat(ncts, 'summary', population);
  const clickGuard = useRef(false);
  const summarize = async () => {
    if (!ready || !chat.termsAccepted || chat.busy || clickGuard.current) return;
    clickGuard.current = true;
    chat.setMessages([]); chat.clearError();
    try { await chat.sendMessage({ text: 'Summarize the important information and takeaways from these selected trials and the available sourced Census context.' }); } finally { clickGuard.current = false; }
  };
  return <section className="mt-10 border-t border-border pt-8" aria-labelledby="ai-summary-heading">
    <div className="flex items-center justify-between gap-4 flex-wrap">
      <div className="flex items-center gap-3"><img src={mrTrial} alt="" width={48} height={48} loading="lazy" /><div><h2 id="ai-summary-heading" className="text-xl font-semibold">Comparison AI summary</h2><p className="text-xs text-muted-foreground">Mr. Trial · Selected registry records and available Census context</p></div></div>
      <Button disabled={!ready || !chat.termsAccepted || chat.busy} onClick={() => void summarize()}><MessageCircle className="h-4 w-4" />{chat.messages.length ? 'Summarize again' : 'Summarize'}</Button>
    </div>
    {chat.busy && <div role="status" className="mt-4 flex items-center gap-3"><Shimmer>Reviewing source records</Shimmer><Button size="icon" variant="ghost" aria-label="Stop summary" onClick={() => void chat.stop()}><Square /></Button></div>}
    {chat.error && <p role="alert" className="mt-4 text-sm text-destructive">{chat.error.message}</p>}
    <div className="mt-5 space-y-4 max-w-4xl">{chat.messages.filter((m) => m.role === 'assistant').map((m) => <div key={m.id}>{m.parts.map((part, i) => part.type === 'text' ? <MessageResponse key={i} className="text-sm leading-relaxed [&_a]:text-primary [&_a]:underline">{part.text}</MessageResponse> : null)}</div>)}</div>
    <p className="mt-4 text-xs text-muted-foreground">AI interpretation, not medical advice. Verify trial details on ClinicalTrials.gov. Statewide residents are not trial participants. This summary is temporary and is not added to the PDF.</p>
  </section>;
}

export function ComparisonAssistant({ ncts, ready, population }: { ncts: string[]; ready: boolean; population?: ReportPopulation | null }) {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const textarea = useRef<HTMLTextAreaElement>(null);
  const guard = useRef(false);
  const chat = useComparisonChat(ncts, 'chat', population);
  useEffect(() => { if (open && !chat.busy) textarea.current?.focus(); }, [open, chat.busy]);
  const send = async (text: string) => {
    if (!text.trim() || !ready || !chat.termsAccepted || chat.busy || guard.current) return;
    guard.current = true; setInput(''); chat.clearError();
    try { await chat.sendMessage({ text: text.trim() }); } finally { guard.current = false; textarea.current?.focus(); }
  };
  return <>
    {!open && <Button variant="outline" className="hidden md:flex fixed bottom-6 right-6 z-40 h-14 gap-2 shadow-lg bg-background" onClick={() => setOpen(true)} aria-label="Open Mr. Trial"><img src={mrTrial} alt="" width={42} height={42} />Mr. Trial</Button>}
    {open && <aside aria-label="Mr. Trial assistant" className="hidden md:flex fixed bottom-6 right-6 z-40 w-[420px] max-w-[calc(100vw-3rem)] h-[640px] max-h-[calc(100vh-4rem)] flex-col rounded-md border border-border bg-background shadow-xl">
      <header className="flex items-center gap-3 border-b border-border p-3 bg-accent"><img src={mrTrial} alt="Mr. Trial mascot" width={44} height={44} /><div className="flex-1"><h2 className="text-base font-semibold">Mr. Trial</h2><p className="text-xs text-muted-foreground">Comparison guide · Temporary conversation</p></div><Button variant="ghost" size="icon" aria-label="Clear conversation" title="Clear conversation" disabled={chat.busy} onClick={() => { chat.setMessages([]); chat.clearError(); textarea.current?.focus(); }}><RotateCcw /></Button><Button variant="ghost" size="icon" aria-label="Close Mr. Trial" onClick={() => setOpen(false)}><X /></Button></header>
      <Conversation className="min-h-0 flex-1"><ConversationContent className="p-4 gap-4">
        {!chat.messages.length && <div className="space-y-4"><p className="text-sm text-foreground">Which differences would you like to explore?</p>{['Explain the important differences', 'What is the recruitment status?', 'Explain the site and Census information'].map((q) => <Button key={q} variant="outline" className="h-auto whitespace-normal justify-start text-left w-full" disabled={!ready || !chat.termsAccepted} onClick={() => void send(q)}>{q}</Button>)}</div>}
        {chat.messages.map((message) => <Message key={message.id} from={message.role}><MessageContent className={message.role === 'user' ? 'bg-primary text-primary-foreground' : ''}>{message.parts.map((part, i) => part.type === 'text' ? <MessageResponse key={i} className="text-sm [&_a]:underline">{part.text}</MessageResponse> : null)}</MessageContent></Message>)}
        {chat.status === 'submitted' && <Shimmer>Reviewing the selected records</Shimmer>}
        {chat.error && <p role="alert" className="text-sm text-destructive">{chat.error.message}</p>}
      </ConversationContent><ConversationScrollButton /></Conversation>
      <div className="p-3 border-t border-border"><PromptInput onSubmit={({ text }) => send(text)} maxFiles={0}><PromptInputTextarea ref={textarea} value={input} onChange={(e) => setInput(e.target.value)} maxLength={2000} placeholder="Ask about these trials" aria-label="Ask Mr. Trial" /><PromptInputFooter className="justify-end"><PromptInputSubmit status={chat.status} disabled={!ready || !chat.termsAccepted || (!input.trim() && !chat.busy)} onStop={() => void chat.stop()} /></PromptInputFooter></PromptInput><p className="mt-2 text-[11px] text-muted-foreground">No medical advice or eligibility verdicts. Do not include personal or medical information. Messages are processed by Lovable AI, not saved as app history.</p></div>
    </aside>}
  </>;
}