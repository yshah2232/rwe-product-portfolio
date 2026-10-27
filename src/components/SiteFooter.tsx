import { Linkedin, Github } from 'lucide-react';
import { Link } from 'react-router-dom';

const SiteFooter = () => (
  <footer className="border-t border-border/40 bg-muted/20">
    <div className="max-w-7xl mx-auto px-4 md:px-6 py-12 space-y-10">
      {/* Brand + social row */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 pt-2">
        <div className="space-y-1.5">
          <p className="text-[16px] font-bold tracking-tight" style={{ color: 'hsl(var(--primary))' }}>
            Clinical Trial Diversity Studio
          </p>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Built on live ClinicalTrials.gov registry data · No PHI · Product capability demo
          </p>
        </div>

        <div className="flex items-center gap-2">
          <a href="https://www.linkedin.com/in/yashshah2232" target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center justify-center w-9 h-9 rounded-lg hover:bg-accent transition-colors" aria-label="LinkedIn">
            <Linkedin className="h-[18px] w-[18px] text-muted-foreground hover:text-primary transition-colors" />
          </a>
          <a href="https://github.com/yshah2232" target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center justify-center w-9 h-9 rounded-lg hover:bg-muted transition-colors" aria-label="GitHub">
            <Github className="h-[18px] w-[18px] text-muted-foreground hover:text-foreground transition-colors" />
          </a>
        </div>
      </div>

      {/* Legal + bottom */}
      <div className="border-t border-border/30 pt-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <p className="text-[10px] text-muted-foreground/60">
          © {new Date().getFullYear()} Clinical Trial Diversity Studio · Independent information tool · Not affiliated with NIH or NLM
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

export default SiteFooter;
