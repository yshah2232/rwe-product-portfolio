import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChevronRight } from 'lucide-react';

interface ModuleCardProps {
  title: string;
  status: 'active' | 'wip';
  description: string;
  index: number;
  onExplore?: () => void;
}

const ModuleCard = ({ title, status, description, onExplore }: ModuleCardProps) => {
  const isActive = status === 'active';

  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } },
      }}
      className={`rounded-xl border p-5 md:p-6 transition-shadow ${
        isActive
          ? 'bg-card border-primary/20 shadow-sm hover:shadow-md'
          : 'bg-muted/40 border-border opacity-60'
      }`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <Badge variant={isActive ? 'default' : 'secondary'} className={isActive ? '' : 'opacity-70'}>
              {isActive ? 'ACTIVE' : 'WIP'}
            </Badge>
          </div>
          <h3 className={`text-lg font-semibold ${isActive ? 'text-foreground' : 'text-muted-foreground'}`}>
            {title}
          </h3>
          <p className={`mt-1 text-sm leading-relaxed ${isActive ? 'text-muted-foreground' : 'text-muted-foreground/70'}`}>
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
