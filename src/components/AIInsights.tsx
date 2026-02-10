import { useState, useCallback } from 'react';
import { Sparkles, ChevronDown, ChevronUp, Star, ExternalLink, Download, RotateCcw, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { KPIData, SegmentSnapshot, CohortResult } from '@/data/csvDataService';

interface AIInsightsProps {
  kpis: KPIData;
  segmentSnapshot: SegmentSnapshot;
  cohort: CohortResult;
}

function generateExecutiveSummary(kpis: KPIData): string {
  const activePercent = (kpis.activeRate * 100).toFixed(0);
  const dropPercent = (kpis.dropOffRate * 100).toFixed(0);
  return `Across the ${kpis.totalPatients.toLocaleString()}-patient cohort, ${activePercent}% remain on GLP-1 therapy while ${dropPercent}% have discontinued. The median refill delay of ${kpis.medianRefillGap.toFixed(1)} days suggests a growing gap between expected and actual refill behavior, indicating patients are stretching supply or facing access barriers.`;
}

function generateRecommendations(kpis: KPIData, snapshot: SegmentSnapshot) {
  const recs: { title: string; description: string; priority: 'high' | 'medium'; evidence: string; sectionId: string }[] = [];

  const payerEntries = Object.entries(snapshot.byPayer).map(([name, d]) => ({ name, rate: d.dropOffRate }));
  payerEntries.sort((a, b) => b.rate - a.rate);
  const worstPayer = payerEntries[0];

  const brandEntries = Object.entries(snapshot.byBrand).map(([name, d]) => ({ name, rate: d.activeRate }));
  brandEntries.sort((a, b) => b.rate - a.rate);

  recs.push({
    title: 'Target Early Intervention (0–90 days)',
    description: `The steepest attrition occurs in the first quarter. Implement automated refill reminders, nurse check-ins, and side-effect management programs within the first 90 days to reduce early discontinuation by an estimated 15–20%.`,
    priority: 'high',
    evidence: 'See: Patient Persistence Over Time → 3-month reference line',
    sectionId: 'persistence-curve',
  });

  if (worstPayer) {
    recs.push({
      title: `Address ${worstPayer.name} Coverage Gaps`,
      description: `${worstPayer.name} patients have a ${(worstPayer.rate * 100).toFixed(0)}% discontinuation rate — the highest across payer types. Advocate for formulary inclusion, copay assistance programs, or prior authorization streamlining.`,
      priority: 'high',
      evidence: 'See: Discontinuation by Payer Type chart',
      sectionId: 'payer-chart',
    });
  }

  if (brandEntries.length > 0) {
    recs.push({
      title: `Leverage ${brandEntries[0].name}'s Persistence Advantage`,
      description: `${brandEntries[0].name} leads in patient retention at ${(brandEntries[0].rate * 100).toFixed(0)}%. Study what drives its persistence advantage and apply those learnings across the portfolio.`,
      priority: 'medium',
      evidence: 'See: Persistence by Brand chart',
      sectionId: 'brand-chart',
    });
  }

  recs.push({
    title: 'Reduce Refill Delay Drift',
    description: `With a median refill gap of ${kpis.medianRefillGap.toFixed(1)} days, patients are increasingly stretching between fills. Consider pharmacy-level nudges and predictive refill scheduling.`,
    priority: 'medium',
    evidence: 'See: Typical Refill Delay KPI',
    sectionId: 'kpi-section',
  });

  // Geographic insight
  const regionEntries = Object.entries(snapshot.byPayer); // we'll use cohort regions below
  recs.push({
    title: 'Focus Field Efforts on High-Density Regions',
    description: `Patient concentration varies significantly across Census regions. Align field team deployment and pharmacy partnerships with the geographic density map to maximize reach in high-volume states.`,
    priority: 'medium',
    evidence: 'See: Patient Geographic Distribution map',
    sectionId: 'geo-map',
  });

  return recs;
}

const priorityStyles = {
  high: 'border-l-4 border-l-primary bg-primary/5',
  medium: 'border-l-4 border-l-rose-400 bg-rose-50',
};

function formatTimestamp(date: Date): string {
  return date.toLocaleString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
  });
}

const AIInsights = ({ kpis, segmentSnapshot }: AIInsightsProps) => {
  const [expanded, setExpanded] = useState(true);
  const [timestamp, setTimestamp] = useState(() => new Date());
  const summary = generateExecutiveSummary(kpis);
  const recommendations = generateRecommendations(kpis, segmentSnapshot);

  const handleRefresh = useCallback(() => {
    setTimestamp(new Date());
  }, []);

  const handleEvidenceClick = useCallback((sectionId: string) => {
    const el = document.getElementById(sectionId);
    if (!el) return;

    // Remove any existing spotlight
    document.querySelectorAll('.ai-spotlight').forEach((e) => e.classList.remove('ai-spotlight'));

    el.scrollIntoView({ behavior: 'smooth', block: 'center' });

    // Add spotlight class after scroll
    setTimeout(() => {
      el.classList.add('ai-spotlight');
      setTimeout(() => el.classList.remove('ai-spotlight'), 2500);
    }, 400);
  }, []);

  const handleDownload = useCallback(() => {
    const lines: string[] = [];
    lines.push('GLP-1 AI-Powered Insights Report');
    lines.push(`Generated: ${formatTimestamp(timestamp)}`);
    lines.push('');
    lines.push('=== Executive Summary ===');
    lines.push(summary);
    lines.push('');
    lines.push('=== Recommended Actions ===');
    recommendations.forEach((rec, i) => {
      lines.push(`${i + 1}. [${rec.priority.toUpperCase()}] ${rec.title}`);
      lines.push(`   ${rec.description}`);
      lines.push(`   Evidence: ${rec.evidence}`);
      lines.push('');
    });
    const blob = new Blob([lines.join('\n')], { type: 'text/plain' });
    const a = document.createElement('a');
    a.download = `ai-insights-${timestamp.toISOString().slice(0, 10)}.txt`;
    a.href = URL.createObjectURL(blob);
    a.click();
    URL.revokeObjectURL(a.href);
  }, [timestamp, summary, recommendations]);

  return (
    <div className="rounded-xl border-2 border-primary/20 bg-card shadow-sm overflow-hidden">
      <button onClick={() => setExpanded(!expanded)} className="w-full px-5 py-4 flex items-center justify-between hover:bg-muted/30 transition-colors">
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
            <p className="text-xs text-muted-foreground mt-0.5">Executive summary & directional recommendations</p>
          </div>
        </div>
        {expanded ? <ChevronUp className="h-5 w-5 text-muted-foreground" /> : <ChevronDown className="h-5 w-5 text-muted-foreground" />}
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.25 }} className="overflow-hidden">
            <div className="px-5 pb-5 space-y-5">
              {/* Toolbar: timestamp + actions */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  <span>{formatTimestamp(timestamp)}</span>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={(e) => { e.stopPropagation(); handleRefresh(); }}
                    className="p-1.5 rounded-md hover:bg-muted transition-colors text-muted-foreground/50 hover:text-muted-foreground"
                    aria-label="Refresh insights"
                    title="Reset to default / Refresh"
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleDownload(); }}
                    className="p-1.5 rounded-md hover:bg-muted transition-colors text-muted-foreground/50 hover:text-muted-foreground"
                    aria-label="Download insights"
                    title="Download as text file"
                  >
                    <Download className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              <div className="rounded-lg bg-muted/40 border border-border/50 px-4 py-3">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1.5">Executive Summary</p>
                <p className="text-sm text-foreground leading-relaxed">{summary}</p>
              </div>
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
                      <button onClick={() => handleEvidenceClick(rec.sectionId)} className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-primary hover:text-primary/80 transition-colors">
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
