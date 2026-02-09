import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChevronRight, Info } from 'lucide-react';
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
      variants={{
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } },
      }}
      className={`rounded-xl border p-5 md:p-6 transition-shadow ${
        isActive
          ? 'bg-card border-primary/30 shadow-sm hover:shadow-md'
          : 'bg-muted/30 border-border/60'
      }`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <Badge
              variant={isActive ? 'default' : 'secondary'}
              className={isActive ? '' : 'text-muted-foreground'}
            >
              {isActive ? 'ACTIVE' : 'ROADMAP'}
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            <h3
              className={`text-[22px] md:text-[26px] font-semibold leading-snug ${
                isActive ? 'text-foreground' : 'text-muted-foreground'
              }`}
            >
              {title}
            </h3>
            {tooltip && (
              <TooltipProvider delayDuration={200}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info
                      className={`h-4 w-4 shrink-0 cursor-help ${
                        isActive ? 'text-muted-foreground' : 'text-muted-foreground/60'
                      }`}
                    />
                  </TooltipTrigger>
                  <TooltipContent side="top" className="max-w-xs text-[14px] leading-relaxed">
                    {tooltip}
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>
          <p
            className={`mt-1.5 text-[15px] md:text-[16px] leading-relaxed ${
              isActive ? 'text-muted-foreground' : 'text-muted-foreground/60'
            }`}
          >
            {description}
          </p>
        </div>
        {isActive && (
          <Button size="sm" className="mt-1 shrink-0 gap-1" onClick={onExplore}>
            Explore module
            <ChevronRight className="h-4 w-4" />
          </Button>
        )}
      </div>
    </motion.div>
  );
};

export default ModuleCard;
