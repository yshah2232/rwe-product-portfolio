import { Badge } from '@/components/ui/badge';
import { barrierLevelLabel, type BarrierComponent } from '@/lib/barrierScore';

const LEVEL_CLASSES: Record<BarrierComponent['level'], string> = {
  high: 'bg-destructive/10 text-destructive border-destructive/30',
  moderate: 'bg-warning/10 text-warning border-warning/30',
  low: 'bg-success/10 text-success border-success/30',
  unknown: 'bg-muted text-muted-foreground border-border',
};

const LEVEL_DOTS: Record<BarrierComponent['level'], string> = {
  high: 'bg-destructive',
  moderate: 'bg-warning',
  low: 'bg-success',
  unknown: 'bg-muted-foreground/40',
};

// Color-graded badge for one barrier component or the composite score.
export default function BarrierScoreBadge({
  component,
  score,
  className = '',
}: {
  component?: BarrierComponent;
  score?: number | null;
  className?: string;
}) {
  let level: BarrierComponent['level'] = 'unknown';
  let text = 'Not scored';
  if (component) {
    level = component.level;
    text = barrierLevelLabel(level);
  } else if (score != null) {
    level = score >= 150 ? 'high' : score >= 100 ? 'moderate' : 'low';
    text = String(score);
  }
  return (
    <Badge variant="outline" className={`gap-1.5 text-[10px] py-0 h-5 ${LEVEL_CLASSES[level]} ${className}`}>
      <span className={`inline-block h-1.5 w-1.5 rounded-full ${LEVEL_DOTS[level]}`} />
      {text}
    </Badge>
  );
}
