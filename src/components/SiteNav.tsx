import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

const navLinks = [
  { label: 'Home', to: '/', disabled: false },
  { label: 'Method', to: '/method', disabled: false },
  { label: 'Data', to: '/data-dictionary', disabled: true },
  { label: 'About', to: '/about', disabled: false },
];

const SiteNav = () => {
  const { pathname } = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <nav className="sticky top-0 z-30 bg-background/95 backdrop-blur-sm border-b border-border/40">
      <div className="max-w-6xl mx-auto px-6 md:px-10 flex items-center justify-between h-14">
        <div className="flex items-center gap-8">
          <Link to="/" className="text-xl md:text-2xl font-black tracking-tight text-foreground" onClick={() => setMobileOpen(false)}>
            RWE Studio
          </Link>
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => {
              const isActive = pathname === link.to;
              return (
                link.disabled ? (
                  <span
                    key={link.to}
                    className="px-3 py-1.5 rounded-md text-sm text-muted-foreground/40 cursor-not-allowed select-none"
                    title="Coming soon"
                  >
                    {link.label}
                  </span>
                ) : (
                  <Link
                    key={link.to}
                    to={link.to}
                    className={`px-3 py-1.5 rounded-md text-sm transition-colors ${
                      isActive
                        ? 'text-primary font-semibold bg-accent'
                        : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                    }`}
                  >
                    {link.label}
                  </Link>
                )
              );
            })}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link to="/about" className="hidden md:block">
            <Button variant="outline" size="sm" className="text-xs font-semibold gap-1.5">
              Know More
            </Button>
          </Link>
          <button
            type="button"
            aria-label="Toggle menu"
            aria-expanded={mobileOpen}
            onClick={() => setMobileOpen((v) => !v)}
            className="md:hidden p-2 rounded-md text-foreground hover:bg-muted/50 transition-colors"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>
      {mobileOpen && (
        <div className="md:hidden border-t border-border/40 bg-background">
          <div className="max-w-6xl mx-auto px-6 py-3 flex flex-col gap-1">
            {navLinks.map((link) => (
              link.disabled ? (
                <span
                  key={link.to}
                  className="px-3 py-2.5 rounded-md text-sm text-muted-foreground/40 select-none"
                >
                  {link.label} <span className="text-[10px] ml-1">(soon)</span>
                </span>
              ) : (
                <Link
                  key={link.to}
                  to={link.to}
                  onClick={() => setMobileOpen(false)}
                  className={`px-3 py-2.5 rounded-md text-sm transition-colors ${
                    pathname === link.to
                      ? 'text-primary font-semibold bg-accent'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                  }`}
                >
                  {link.label}
                </Link>
              )
            ))}
            <Link to="/about" onClick={() => setMobileOpen(false)} className="mt-2">
              <Button variant="outline" size="sm" className="w-full text-xs font-semibold">
                Know More
              </Button>
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
};

export default SiteNav;
