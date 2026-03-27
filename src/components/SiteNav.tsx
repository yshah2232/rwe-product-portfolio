import { Link, useLocation } from 'react-router-dom';
import { Github, Linkedin } from 'lucide-react';

const navLinks = [
  { label: 'Home', to: '/' },
  { label: 'Method', to: '/method' },
  { label: 'Data', to: '/data-dictionary' },
  { label: 'About', to: '/about' },
];

const SiteNav = () => {
  const { pathname } = useLocation();

  return (
    <nav className="sticky top-0 z-30 bg-background/95 backdrop-blur-sm border-b border-border/40">
      <div className="max-w-6xl mx-auto px-6 md:px-10 flex items-center justify-between h-14">
        <div className="flex items-center gap-8">
          <Link to="/" className="text-sm font-bold tracking-tight text-foreground">
            Health Insights Hub
          </Link>
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => {
              const isActive = pathname === link.to;
              return (
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
              );
            })}
          </div>
        </div>
        <div className="flex items-center gap-2">
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
    </nav>
  );
};

export default SiteNav;
