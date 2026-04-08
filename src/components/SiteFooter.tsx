const SiteFooter = () => (
  <footer className="border-t border-border/40 bg-muted/20">
    <div className="max-w-6xl mx-auto px-6 md:px-10 py-8 flex flex-col md:flex-row items-center justify-between gap-4">
      <div className="text-center md:text-left space-y-1">
        <p className="text-xs text-muted-foreground">
          Built with synthetic data. No protected health information. Designed to demonstrate product capability.
        </p>
        <p className="text-[10px] text-muted-foreground/50">
          RWE Studio · Yash Shah · 2024
        </p>
      </div>
      <div className="flex items-center gap-4 text-xs text-muted-foreground">
        <a href="https://www.linkedin.com/in/yashshah2232" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors">LinkedIn</a>
        <a href="https://github.com/yshah2232" target="_blank" rel="noopener noreferrer" className="hover:text-foreground transition-colors">GitHub</a>
      </div>
    </div>
  </footer>
);

export default SiteFooter;
