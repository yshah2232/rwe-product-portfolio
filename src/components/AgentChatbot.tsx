import { useState, useCallback, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { MessageCircle, X, Send, ArrowRight, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  action?: () => void;
  actionLabel?: string;
}

const INTENTS: {
  patterns: RegExp;
  response: (nav: (path: string) => void) => Message;
}[] = [
  {
    patterns: /dashboard|explore|open dashboard|show dashboard|go to dashboard|glp|patient/i,
    response: (nav) => ({
      role: 'assistant',
      content: 'Opening the GLP 1 Patient Insights Dashboard for you.',
      action: () => nav('/dashboard'),
      actionLabel: 'Go to Dashboard',
    }),
  },
  {
    patterns: /methodol|how.*built|how.*work|technical|approach/i,
    response: (nav) => ({
      role: 'assistant',
      content: 'The methodology page explains the data generation pipeline, Weibull survival modeling, and calibration sources.',
      action: () => nav('/methodology'),
      actionLabel: 'View Methodology',
    }),
  },
  {
    patterns: /persist|retention|stay on|adherence|curve/i,
    response: (nav) => ({
      role: 'assistant',
      content: 'Persistence curves show how patients stay on therapy over time. The dashboard has interactive Kaplan Meier style curves broken down by brand and payer. Let me take you there.',
      action: () => nav('/dashboard'),
      actionLabel: 'See Persistence Curves',
    }),
  },
  {
    patterns: /payer|commercial|medicare|medicaid|cash|insurance|coverage/i,
    response: (nav) => ({
      role: 'assistant',
      content: 'The payer analysis shows discontinuation rates across Commercial, Medicare, Medicaid, and Cash segments. Cash patients show the highest drop off due to cost barriers.',
      action: () => nav('/dashboard'),
      actionLabel: 'Explore Payer Data',
    }),
  },
  {
    patterns: /brand|ozempic|wegovy|mounjaro|zepbound|rybelsus/i,
    response: (nav) => ({
      role: 'assistant',
      content: 'Brand level persistence is compared across Ozempic, Wegovy, Mounjaro, Zepbound, and Rybelsus. Each brand has distinct retention patterns influenced by dosing, coverage, and market positioning.',
      action: () => nav('/dashboard'),
      actionLabel: 'Compare Brands',
    }),
  },
  {
    patterns: /map|geographic|state|region|heatmap|where/i,
    response: (nav) => ({
      role: 'assistant',
      content: 'The US geographic heatmap shows patient distribution across all 50 states, with ZIP3 level detail. Concentration follows population density and prescribing patterns.',
      action: () => nav('/dashboard'),
      actionLabel: 'View Map',
    }),
  },
  {
    patterns: /export|ppt|powerpoint|download|report/i,
    response: (nav) => ({
      role: 'assistant',
      content: 'You can export a full PowerPoint report from the dashboard. It includes KPIs, persistence curves, payer breakdown, and geographic distribution.',
      action: () => nav('/dashboard'),
      actionLabel: 'Go to Export',
    }),
  },
  {
    patterns: /data|synthetic|fake|generated|created|cohort/i,
    response: () => ({
      role: 'assistant',
      content: 'The entire 100K patient cohort is synthetically generated using AI driven statistical modeling. Discontinuation patterns follow modified Weibull survival curves calibrated against published studies by Trujillo et al. and Blonde et al. No real patient data is used anywhere.',
    }),
  },
  {
    patterns: /skill|pm|product manager|competenc|qualification/i,
    response: () => ({
      role: 'assistant',
      content: 'This portfolio demonstrates five core PM skills:\n\n1. **Data Driven Decisions** — KPIs and persistence analytics from claims data\n2. **AI Product Integration** — Rule based AI Q&A on live cohort metrics\n3. **Roadmapping** — Modular product roadmap across patient journey, market access, and HCP intelligence\n4. **Stakeholder Empathy** — Designed for brand managers and payer strategists\n5. **Technical Fluency** — End to end React/TypeScript build with synthetic data pipelines',
    }),
  },
  {
    patterns: /roadmap|next|upcoming|future|plan/i,
    response: () => ({
      role: 'assistant',
      content: 'The roadmap includes four upcoming modules:\n\n• **Patient Journey Analytics** — Diagnosis to treatment milestone mapping\n• **Market Access & Coverage** — Payer rule impact on adoption\n• **HCP Prescribing Intelligence** — Provider level prescribing patterns\n• **Clinical Trials & Signals** — Trial activity to real world adoption',
    }),
  },
  {
    patterns: /linkedin|connect|contact|reach/i,
    response: () => ({
      role: 'assistant',
      content: 'You can connect with Yash Shah on LinkedIn or check out the code on GitHub.',
      action: () => window.open('https://www.linkedin.com/in/yashshah2232', '_blank'),
      actionLabel: 'Open LinkedIn',
    }),
  },
  {
    patterns: /github|code|source|repo/i,
    response: () => ({
      role: 'assistant',
      content: 'The full source code is available on GitHub.',
      action: () => window.open('https://github.com/yshah2232', '_blank'),
      actionLabel: 'Open GitHub',
    }),
  },
  {
    patterns: /hello|hi|hey|what can you|help|who are you/i,
    response: () => ({
      role: 'assistant',
      content: 'Hey! I am the portfolio assistant. I can navigate you around, explain the data, compare brands, show payer analysis, or tell you about the PM skills behind this product. What would you like to explore?',
    }),
  },
];

const AgentChatbot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const handleSend = useCallback(() => {
    const text = input.trim();
    if (!text) return;

    const userMsg: Message = { role: 'user', content: text };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');

    setTimeout(() => {
      const match = INTENTS.find((intent) => intent.patterns.test(text));
      if (match) {
        setMessages((prev) => [...prev, match.response(navigate)]);
      } else {
        setMessages((prev) => [
          ...prev,
          {
            role: 'assistant',
            content: `I can help you with:\n\n• **Navigate** — "Open dashboard", "Show methodology"\n• **Data** — "How was the data created?"\n• **Analysis** — "Compare brands", "Payer breakdown"\n• **Features** — "Persistence curves", "Export report"\n• **About** — "What PM skills?", "Roadmap"\n• **Connect** — "LinkedIn", "GitHub"\n\nTry asking one of these!`,
          },
        ]);
      }
    }, 300 + Math.random() * 200);
  }, [input, navigate]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    },
    [handleSend],
  );

  const renderContent = (text: string) => {
    const parts = text.split(/(\*\*[^*]+\*\*)/g);
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={i} className="font-semibold">{part.slice(2, -2)}</strong>;
      }
      return part.split('\n').map((line, j) => (
        <span key={`${i}-${j}`}>
          {j > 0 && <br />}
          {line}
        </span>
      ));
    });
  };

  return (
    <>
      {/* Floating trigger */}
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
            onClick={() => setIsOpen(true)}
            className="fixed bottom-6 right-6 z-50 flex items-center justify-center w-14 h-14 rounded-full bg-primary text-primary-foreground shadow-2xl hover:scale-110 transition-transform"
            aria-label="Open assistant"
          >
            <MessageCircle className="h-6 w-6" />
            <span className="absolute -top-1 -right-1 flex h-4 w-4">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary/60 opacity-75" />
              <span className="relative inline-flex rounded-full h-4 w-4 bg-emerald-500 items-center justify-center">
                <Zap className="h-2.5 w-2.5 text-white" />
              </span>
            </span>
          </motion.button>
        )}
      </AnimatePresence>

      {/* Chat panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            className="fixed bottom-6 right-6 z-50 w-[380px] max-w-[calc(100vw-3rem)] rounded-2xl border border-border/60 bg-background shadow-2xl overflow-hidden flex flex-col"
            style={{ maxHeight: 'min(520px, calc(100vh - 4rem))' }}
          >
            {/* Header */}
            <div
              className="flex items-center justify-between px-4 py-3 border-b border-border/40"
              style={{ background: 'linear-gradient(135deg, hsl(var(--warm-700)) 0%, hsl(var(--primary)) 100%)' }}
            >
              <div className="flex items-center gap-2">
                <Zap className="h-4 w-4 text-white" />
                <span className="text-sm font-bold text-white">Portfolio Assistant</span>
                <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-white/20 text-white/80 font-medium">
                  Agentic
                </span>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="text-white/70 hover:text-white transition-colors"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Messages */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-3 space-y-2 scrollbar-thin">
              {messages.length === 0 && (
                <div className="text-center py-8 space-y-3">
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10">
                    <Zap className="h-6 w-6 text-primary" />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    I can navigate, explain the data, and answer questions about this portfolio.
                  </p>
                  <div className="flex flex-wrap gap-1.5 justify-center">
                    {['Open dashboard', 'How was data created?', 'What PM skills?'].map((q) => (
                      <button
                        key={q}
                        onClick={() => {
                          setInput(q);
                          setTimeout(() => {
                            setInput(q);
                            const fakeEvent = { key: 'Enter', shiftKey: false, preventDefault: () => {} };
                            // Trigger send
                            const userMsg: Message = { role: 'user', content: q };
                            setMessages((prev) => [...prev, userMsg]);
                            setTimeout(() => {
                              const match = INTENTS.find((intent) => intent.patterns.test(q));
                              if (match) {
                                setMessages((prev) => [...prev, match.response(navigate)]);
                              }
                            }, 300);
                          }, 50);
                        }}
                        className="text-[10px] px-2.5 py-1 rounded-full border border-border/60 text-muted-foreground hover:bg-muted/50 hover:text-foreground transition-colors"
                      >
                        {q}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {messages.map((msg, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className="space-y-1.5 max-w-[85%]">
                    <div
                      className={`rounded-xl px-3 py-2 text-[13px] leading-relaxed ${
                        msg.role === 'user'
                          ? 'bg-primary text-primary-foreground rounded-br-sm'
                          : 'bg-muted/60 text-foreground border border-border/30 rounded-bl-sm'
                      }`}
                    >
                      {renderContent(msg.content)}
                    </div>
                    {msg.action && msg.actionLabel && (
                      <button
                        onClick={() => {
                          msg.action?.();
                          setIsOpen(false);
                        }}
                        className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-primary hover:underline ml-1"
                      >
                        <ArrowRight className="h-3 w-3" />
                        {msg.actionLabel}
                      </button>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Input */}
            <div className="border-t border-border/40 p-2.5 flex items-center gap-2">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask me anything..."
                className="flex-1 rounded-lg border border-border/50 bg-muted/20 px-3 py-2 text-sm placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-primary/30"
              />
              <button
                onClick={handleSend}
                disabled={!input.trim()}
                className="p-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-40"
                aria-label="Send"
              >
                <Send className="h-3.5 w-3.5" />
              </button>
            </div>

            {/* Limitation notice */}
            <div className="px-3 pb-2">
              <p className="text-[9px] text-muted-foreground/60 text-center">
                Client side agent. Can navigate, explain data, and answer portfolio questions.
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default AgentChatbot;
