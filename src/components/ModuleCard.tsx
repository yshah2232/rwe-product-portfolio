import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { Info } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface ModuleCardProps {
  title: string;
  status: 'active' | 'wip';
  description: string;
  tooltip?: string;
  index: number;
  onExplore?: () => void;
}

const ModuleCard = ({ title, status, description, tooltip, onExplore }: ModuleCardProps) => {
  const isActive = status === 'active';

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.05 * (0) }}
      onClick={isActive ? onExplore : undefined}
      className={`
        relative flex-shrink-0 w-[140px] md:w-[160px] aspect-square rounded-lg border-2 p-3 md:p-4
        flex flex-col justify-between transition-all duration-200
        ${isActive
          ? 'bg-primary border-primary text-primary-foreground cursor-pointer hover:shadow-lg hover:scale-[1.03]'
          : 'bg-muted/40 border-border/60 cursor-default'
        }
      `}
    >
      <div>
        <Badge
          variant={isActive ? 'secondary' : 'secondary'}
          className={`text-[10px] px-1.5 py-0 mb-2 ${
            isActive
              ? 'bg-primary-foreground/20 text-primary-foreground border-primary-foreground/30'
              : 'text-muted-foreground/70'
          }`}
        >
          {isActive ? 'ACTIVE' : 'ROADMAP'}
        </Badge>
        <h3
          className={`text-[13px] md:text-[14px] font-semibold leading-tight ${
            isActive ? 'text-primary-foreground' : 'text-muted-foreground'
          }`}
        >
          {title}
        </h3>
      </div>

      {tooltip && (
        <TooltipProvider delayDuration={200}>
          <Tooltip>
            <TooltipTrigger asChild>
              <Info
                className={`absolute bottom-3 right-3 h-3.5 w-3.5 cursor-help ${
                  isActive ? 'text-primary-foreground/60' : 'text-muted-foreground/40'
                }`}
              />
            </TooltipTrigger>
            <TooltipContent side="bottom" className="max-w-xs text-[14px] leading-relaxed">
              <p className="font-medium mb-1">{title}</p>
              <p className="text-muted-foreground">{description}</p>
              <p className="mt-2 text-[13px]">{tooltip}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}
    </motion.div>
  );
};

export default ModuleCard;
