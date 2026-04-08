import { Linkedin, Github } from 'lucide-react';
import iconLogo from '@/assets/icon-plc-logo.png';
import syneosLogo from '@/assets/syneos-health-logo.png';

const SiteFooter = () => (
  <footer className="border-t border-border/40 bg-muted/20">
    <div className="max-w-6xl mx-auto px-6 md:px-10 py-10 space-y-8">
      {/* Top row: branding + companies + socials */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        {/* Brand */}
        <div className="space-y-1">
          <p className="text-sm font-extrabold text-foreground tracking-tight">RWE Studio</p>
          <p className="text-xs text-muted-foreground">
            Built with synthetic data · No PHI · Product capability demo
          </p>
        </div>

        {/* Companies */}
        <div className="flex items-center gap-4">
          <span className="text-[10px] text-muted-foreground/60 uppercase tracking-wider font-semibold">Experience</span>
          <div className="flex items-center gap-3">
            <img src={iconLogo} alt="ICON PLC" loading="lazy" width={28} height={28} className="h-7 w-7 object-contain rounded" />
            <img src={syneosLogo} alt="Syneos Health" loading="lazy" width={28} height={28} className="h-7 w-7 object-contain rounded" />
          </div>
        </div>

        {/* Social links */}
        <div className="flex items-center gap-3">
          <a
            href="https://www.linkedin.com/in/yashshah2232"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center w-9 h-9 rounded-lg hover:bg-accent transition-colors"
            aria-label="LinkedIn"
          >
            <Linkedin className="h-[18px] w-[18px] text-muted-foreground hover:text-primary transition-colors" />
          </a>
          <a
            href="https://github.com/yshah2232"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center w-9 h-9 rounded-lg hover:bg-muted transition-colors"
            aria-label="GitHub"
          >
            <Github className="h-[18px] w-[18px] text-muted-foreground hover:text-foreground transition-colors" />
          </a>
        </div>
      </div>

      {/* Bottom */}
      <div className="border-t border-border/30 pt-4">
        <p className="text-[10px] text-muted-foreground/50">
          © {new Date().getFullYear()} Yash Shah · RWE Studio
        </p>
      </div>
    </div>
  </footer>
);

export default SiteFooter;
