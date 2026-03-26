import { Eye, Brain, Info } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import type { TrustInfo } from '@/data/engine/types';

interface TrustBadgeProps {
  trust: TrustInfo;
  size?: 'sm' | 'md';
}

export default function TrustBadge({ trust, size = 'sm' }: TrustBadgeProps) {
  const isObserved = trust.kind === 'observed';
  const Icon = isObserved ? Eye : Brain;

  const confidenceColor =
    trust.confidence >= 80 ? 'text-emerald-600 bg-emerald-50 border-emerald-200' :
    trust.confidence >= 60 ? 'text-amber-600 bg-amber-50 border-amber-200' :
    'text-red-600 bg-red-50 border-red-200';

  const kindColor = isObserved
    ? 'text-blue-700 bg-blue-50 border-blue-200'
    : 'text-purple-700 bg-purple-50 border-purple-200';

  const textSize = size === 'sm' ? 'text-[10px]' : 'text-xs';
  const iconSize = size === 'sm' ? 'h-3 w-3' : 'h-3.5 w-3.5';
  const padding = size === 'sm' ? 'px-1.5 py-0.5' : 'px-2 py-1';

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className={`inline-flex items-center gap-1 rounded-full border ${kindColor} ${padding} ${textSize} font-medium cursor-help`}>
          <Icon className={iconSize} />
          {isObserved ? 'Observed' : 'Inferred'}
          <span className={`inline-flex items-center gap-0.5 rounded-full border ${confidenceColor} px-1.5 py-0 ${textSize} font-semibold ml-0.5`}>
            {trust.confidence}%
          </span>
        </span>
      </TooltipTrigger>
      <TooltipContent side="top" className="max-w-xs text-xs">
        <div className="space-y-1">
          <div className="font-semibold">{isObserved ? 'Observed metric' : 'Inferred metric'}</div>
          <p className="text-muted-foreground">{trust.reason}</p>
          <div className="text-muted-foreground">Confidence: {trust.confidence}%</div>
        </div>
      </TooltipContent>
    </Tooltip>
  );
}
