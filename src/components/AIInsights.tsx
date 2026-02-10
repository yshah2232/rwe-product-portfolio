import { useState } from 'react';
import { Sparkles, ChevronDown, ChevronUp, Star, ExternalLink } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { DailySnapshot, KPIData } from '@/data/syntheticData';
import { BRANDS, PAYERS } from '@/data/syntheticData';

interface AIInsightsProps {
  kpis: KPIData;
  lastDataPoint: DailySnapshot;
  onScrollToSection?: (section: string) => void;
}

function generateExecutiveSummary(kpis: KPIData, data: DailySnapshot): string {
  const activePercent = (kpis.activeRate * 100).toFixed(0);
  const dropPercent = (kpis.dropOffRate * 100).toFixed(0);
  return `Across the ${kpis.totalPatients.toLocaleString()}-patient cohort, ${activePercent}% remain on GLP-1 therapy while ${dropPercent}% have discontinued. The median refill delay of ${kpis.medianRefillGap.toFixed(1)} days suggests a growing gap between expected and actual refill behavior, indicating patients are stretching supply or facing access barriers.`;
}

function generateRecommendations(kpis: KPIData, data: DailySnapshot): { title: string; description: string; priority: 'high' | 'medium'; evidence: string; sectionId: string }[] {
  const recs: { title: string; description: string; priority: 'high' | 'medium'; evidence: string; sectionId: string }[] = [];

  const payerRates = PAYERS.map((p) => ({ name: p, rate: data.byPayer[p].dropOffRate }));
  payerRates.sort((a, b) => b.rate - a.rate);
  const worstPayer = payerRates[0];

  const brandRates = BRANDS.map((b) => ({ name: b, rate: data.byBrand[b].activeRate }));
  brandRates.sort((a, b) => b.rate - a.rate);

  recs.push({
    title: 'Target Early Intervention (0–90 days)',
    description: `The steepest attrition occurs in the first quarter. Implement automated refill reminders, nurse check-ins, and side-effect management programs within the first 90 days to reduce early discontinuation by an estimated 15–20%.`,
    priority: 'high',
    evidence: 'See: Patient Persistence Over Time → 3-month reference line',
    sectionId: 'persistence-curve',
  });

  recs.push({
    title: `Address ${worstPayer.name} Coverage Gaps`,
    description: `${worstPayer.name} patients have a ${(worstPayer.rate * 100).toFixed(0)}% discontinuation rate — the highest across payer types. Advocate for formulary inclusion, copay assistance programs, or prior authorization streamlining to close this gap.`,
    priority: 'high',
    evidence: 'See: Discontinuation by Payer Type chart',
    sectionId: 'payer-chart',
  });

  recs.push({
    title: 'Leverage High-Persistence Brands',
    description: `${brandRates[0].name} leads in patient retention at ${(brandRates[0].rate * 100).toFixed(0)}%. Study what drives its persistence advantage — dosing convenience, side-effect profile, or coverage — and apply those learnings across the portfolio.`,
    priority: 'medium',
    evidence: 'See: Persistence by Brand chart',
    sectionId: 'brand-chart',
  });

  recs.push({
    title: 'Reduce Refill Delay Drift',
    description: `With a median refill gap of ${kpis.medianRefillGap.toFixed(1)} days, patients are increasingly stretching between fills. Consider implementing pharmacy-level nudges and predictive refill scheduling to keep patients on-cycle.`,
    priority: 'medium',
    evidence: 'See: Typical Refill Delay KPI',
    sectionId: 'kpi-section',
  });

  return recs;
}

const priorityStyles = {
  high: 'border-l-4 border-l-primary bg-primary/5',
  medium: 'border-l-4 border-l-rose-400 bg-rose-50',
};

const AIInsights = ({ kpis, lastDataPoint, onScrollToSection }: AIInsightsProps) => {
  const [expanded, setExpanded] = useState(true);
  const summary = generateExecutiveSummary(kpis, lastDataPoint);
  const recommendations = generateRecommendations(kpis, lastDataPoint);

  const handleEvidenceClick = (sectionId: string) => {
    if (onScrollToSection) {
      onScrollToSection(sectionId);
    } else {
      const el = document.getElementById(sectionId);
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  return (
    <div className="rounded-xl border-2 border-primary/20 bg-card shadow-sm overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full px-5 py-4 flex items-center justify-between hover:bg-muted/30 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <Sparkles className="h-5 w-5 text-primary" />
          </div>
          <div className="text-left">
            <div className="flex items-center gap-2">
              <h3 className="text-base font-semibold text-foreground">AI-Powered Insights</h3>
              <span className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                <Star className="h-3 w-3" /> Premium
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Executive summary & directional recommendations
            </p>
          </div>
        </div>
        {expanded ? (
          <ChevronUp className="h-5 w-5 text-muted-foreground" />
        ) : (
          <ChevronDown className="h-5 w-5 text-muted-foreground" />
        )}
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div className="px-5 pb-5 space-y-5">
              {/* Executive Summary */}
              <div className="rounded-lg bg-muted/40 border border-border/50 px-4 py-3">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1.5">Executive Summary</p>
                <p className="text-sm text-foreground leading-relaxed">{summary}</p>
              </div>

              {/* Recommendations */}
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">Recommended Actions</p>
                <div className="space-y-3">
                  {recommendations.map((rec, i) => (
                    <div key={i} className={`rounded-lg p-4 ${priorityStyles[rec.priority]}`}>
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-[10px] font-bold uppercase tracking-wider ${rec.priority === 'high' ? 'text-primary' : 'text-rose-500'}`}>
                          {rec.priority} priority
                        </span>
                      </div>
                      <p className="text-sm font-semibold text-foreground">{rec.title}</p>
                      <p className="text-sm text-muted-foreground leading-relaxed mt-1">{rec.description}</p>
                      <button
                        onClick={() => handleEvidenceClick(rec.sectionId)}
                        className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-primary hover:text-primary/80 transition-colors"
                      >
                        <ExternalLink className="h-3 w-3" />
                        {rec.evidence}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AIInsights;
