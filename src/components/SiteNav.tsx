import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import PlainModeToggle from '@/components/PlainModeToggle';

const navLinks = [
  { label: 'Home', to: '/', disabled: false },
  { label: 'Search Registry', to: '/search-registry', disabled: false },
  { label: 'Compare trials', to: '/compare-trials', disabled: false },
  { label: 'Data & Method', to: '/data-method', disabled: false },
  { label: 'About', to: '/about', disabled: false },
];

const SiteNav = () => {
  const { pathname } = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-30 bg-background border-b border-border">
      {/* Unified NLM-style deep blue band: wordmark + product line */}
      <div
        className="w-full"
        style={{ backgroundColor: 'hsl(var(--gov-band-bg))', color: 'hsl(var(--gov-band-fg))' }}
      >
        <div className="max-w-7xl mx-auto px-3 md:px-6 h-14 md:h-auto md:py-4 flex items-center justify-between gap-2 md:gap-4">
          <Link to="/" className="flex items-center gap-2 md:gap-3 group min-w-0">
            <div
              className="flex items-center justify-center h-9 w-9 md:h-10 md:w-10 rounded-sm font-bold text-[13px] tracking-wider shrink-0"
              style={{ backgroundColor: 'white', color: 'hsl(var(--gov-band-bg))' }}
              aria-hidden
            >
              CTD
            </div>
            <div className="leading-tight min-w-0">
              <div className="text-[15px] md:text-[20px] font-bold truncate">
                <span className="md:hidden">CTD Studio</span>
                <span className="hidden md:inline">Clinical Trial Diversity Studio</span>
              </div>
              <div className="hidden md:block text-[13px] opacity-90">
                A planning workspace built on the public ClinicalTrials.gov registry
              </div>
            </div>
          </Link>
          <div className="flex items-center gap-2 shrink-0">
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

      {/* Nav row */}
      <div className="hidden md:block bg-background">
        <div className="max-w-7xl mx-auto px-4 md:px-6">
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
        <div className="md:hidden border-t border-border bg-background max-h-[calc(100vh-56px)] overflow-y-auto shadow-md">
          <div className="max-w-7xl mx-auto px-6 py-2 flex flex-col">
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
