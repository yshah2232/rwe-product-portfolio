import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { Info, ArrowRight } from 'lucide-react';
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

const ModuleCard = ({ title, status, description, tooltip, index, onExplore }: ModuleCardProps) => {
  const isActive = status === 'active';

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: 0.08 * index }}
      className={`
        relative rounded-xl border p-5 md:p-6 flex flex-col justify-between min-h-[220px] transition-all duration-200
        ${isActive
          ? 'bg-primary border-primary text-primary-foreground shadow-lg hover:shadow-xl hover:scale-[1.02] cursor-pointer'
          : 'bg-muted/30 border-border/50'
        }
      `}
      onClick={isActive ? onExplore : undefined}
    >
      <div>
        <Badge
          variant="secondary"
          className={`text-[10px] px-2 py-0.5 mb-3 ${
            isActive
              ? 'bg-white/20 text-white border-white/30'
              : 'text-muted-foreground/60 bg-muted/50'
          }`}
        >
          {isActive ? 'ACTIVE' : 'ROADMAP'}
        </Badge>
        <h3
          className={`text-[20px] md:text-[22px] font-semibold leading-snug mb-2 ${
            isActive ? 'text-white' : 'text-muted-foreground'
          }`}
        >
          {title}
        </h3>
        <p
          className={`text-[13px] md:text-[14px] leading-relaxed ${
            isActive ? 'text-white/80' : 'text-muted-foreground/60'
          }`}
        >
          {description}
        </p>
      </div>

      <div className="flex items-center justify-between mt-4">
        {isActive && (
          <span className="inline-flex items-center gap-1.5 text-[13px] font-medium text-white/90">
            Explore module <ArrowRight className="h-3.5 w-3.5" />
          </span>
        )}

        {tooltip && (
          <TooltipProvider delayDuration={200}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Info
                  className={`h-4 w-4 cursor-help ml-auto ${
                    isActive ? 'text-white/50' : 'text-muted-foreground/30'
                  }`}
                />
              </TooltipTrigger>
              <TooltipContent side="bottom" className="max-w-xs text-[14px] leading-relaxed">
                <p className="font-medium mb-1">{title}</p>
                <p className="text-muted-foreground">{tooltip}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </div>
    </motion.div>
  );
};

export default ModuleCard;
