import { useState } from 'react';
import { motion } from 'framer-motion';
import { Info, X } from 'lucide-react';

interface KPICardProps {
  title: string;
  value: string;
  description: string;
  detail: string;
  suffix?: string;
  highlight?: boolean;
  sentiment?: 'positive' | 'negative';
}

const KPICard = ({ title, value, description, detail, suffix, highlight, sentiment }: KPICardProps) => {
  const [showDetail, setShowDetail] = useState(false);

  const sentimentColor = sentiment === 'positive'
    ? 'text-emerald-600'
    : sentiment === 'negative'
      ? 'text-rose-600'
      : highlight
        ? 'text-primary'
        : 'text-foreground';

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`relative rounded-xl border bg-card p-4 md:p-5 shadow-sm ${highlight ? 'border-primary/30' : ''}`}
    >
      <div className="flex items-start justify-between">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider pr-6">
          {title}
        </p>
        <button
          onClick={() => setShowDetail(!showDetail)}
          className="p-0.5 rounded-md hover:bg-muted transition-colors text-muted-foreground/50 hover:text-muted-foreground"
          aria-label="More info"
        >
          {showDetail ? <X className="h-3.5 w-3.5" /> : <Info className="h-3.5 w-3.5" />}
        </button>
      </div>
      <p className={`mt-2 text-2xl md:text-3xl font-bold ${sentimentColor}`}>
        {value}
        {suffix && (
          <span className="text-base font-normal text-muted-foreground">{suffix}</span>
        )}
      </p>
      <p className="mt-1.5 text-xs text-muted-foreground leading-relaxed">{description}</p>
      {showDetail && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="mt-3 pt-3 border-t text-xs text-muted-foreground leading-relaxed bg-muted/30 -mx-4 md:-mx-5 px-4 md:px-5 -mb-4 md:-mb-5 pb-4 md:pb-5 rounded-b-xl"
        >
          {detail}
        </motion.div>
      )}
    </motion.div>
  );
};

export default KPICard;
