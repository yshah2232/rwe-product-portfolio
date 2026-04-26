// Persistent toggle in the top nav: Standard ↔ Plain language
// Uses PlainModeContext for state.

import { Sparkles } from 'lucide-react';
import { usePlainMode } from '@/contexts/PlainModeContext';

const PlainModeToggle = () => {
  const { plainMode, togglePlainMode } = usePlainMode();

  return (
    <button
      type="button"
      role="switch"
      aria-checked={plainMode}
      onClick={togglePlainMode}
      title={plainMode ? 'Plain language is ON. Click to switch to clinical view.' : 'Switch to plain-language view.'}
      className={`inline-flex items-center gap-2 h-7 px-2.5 rounded-sm border text-[11.5px] font-semibold transition-colors ${
        plainMode
          ? 'bg-white text-primary border-white'
          : 'bg-transparent text-white/90 border-white/40 hover:border-white'
      }`}
    >
      <Sparkles className="h-3.5 w-3.5" />
      <span className="hidden sm:inline">{plainMode ? 'Plain language: ON' : 'Plain language'}</span>
      <span className="sm:hidden">{plainMode ? 'Plain' : 'Plain?'}</span>
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
  );
};

export default PlainModeToggle;
