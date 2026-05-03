import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, ChevronRight, Info, ChevronUp, ChevronDown } from 'lucide-react';
import PlainModeToggle from '@/components/PlainModeToggle';

const navLinks = [
  { label: 'Home', to: '/', disabled: false },
  { label: 'Search Registry', to: '/search-registry', disabled: false },
  // Cohorts hidden from primary nav — feature still works at /cohorts but is
  // not the focus right now (kept as deep link for in-flow Save action).
  { label: 'Cohorts', to: '/cohorts', disabled: true },
  { label: 'Data & Method', to: '/data-method', disabled: false },
  { label: 'About', to: '/about', disabled: false },
];

const BANNER_AUTO_HIDE_MS = 45000;

const SiteNav = () => {
  const { pathname } = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [bannerExpanded, setBannerExpanded] = useState(true);

  // Auto-collapse the intro banner after 45s of session time
  useEffect(() => {
    const t = setTimeout(() => setBannerExpanded(false), BANNER_AUTO_HIDE_MS);
    return () => clearTimeout(t);
  }, []);

  return (
    <header className="sticky top-0 z-30 bg-background border-b border-border">
      {/* Unified NLM-style deep blue band: wordmark + product line */}
      <div
        className="w-full"
        style={{ backgroundColor: 'hsl(var(--gov-band-bg))', color: 'hsl(var(--gov-band-fg))' }}
      >
        <div className="max-w-6xl mx-auto px-6 md:px-10 py-4 flex items-center justify-between gap-4">
          <Link to="/" className="flex items-center gap-3 group">
            <div
              className="flex items-center justify-center h-10 w-10 rounded-sm font-bold text-[13px] tracking-wider shrink-0"
              style={{ backgroundColor: 'white', color: 'hsl(var(--gov-band-bg))' }}
              aria-hidden
            >
              CTD
            </div>
            <div className="leading-tight">
              <div className="text-[18px] md:text-[20px] font-bold">
                Clinical Trial Diversity Studio
              </div>
              <div className="text-[12px] md:text-[13px] opacity-90">
                A planning workspace built on the public ClinicalTrials.gov registry
              </div>
            </div>
          </Link>
          <div className="flex items-center gap-2">
            <PlainModeToggle />
            <button
              type="button"
              aria-label="Toggle menu"
              aria-expanded={mobileOpen}
              onClick={() => setMobileOpen((v) => !v)}
              className="md:hidden p-1.5 rounded-sm border border-white/40"
            >
              {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Dismissible / collapsible intro banner (replaces old top strip) */}
      <div
        className="w-full border-b border-border"
        style={{ backgroundColor: 'hsl(var(--accent))' }}
        role="region"
        aria-label="About this product"
      >
        <div className="max-w-6xl mx-auto px-6 md:px-10 py-2 flex items-start gap-3">
          <Info className="h-4 w-4 mt-0.5 shrink-0" style={{ color: 'hsl(var(--primary))' }} />
          <div className="flex-1 min-w-0">
            {bannerExpanded ? (
              <p className="text-[13px] leading-snug text-foreground/85">
                <span className="font-semibold" style={{ color: 'hsl(var(--primary))' }}>
                  Independent product capability demo.
                </span>{' '}
                All study data is fetched live from the public ClinicalTrials.gov API. This workspace
                is not affiliated with NIH or NLM.{' '}
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
            ) : (
              <p className="text-[12px] leading-snug text-foreground/70 truncate">
                Independent demo · Live ClinicalTrials.gov data
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={() => setBannerExpanded((v) => !v)}
            aria-label={bannerExpanded ? 'Collapse banner' : 'Expand banner'}
            aria-expanded={bannerExpanded}
            className="shrink-0 p-1 rounded-sm hover:bg-background/60 transition-colors"
            style={{ color: 'hsl(var(--primary))' }}
          >
            {bannerExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {/* Nav row */}
      <div className="bg-background">
        <div className="max-w-6xl mx-auto px-6 md:px-10">
          <nav className="hidden md:flex items-center gap-1 -mb-px">
            {navLinks.map((link) => {
              const isActive =
                link.to === '/'
                  ? pathname === '/'
                  : pathname === link.to || pathname.startsWith(link.to + '/');
              if (link.disabled) {
                return (
                  <span
                    key={link.to}
                    aria-disabled="true"
                    title="Temporarily hidden — focusing on Search Registry"
                    className="px-4 py-3 text-[14px] font-semibold border-b-2 border-transparent text-foreground/30 cursor-not-allowed select-none inline-flex items-center gap-1.5"
                  >
                    {link.label}
                    <span className="text-[9px] uppercase tracking-wider px-1.5 py-0.5 rounded-sm bg-muted text-muted-foreground">
                      Soon
                    </span>
                  </span>
                );
              }
              return (
                <Link
                  key={link.to}
                  to={link.to}
                  className={`px-4 py-3 text-[14px] font-semibold border-b-2 transition-colors ${
                    isActive
                      ? 'border-primary text-primary'
                      : 'border-transparent text-foreground/75 hover:text-primary hover:border-primary/40'
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="md:hidden border-t border-border bg-background">
          <div className="max-w-6xl mx-auto px-6 py-2 flex flex-col">
            {navLinks.map((link) => {
              const isActive =
                link.to === '/'
                  ? pathname === '/'
                  : pathname === link.to || pathname.startsWith(link.to + '/');
              if (link.disabled) {
                return (
                  <span
                    key={link.to}
                    aria-disabled="true"
                    className="px-2 py-3 text-[14px] font-semibold border-b border-border text-foreground/30"
                  >
                    {link.label} <span className="text-[10px] ml-1">(soon)</span>
                  </span>
                );
              }
              return (
                <Link
                  key={link.to}
                  to={link.to}
                  onClick={() => setMobileOpen(false)}
                  className={`px-2 py-3 text-[14px] font-semibold border-b border-border ${
                    isActive ? 'text-primary' : 'text-foreground/80'
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </header>
  );
};

export default SiteNav;
