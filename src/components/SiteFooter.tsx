import { useState } from 'react';
import { Info, ChevronDown, ChevronUp, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';

const SiteFooter = () => {
  const [open, setOpen] = useState(false);
  return (
    <footer className="border-t border-border/40 bg-muted/20">
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-12 space-y-10">
        {/* Brand row */}
        <div className="pt-2">
          <div className="space-y-1.5">
            <p className="text-[16px] font-bold tracking-tight" style={{ color: 'hsl(var(--primary))' }}>
              Clinical Trial Diversity Studio
            </p>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Built on live ClinicalTrials.gov registry data · No PHI · Product capability demo
            </p>
          </div>
        </div>

        {/* Expandable product notice (moved from header) */}
        <div className="rounded-sm border border-border" style={{ backgroundColor: 'hsl(var(--accent))' }}>
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            className="w-full flex items-center gap-3 px-4 py-2.5 text-left"
          >
            <Info className="h-4 w-4 shrink-0" style={{ color: 'hsl(var(--primary))' }} />
            <span className="flex-1 text-[13px] font-semibold" style={{ color: 'hsl(var(--primary))' }}>
              Independent demo · Live ClinicalTrials.gov data
            </span>
            {open ? <ChevronUp className="h-4 w-4" style={{ color: 'hsl(var(--primary))' }} /> : <ChevronDown className="h-4 w-4" style={{ color: 'hsl(var(--primary))' }} />}
          </button>
          {open && (
            <p className="px-4 pb-3 pl-11 text-[13px] leading-snug text-foreground/85">
              Independent product capability demo. All study data is fetched live from the public
              ClinicalTrials.gov API. This workspace is not affiliated with NIH or NLM.{' '}
              <a
                href="https://clinicaltrials.gov/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center underline underline-offset-2"
                style={{ color: 'hsl(var(--link))' }}
              >
                View source registry <ChevronRight className="h-3 w-3 ml-0.5" />
              </a>
            </p>
          )}
        </div>

        {/* Legal + bottom */}
        <div className="border-t border-border/30 pt-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <p className="text-[10px] text-muted-foreground/60">
            {/* The © mark is a quiet entry point to staff sign in; access is still protected by credentials. */}
            <Link to="/admin/login" className="cursor-default" aria-label="Staff">©</Link>{' '}
            {new Date().getFullYear()} Clinical Trial Diversity Studio · Independent information tool · Not affiliated with NIH or NLM
          </p>
          <nav className="flex items-center gap-4 text-[11px]">
            <Link to="/medical-disclaimer" className="text-muted-foreground hover:text-primary underline-offset-2 hover:underline font-semibold">
              Medical disclaimer
            </Link>
            <Link to="/privacy" className="text-muted-foreground hover:text-primary underline-offset-2 hover:underline">
              Privacy
            </Link>
            <Link to="/terms" className="text-muted-foreground hover:text-primary underline-offset-2 hover:underline">
              Terms
            </Link>
            <a
              href="https://clinicaltrials.gov/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-primary underline-offset-2 hover:underline"
            >
              Source: ClinicalTrials.gov
            </a>
          </nav>
        </div>
      </div>
    </footer>
  );
};

export default SiteFooter;
