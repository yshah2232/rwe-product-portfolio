import { ShieldAlert } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

interface SuppressionBadgeProps {
  count: number;
  threshold?: number;
}

export default function SuppressionBadge({ count, threshold = 11 }: SuppressionBadgeProps) {
  if (count >= threshold) return null;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className="inline-flex items-center gap-1 rounded-full border border-orange-200 bg-orange-50 text-orange-700 px-2 py-0.5 text-[10px] font-semibold cursor-help">
          <ShieldAlert className="h-3 w-3" />
          Suppressed
        </span>
      </TooltipTrigger>
      <TooltipContent side="top" className="max-w-xs text-xs">
        <p>This cell contains fewer than {threshold} patients and has been suppressed to protect privacy. Count: n &lt; {threshold}.</p>
      </TooltipContent>
    </Tooltip>
  );
}
