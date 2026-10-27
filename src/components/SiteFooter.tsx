import { Info, ChevronRight, Flag } from 'lucide-react';
import { Link } from 'react-router-dom';

const SiteFooter = () => {
  return (
    <footer className="border-t border-border/40 bg-muted/20">
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-12 space-y-8">
        {/* Brand row — single full-width line */}
        <div className="pt-2 flex flex-col md:flex-row md:items-baseline md:justify-between gap-1.5">
          <p className="text-[16px] font-bold tracking-tight" style={{ color: 'hsl(var(--primary))' }}>
            Clinical Trial Diversity Studio
          </p>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Built on live ClinicalTrials.gov registry data · No PHI · Product capability demo
          </p>
        </div>

        {/* Product notice — always visible, no dropdown */}
        <div
          className="rounded-sm border border-border px-4 py-3 flex items-start gap-3"
          style={{ backgroundColor: 'hsl(var(--accent))' }}
        >
          <Info className="h-4 w-4 shrink-0 mt-0.5" style={{ color: 'hsl(var(--primary))' }} />
          <p className="text-[13px] leading-snug text-foreground/85">
            <span className="font-semibold" style={{ color: 'hsl(var(--primary))' }}>
              Independent demo · Live ClinicalTrials.gov data.
            </span>{' '}
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
        </div>

        {/* Subtle report entry — quiet text button, not a pop-up artifact */}
        <div>
          <Link
            to="/report"
            className="inline-flex items-center gap-1.5 text-[12px] text-muted-foreground hover:text-primary underline-offset-2 hover:underline"
          >
            <Flag className="h-3 w-3" />
            Report a problem
          </Link>
        </div>

        {/* Legal + bottom bar */}
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
              href="https://www.ysclin.xyz"
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-primary underline-offset-2 hover:underline"
            >
              Contact the creator
            </a>
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
