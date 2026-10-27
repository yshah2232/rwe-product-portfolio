// Persistent toggle in the top nav: Standard ↔ Easy read (plain language)
// Uses PlainModeContext for state.

import { Sparkles } from 'lucide-react';
import { usePlainMode } from '@/contexts/PlainModeContext';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

const PlainModeToggle = () => {
  const { plainMode, togglePlainMode } = usePlainMode();

  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            role="switch"
            aria-checked={plainMode}
            onClick={togglePlainMode}
            className={`inline-flex shrink-0 whitespace-nowrap items-center gap-2 h-7 px-2.5 rounded-sm border text-[11.5px] font-semibold transition-colors ${
              plainMode
                ? 'bg-white text-primary border-white'
                : 'bg-transparent text-white/90 border-white/40 hover:border-white'
            }`}
          >
            <Sparkles className="h-3.5 w-3.5" />
            <span className="whitespace-nowrap"><span className="hidden sm:inline">{plainMode ? 'Easy read: ON' : 'Easy read'}</span><span className="sm:hidden">Easy read</span></span>
            <span
              aria-hidden
              className={`inline-block w-7 h-3.5 rounded-full relative transition-colors ${
                plainMode ? 'bg-primary' : 'bg-white/30'
              }`}
            >
              <span
                className={`absolute top-0.5 w-2.5 h-2.5 rounded-full bg-white transition-all ${
                  plainMode ? 'left-3.5' : 'left-0.5'
                }`}
              />
            </span>
          </button>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="max-w-[260px] text-[12px] leading-relaxed">
          Rewrites trial titles, summaries, and eligibility criteria into everyday language for
          patients and families. Shows recruiting studies only. Switch off anytime to return to
          the original clinical wording.
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default PlainModeToggle;
