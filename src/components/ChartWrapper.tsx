import { useState, useRef, useCallback, type ReactNode } from 'react';
import { Maximize2, Minimize2, Download, TableIcon, BarChart3 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from '@/components/ui/dialog';

interface ChartWrapperProps {
  title: string;
  subtitle: string;
  insight?: string;
  children: ReactNode;
  tableView?: ReactNode;
}

const ChartWrapper = ({ title, subtitle, insight, children, tableView }: ChartWrapperProps) => {
  const [fullscreen, setFullscreen] = useState(false);
  const [showTable, setShowTable] = useState(false);
  const chartRef = useRef<HTMLDivElement>(null);

  const handleDownloadImage = useCallback(() => {
    const svg = chartRef.current?.querySelector('svg');
    if (!svg) return;
    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    img.onload = () => {
      canvas.width = img.width * 2;
      canvas.height = img.height * 2;
      ctx?.scale(2, 2);
      ctx?.drawImage(img, 0, 0);
      const a = document.createElement('a');
      a.download = `${title.replace(/\s+/g, '-').toLowerCase()}.png`;
      a.href = canvas.toDataURL('image/png');
      a.click();
    };
    img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
  }, [title]);

  const toolbarIcons = (
    <div className="flex items-center gap-1">
      {tableView && (
        <button
          onClick={() => setShowTable(!showTable)}
          className="p-1.5 rounded-md hover:bg-muted transition-colors text-muted-foreground/50 hover:text-muted-foreground"
          aria-label={showTable ? 'Chart view' : 'Table view'}
        >
          {showTable ? <BarChart3 className="h-4 w-4" /> : <TableIcon className="h-4 w-4" />}
        </button>
      )}
      <button
        onClick={handleDownloadImage}
        className="p-1.5 rounded-md hover:bg-muted transition-colors text-muted-foreground/50 hover:text-muted-foreground"
        aria-label="Download image"
      >
        <Download className="h-4 w-4" />
      </button>
      <button
        onClick={() => setFullscreen(!fullscreen)}
        className="p-1.5 rounded-md hover:bg-muted transition-colors text-muted-foreground/50 hover:text-muted-foreground"
        aria-label="Fullscreen"
      >
        <Maximize2 className="h-4 w-4" />
      </button>
    </div>
  );

  const chartContent = (
    <>
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-base font-semibold text-foreground">{title}</h3>
          <p className="text-sm text-muted-foreground mt-0.5">{subtitle}</p>
        </div>
        {toolbarIcons}
      </div>
      <div ref={chartRef}>
        {showTable && tableView ? tableView : children}
      </div>
      {insight && (
        <div className="mt-4 rounded-lg bg-muted/40 border border-border/50 px-4 py-3">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">What this shows</p>
          <p className="text-sm text-foreground leading-relaxed">{insight}</p>
        </div>
      )}
    </>
  );

  return (
    <>
      <div className="rounded-xl border bg-card p-4 md:p-6 shadow-sm">
        {chartContent}
      </div>
      <Dialog open={fullscreen} onOpenChange={setFullscreen}>
        <DialogContent className="max-w-[95vw] w-full max-h-[90vh] overflow-auto p-6">
          <DialogTitle className="sr-only">{title}</DialogTitle>
          <div className="flex items-start justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold text-foreground">{title}</h3>
              <p className="text-sm text-muted-foreground mt-0.5">{subtitle}</p>
            </div>
            <button
              onClick={() => setFullscreen(false)}
              className="p-1.5 rounded-md hover:bg-muted transition-colors text-muted-foreground"
            >
              <Minimize2 className="h-5 w-5" />
            </button>
          </div>
          <div className="min-h-[60vh]">
            {children}
          </div>
          {insight && (
            <div className="mt-4 rounded-lg bg-muted/40 border border-border/50 px-4 py-3">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">What this shows</p>
              <p className="text-sm text-foreground leading-relaxed">{insight}</p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ChartWrapper;
