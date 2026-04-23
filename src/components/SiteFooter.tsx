import { Linkedin, Github } from 'lucide-react';
import iconLogo from '@/assets/icon-plc-logo.png';
import syneosLogo from '@/assets/syneos-health-logo.png';

const SiteFooter = () => (
  <footer className="border-t border-border/40 bg-muted/20">
    <div className="max-w-6xl mx-auto px-6 md:px-10 py-12 space-y-10">
      {/* Experience header */}
      <section>
        <div className="flex items-baseline gap-4 mb-6">
          <h2 className="text-xs font-bold tracking-[0.25em] uppercase text-foreground">
            Experience
          </h2>
          <div className="flex-1 border-t border-border/40" />
          <span className="text-[10px] text-muted-foreground/70 tracking-wide hidden sm:inline">
            7 years across two of the world's top contract research organizations
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* ICON Plc */}
          <a
            href="https://www.iconplc.com/solutions/consulting/commercial-positioning-consulting/symphony-health"
            target="_blank"
            rel="noopener noreferrer"
            className="group flex items-center gap-5 px-5 py-5 rounded-xl border border-border/50 bg-card hover:border-primary/40 hover:bg-accent/20 transition-all"
          >
            <div className="flex items-center justify-center h-14 w-28 shrink-0 rounded-lg bg-white px-3">
              <img src={iconLogo} alt="ICON Plc logo" loading="lazy" className="h-9 w-auto object-contain" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-foreground leading-tight">ICON Plc <span className="text-muted-foreground font-normal">(Symphony Health)</span></p>
              <p className="text-[11px] text-muted-foreground leading-snug mt-1">
                Top-5 global CRO · NASDAQ: ICLR · Real-world data & patient analytics
              </p>
            </div>
          </a>

          {/* Syneos Health */}
          <a
            href="https://www.syneoshealth.com"
            target="_blank"
            rel="noopener noreferrer"
            className="group flex items-center gap-5 px-5 py-5 rounded-xl border border-border/50 bg-card hover:border-primary/40 hover:bg-accent/20 transition-all"
          >
            <div className="flex items-center justify-center h-14 w-28 shrink-0 rounded-lg bg-white px-3">
              <img src={syneosLogo} alt="Syneos Health logo" loading="lazy" className="h-9 w-auto object-contain" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-foreground leading-tight">Syneos Health</p>
              <p className="text-[11px] text-muted-foreground leading-snug mt-1">
                Top-10 global CRO · Integrated biopharmaceutical solutions & commercial insights
              </p>
            </div>
          </a>
        </div>
      </section>

      {/* Brand + social row */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 pt-2">
        <div className="space-y-1.5">
          <p className="text-lg font-black text-foreground tracking-tight">RWE Studio</p>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Built with synthetic data · No PHI · Product capability demo
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

      {/* Bottom */}
      <div className="border-t border-border/30 pt-4">
        <p className="text-[10px] text-muted-foreground/50">© {new Date().getFullYear()} Yash Shah · RWE Studio</p>
      </div>
    </div>
  </footer>
);

export default SiteFooter;
