import { motion } from 'framer-motion';

interface KPICardProps {
  title: string;
  value: string;
  definition: string;
  suffix?: string;
}

const KPICard = ({ title, value, definition, suffix }: KPICardProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="rounded-xl border bg-card p-4 md:p-5 shadow-sm"
    >
      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
        {title}
      </p>
      <p className="mt-2 text-2xl md:text-3xl font-bold text-foreground">
        {value}
        {suffix && (
          <span className="text-base font-normal text-muted-foreground">{suffix}</span>
        )}
      </p>
      <p className="mt-1.5 text-xs text-muted-foreground leading-relaxed">{definition}</p>
    </motion.div>
  );
};

export default KPICard;
