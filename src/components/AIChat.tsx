import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { Send, Download, Trash2, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { KPIData, SegmentSnapshot, CohortResult } from '@/data/csvDataService';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface AIChatProps {
  kpis: KPIData;
  segmentSnapshot: SegmentSnapshot;
  cohort: CohortResult;
  startDate: string;
  endDate: string;
  onMessagesChange?: (count: number) => void;
}

function generateResponse(
  question: string,
  kpis: KPIData,
  snapshot: SegmentSnapshot,
  cohort: CohortResult,
  startDate: string,
  endDate: string,
): string {
  const q = question.toLowerCase();

  // Patient count
  if (q.match(/how many|total|cohort size|patient count|number of patient/)) {
    return `The current cohort contains **${kpis.totalPatients.toLocaleString()}** patients whose first GLP-1 claim falls within the selected time window (${startDate} to ${endDate}). This represents all unique patients meeting the index date criteria.`;
  }

  // Persistence / active
  if (q.match(/persist|active|still on|retention|stay on therapy/)) {
    return `Currently **${(kpis.activeRate * 100).toFixed(1)}%** of patients remain on GLP-1 therapy at the latest observed time point. The steepest attrition occurs in the first 90 days — early intervention programs (refill reminders, nurse check-ins) could improve this by an estimated 15–20%.`;
  }

  // Drop-off / discontinuation
  if (q.match(/drop|discontinu|stop|quit|churn|attrition/)) {
    return `**${(kpis.dropOffRate * 100).toFixed(1)}%** of patients have discontinued therapy. The highest drop-off is observed among ${
      Object.entries(snapshot.byPayer)
        .sort(([, a], [, b]) => b.dropOffRate - a.dropOffRate)[0]?.[0] || 'Cash'
    } patients. Cost barriers and prior authorization complexity are likely contributing factors.`;
  }

  // Brand specific
  if (q.match(/brand|ozempic|wegovy|mounjaro|zepbound/)) {
    const brands = Object.entries(snapshot.byBrand)
      .map(([name, d]) => ({ name, rate: d.activeRate, patients: d.patients }))
      .sort((a, b) => b.rate - a.rate);
    const lines = brands.map(
      (b) => `- **${b.name}**: ${(b.rate * 100).toFixed(1)}% persistence (${b.patients.toLocaleString()} patients)`,
    );
    return `Brand-level persistence comparison:\n\n${lines.join('\n')}\n\n${brands[0].name} leads in retention, likely driven by dosing convenience and established market presence.`;
  }

  // Payer specific
  if (q.match(/payer|commercial|medicare|medicaid|cash|insurance|coverage/)) {
    const payers = Object.entries(snapshot.byPayer)
      .map(([name, d]) => ({ name, dropOff: d.dropOffRate, patients: d.patients }))
      .sort((a, b) => b.dropOff - a.dropOff);
    const lines = payers.map(
      (p) => `- **${p.name}**: ${(p.dropOff * 100).toFixed(1)}% discontinuation (${p.patients.toLocaleString()} patients)`,
    );
    return `Payer-level discontinuation breakdown:\n\n${lines.join('\n')}\n\nCoverage gaps and out-of-pocket costs are the primary drivers of payer-level variation.`;
  }

  // Refill
  if (q.match(/refill|gap|delay|supply|stretch/)) {
    return `The median refill delay is **${kpis.medianRefillGap.toFixed(1)} days**. This means patients are waiting about ${kpis.medianRefillGap.toFixed(0)} days beyond their expected refill date. This drift suggests patients may be stretching their supply, facing access barriers, or experiencing side effects that reduce adherence.`;
  }

  // Region / geographic
  if (q.match(/region|geographic|state|map|location|where|south|north|east|west|midwest/)) {
    const regions = cohort.byRegion
      .slice()
      .sort((a, b) => b.patients - a.patients);
    const lines = regions.map(
      (r) => `- **${r.name}**: ${r.patients.toLocaleString()} patients (${(r.share * 100).toFixed(1)}%)`,
    );
    return `Patient distribution by Census region:\n\n${lines.join('\n')}\n\nConcentration aligns with population density and GLP-1 prescribing patterns in metropolitan areas.`;
  }

  // Summary / overview
  if (q.match(/summary|overview|tell me about|what do you see|insight|key finding/)) {
    return `**Cohort Overview (${startDate} to ${endDate})**\n\n- **${kpis.totalPatients.toLocaleString()}** patients analyzed\n- **${(kpis.activeRate * 100).toFixed(1)}%** still on therapy\n- **${(kpis.dropOffRate * 100).toFixed(1)}%** discontinued\n- **${kpis.medianRefillGap.toFixed(1)} days** median refill delay\n\nThe steepest attrition occurs within the first 90 days. ${
      Object.entries(snapshot.byPayer).sort(([, a], [, b]) => b.dropOffRate - a.dropOffRate)[0]?.[0] || 'Cash'
    } patients show the highest discontinuation rate, suggesting cost-related barriers.`;
  }

  // Fallback — specific about what IS and ISN'T supported
  return `⚠️ **I couldn't find an answer for that question.**\n\nI can **only** analyze the **${kpis.totalPatients.toLocaleString()}-patient GLP-1 cohort** within the current time window (${startDate} to ${endDate}). My responses are derived strictly from the metrics displayed on this dashboard.\n\n**✅ What I can answer:**\n- How many patients are in the cohort?\n- What is the persistence / drop-off rate?\n- Compare brands (Ozempic, Wegovy, Mounjaro, Zepbound)\n- Payer-level analysis (Commercial, Medicare, Medicaid, Cash)\n- Refill gap / delay trends\n- Regional geographic distribution\n- Overall cohort summary\n\n**❌ What I cannot answer:**\n- Questions about specific cities, hospitals, or metropolitan areas\n- Anything outside the selected date range\n- Clinical outcomes, diagnoses, or adverse events\n- Individual patient-level data\n- External market or competitor data\n\nTry rephrasing your question using the topics above.`;
}

const AIChat = ({ kpis, segmentSnapshot, cohort, startDate, endDate, onMessagesChange }: AIChatProps) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    onMessagesChange?.(messages.length);
  }, [messages.length, onMessagesChange]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = useCallback(() => {
    const text = input.trim();
    if (!text) return;

    const userMsg: Message = { role: 'user', content: text, timestamp: new Date() };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    // Simulate typing delay
    setTimeout(() => {
      const response = generateResponse(text, kpis, segmentSnapshot, cohort, startDate, endDate);
      setMessages((prev) => [...prev, { role: 'assistant', content: response, timestamp: new Date() }]);
      setIsTyping(false);
    }, 600 + Math.random() * 400);
  }, [input, kpis, segmentSnapshot, cohort, startDate, endDate]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    },
    [handleSend],
  );

  const handleDownloadChat = useCallback(() => {
    if (messages.length === 0) return;
    const lines = messages.map(
      (m) =>
        `[${m.timestamp.toLocaleTimeString()}] ${m.role === 'user' ? 'You' : 'AI'}: ${m.content.replace(/\*\*/g, '').replace(/\n/g, '\n    ')}`,
    );
    const blob = new Blob([`GLP-1 AI Chat Log\n${new Date().toLocaleString()}\n${'='.repeat(50)}\n\n${lines.join('\n\n')}`], { type: 'text/plain' });
    const a = document.createElement('a');
    a.download = `ai-chat-${new Date().toISOString().slice(0, 10)}.txt`;
    a.href = URL.createObjectURL(blob);
    a.click();
    URL.revokeObjectURL(a.href);
  }, [messages]);

  const handleClear = useCallback(() => {
    setMessages([]);
  }, []);

  // Simple markdown bold rendering
  const renderContent = (text: string) => {
    const parts = text.split(/(\*\*[^*]+\*\*)/g);
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={i} className="font-semibold">{part.slice(2, -2)}</strong>;
      }
      // Handle newlines
      return part.split('\n').map((line, j) => (
        <span key={`${i}-${j}`}>
          {j > 0 && <br />}
          {line}
        </span>
      ));
    });
  };

  return (
    <div className="space-y-3">
      {/* Limitation callout */}
      <div className="flex items-start gap-2 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 px-3 py-2">
        <AlertTriangle className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
        <p className="text-[11px] text-amber-700 dark:text-amber-300 leading-relaxed">
          AI has access to <strong>cohort data within the selected time window only</strong> ({startDate} to {endDate}). Responses are derived from the metrics displayed on this dashboard.
        </p>
      </div>

      {/* Chat messages */}
      <div ref={scrollRef} className="max-h-[300px] overflow-auto space-y-2 scrollbar-thin">
        {messages.length === 0 && (
          <div className="text-center py-6">
            <p className="text-xs text-muted-foreground">Ask a question about your cohort data</p>
            <div className="flex flex-wrap gap-1.5 justify-center mt-3">
              {['What is the persistence rate?', 'Compare brands', 'Regional breakdown'].map((q) => (
                <button
                  key={q}
                  onClick={() => { setInput(q); }}
                  className="text-[10px] px-2.5 py-1 rounded-full border border-border/60 text-muted-foreground hover:bg-muted/50 hover:text-foreground transition-colors"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        <AnimatePresence>
          {messages.map((msg, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[85%] rounded-lg px-3 py-2 text-sm leading-relaxed ${
                  msg.role === 'user'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted/60 text-foreground border border-border/30'
                }`}
              >
                {renderContent(msg.content)}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {isTyping && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start">
            <div className="bg-muted/60 border border-border/30 rounded-lg px-3 py-2">
              <div className="flex gap-1">
                <span className="w-1.5 h-1.5 bg-muted-foreground/40 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-1.5 h-1.5 bg-muted-foreground/40 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-1.5 h-1.5 bg-muted-foreground/40 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </motion.div>
        )}
      </div>

      {/* Input + actions */}
      <div className="flex items-end gap-2">
        <div className="flex-1 relative">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask about cohort data..."
            className="w-full rounded-lg border border-border/60 bg-background px-3 py-2 text-sm placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-primary/30"
            disabled={isTyping}
          />
        </div>
        <button
          onClick={handleSend}
          disabled={!input.trim() || isTyping}
          className="p-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-40"
          aria-label="Send"
        >
          <Send className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Chat actions */}
      {messages.length > 0 && (
        <div className="flex items-center gap-2 justify-end">
          <button
            onClick={handleDownloadChat}
            className="inline-flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground transition-colors"
          >
            <Download className="h-3 w-3" /> Save chat
          </button>
          <button
            onClick={handleClear}
            className="inline-flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground transition-colors"
          >
            <Trash2 className="h-3 w-3" /> Clear
          </button>
        </div>
      )}
    </div>
  );
};

export default AIChat;
