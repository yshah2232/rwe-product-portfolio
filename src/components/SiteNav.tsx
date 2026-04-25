import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, ChevronRight } from 'lucide-react';

const navLinks = [
  { label: 'Home', to: '/' },
  { label: 'Search Registry', to: '/search-registry' },
  { label: 'Cohorts', to: '/cohorts' },
  { label: 'Data & Method', to: '/data-method' },
];

const SiteNav = () => {
  const { pathname } = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-30 bg-background border-b border-border">
      {/* Top gov-style banner */}
      <div
        className="w-full text-[12px] leading-tight"
        style={{ backgroundColor: 'hsl(var(--gov-banner-bg))' }}
      >
        <div className="max-w-6xl mx-auto px-6 md:px-10 py-1.5 flex items-center gap-2 text-foreground/80">
          <span className="inline-block w-4 h-3 bg-gradient-to-b from-[#bf0a30] via-white to-[#002868] border border-foreground/20 shrink-0" aria-hidden />
          <span className="hidden sm:inline">An independent product capability demo</span>
          <span className="sm:hidden">Demo</span>
          <span className="text-muted-foreground"> · Built on the public ClinicalTrials.gov API</span>
          <a
            href="https://clinicaltrials.gov/"
            target="_blank"
            rel="noopener noreferrer"
            className="ml-auto inline-flex items-center text-[12px] underline underline-offset-2"
            style={{ color: 'hsl(var(--link))' }}
          >
            View source registry <ChevronRight className="h-3 w-3 ml-0.5" />
          </a>
        </div>
      </div>

      {/* NLM-style deep blue band */}
      <div
        className="w-full"
        style={{ backgroundColor: 'hsl(var(--gov-band-bg))', color: 'hsl(var(--gov-band-fg))' }}
      >
        <div className="max-w-6xl mx-auto px-6 md:px-10 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div
              className="flex items-center justify-center h-9 w-9 rounded-sm font-bold text-[12px] tracking-wider"
              style={{ backgroundColor: 'white', color: 'hsl(var(--gov-band-bg))' }}
              aria-hidden
            >
              CTD
            </div>
            <div className="leading-tight">
              <div className="text-[15px] font-bold">Clinical Trial Diversity Studio</div>
              <div className="text-[11px] opacity-85">Equitable Trial Planning · Live Registry Data</div>
            </div>
          </div>
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

      {/* White wordmark + nav row (CTG.gov style) */}
      <div className="bg-background">
        <div className="max-w-6xl mx-auto px-6 md:px-10 pt-4 pb-0">
          <Link
            to="/"
            onClick={() => setMobileOpen(false)}
            className="inline-flex items-baseline gap-1 text-[26px] md:text-[28px] font-bold leading-none"
            style={{ color: 'hsl(var(--primary))' }}
          >
            DiversityStudio
            <span className="text-[20px] md:text-[22px] font-normal" style={{ color: 'hsl(var(--link))' }}>
              .ctg
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-1 mt-3 -mb-px">
            {navLinks.map((link) => {
              const isActive =
                link.to === '/'
                  ? pathname === '/'
                  : pathname === link.to || pathname.startsWith(link.to + '/');
              return (
                <Link
                  key={link.to}
                  to={link.to}
                  className={`px-4 py-2.5 text-[14px] font-semibold border-b-2 transition-colors ${
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
        <div className="border-b border-border" />
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
