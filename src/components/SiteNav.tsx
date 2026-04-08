import { Link, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';

const navLinks = [
  { label: 'Home', to: '/', disabled: false },
  { label: 'Method', to: '/method', disabled: false },
  { label: 'Data', to: '/data-dictionary', disabled: true },
  { label: 'About', to: '/about', disabled: false },
];

const SiteNav = () => {
  const { pathname } = useLocation();

  return (
    <nav className="sticky top-0 z-30 bg-background/95 backdrop-blur-sm border-b border-border/40">
      <div className="max-w-6xl mx-auto px-6 md:px-10 flex items-center justify-between h-14">
        <div className="flex items-center gap-8">
          <Link to="/" className="text-xl md:text-2xl font-black tracking-tight text-foreground">
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
        <Link to="/about">
          <Button variant="outline" size="sm" className="text-xs font-semibold gap-1.5">
            Know More
          </Button>
        </Link>
      </div>
    </nav>
  );
};

export default SiteNav;
