import { useState, useMemo, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, X, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import GlobalControls from '@/components/GlobalControls';
import KPICard from '@/components/KPICard';
import PersistencyCurve from '@/components/PersistencyCurve';
import DropOffByPayer from '@/components/DropOffByPayer';
import BrandPersistency from '@/components/BrandPersistency';
import DrilldownTabs from '@/components/DrilldownTabs';
import GuidedTour from '@/components/GuidedTour';
import InfoPanel from '@/components/InfoPanel';
import AIInsights from '@/components/AIInsights';
import TicketDialog from '@/components/TicketDialog';
import ExportPPT from '@/components/ExportPPT';
import PatientMap from '@/components/PatientMap';
import {
  loadPatientCohort,
  loadPersistenceSummary,
  loadRefillMetrics,
  filterCohort,
  computeKPIs,
  getPersistenceCurveData,
  getSegmentSnapshot,
  type ViewBy,
  type ActiveFilter,
  type PatientRecord,
  type PersistenceRow,
  type RefillRow,
} from '@/data/csvDataService';

const Dashboard = () => {
  const navigate = useNavigate();
  const [startDate, setStartDate] = useState('2024-01-01');
  const [endDate, setEndDate] = useState('2024-12-31');
  const [viewBy, setViewBy] = useState<ViewBy>('Daily');
  const [activeFilter, setActiveFilter] = useState<ActiveFilter | null>(null);
  const [chatMessageCount, setChatMessageCount] = useState(0);
  const [showExitDialog, setShowExitDialog] = useState(false);

  // Raw CSV data
  const [patients, setPatients] = useState<PatientRecord[]>([]);
  const [persistence, setPersistence] = useState<PersistenceRow[]>([]);
  const [refill, setRefill] = useState<RefillRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([loadPatientCohort(), loadPersistenceSummary(), loadRefillMetrics()])
      .then(([p, pers, ref]) => {
        setPatients(p);
        setPersistence(pers);
        setRefill(ref);
        setLoading(false);
      });
  }, []);

  const cohort = useMemo(
    () => filterCohort(patients, startDate, endDate),
    [patients, startDate, endDate],
  );

  const kpis = useMemo(
    () => computeKPIs(cohort, persistence, refill, viewBy),
    [cohort, persistence, refill, viewBy],
  );

  const displayKPIs = useMemo(() => {
    if (!activeFilter) return kpis;
    const segments = activeFilter.type === 'payer' ? cohort.byPayer : cohort.byBrand;
    const seg = segments.find((s) => s.name === activeFilter.value);
    if (!seg) return kpis;
    return { ...kpis, totalPatients: seg.patients };
  }, [kpis, activeFilter, cohort]);

  const curveData = useMemo(
    () => getPersistenceCurveData(persistence, viewBy, activeFilter),
    [persistence, viewBy, activeFilter],
  );

  const segmentSnapshot = useMemo(
    () => getSegmentSnapshot(cohort),
    [cohort],
  );

  const handleSegmentClick = (type: ActiveFilter['type'], value: string) => {
    setActiveFilter((prev) =>
      prev?.type === type && prev?.value === value ? null : { type, value },
    );
  };

  const handleBackClick = useCallback((e: React.MouseEvent) => {
    if (chatMessageCount > 0) {
      e.preventDefault();
      setShowExitDialog(true);
    }
  }, [chatMessageCount]);

  const handleConfirmExit = useCallback(() => {
    setShowExitDialog(false);
    navigate('/');
  }, [navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex items-center gap-3 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span className="text-sm font-medium">Loading patient data…</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Save chat dialog */}
      <Dialog open={showExitDialog} onOpenChange={setShowExitDialog}>
        <DialogContent className="max-w-sm">
          <DialogTitle>Unsaved Chat</DialogTitle>
          <DialogDescription>
            You have {chatMessageCount} chat message{chatMessageCount !== 1 ? 's' : ''} in the AI Q&A. Save your chat before leaving, or it will be lost.
          </DialogDescription>
          <div className="flex gap-2 justify-end mt-4">
            <Button variant="outline" onClick={() => setShowExitDialog(false)}>Stay</Button>
            <Button variant="destructive" onClick={handleConfirmExit}>Leave without saving</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Sticky header */}
      <div className="sticky top-0 z-20 bg-background/95 backdrop-blur-sm">
        <div className="max-w-[1400px] mx-auto px-4 md:px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              to="/"
              onClick={handleBackClick}
              className="inline-flex items-center justify-center h-8 w-8 rounded-lg hover:bg-muted transition-colors"
              aria-label="Back to portfolio"
            >
              <ArrowLeft className="h-5 w-5 text-foreground" />
            </Link>
            <h1 className="text-2xl md:text-3xl font-extrabold text-foreground tracking-tight">GLP 1 Patient Insights</h1>
          </div>
          <div className="flex items-center gap-1">
            <ExportPPT kpis={displayKPIs} segmentSnapshot={segmentSnapshot} cohort={cohort} curveData={curveData} startDate={startDate} endDate={endDate} />
            <TicketDialog />
            <GuidedTour />
            <InfoPanel />
          </div>
        </div>
        <div className="max-w-[1400px] mx-auto px-4 md:px-6">
          <div className="border-t border-border/40" />
        </div>
        <GlobalControls
          startDate={startDate}
          endDate={endDate}
          viewBy={viewBy}
          onStartDateChange={setStartDate}
          onEndDateChange={setEndDate}
          onViewByChange={setViewBy}
        />
      </div>

      {/* Main content */}
      <motion.div
        className="max-w-[1400px] mx-auto px-4 md:px-6 py-6 space-y-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        {/* Active filter badge */}
        {activeFilter && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-2"
          >
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Filtered by:</span>
            <button
              onClick={() => setActiveFilter(null)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-semibold hover:bg-primary/20 transition-colors"
            >
              {activeFilter.value}
              <X className="h-3.5 w-3.5" />
            </button>
            <span className="text-xs text-muted-foreground">Click again or press × to clear</span>
          </motion.div>
        )}

        {/* KPI row */}
        <section id="kpi-section" className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
          <KPICard title="Patients Analyzed" value={displayKPIs.totalPatients.toLocaleString()} description="Unique patients with index_date in the selected time window." detail="A patient is included only if their first GLP-1 claim (index_date) falls within the Patient Time Window." />
          <KPICard title="Still on Therapy" value={`${(displayKPIs.activeRate * 100).toFixed(1)}%`} description="Percentage of patients still active at the latest observed time point." detail="Derived from persistence_summary.csv: the active_rate at the last time_since_index_days row." highlight sentiment="positive" />
          <KPICard title="Stopped Therapy" value={`${(displayKPIs.dropOffRate * 100).toFixed(1)}%`} description="Percentage of patients who discontinued treatment." detail="Calculated as 100% minus Still on Therapy." highlight sentiment="negative" />
          <KPICard title="Typical Refill Delay" value={displayKPIs.medianRefillGap.toFixed(1)} suffix=" days" description="Median number of days patients delay their refill." detail="Sourced from refill_metrics.csv: the median_refill_gap_days for the selected View By granularity." />
        </section>

        {/* Two-column: Charts + AI Insights sidebar */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div id="persistence-curve">
              <PersistencyCurve data={curveData} activeFilter={activeFilter} />
            </div>

            <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div id="payer-chart">
                <DropOffByPayer data={segmentSnapshot} selectedPayer={activeFilter?.type === 'payer' ? activeFilter.value : null} onPayerClick={(payer) => handleSegmentClick('payer', payer)} />
              </div>
              <div id="brand-chart">
                <BrandPersistency data={segmentSnapshot} selectedBrand={activeFilter?.type === 'brand' ? activeFilter.value : null} onBrandClick={(brand) => handleSegmentClick('brand', brand)} />
              </div>
            </section>

            <div id="geo-map">
              <PatientMap cohort={cohort} />
            </div>

            <DrilldownTabs cohort={cohort} activeFilter={activeFilter} />
          </div>

          <div className="lg:col-span-1">
            <div className="lg:sticky lg:top-[160px]">
              <AIInsights
                kpis={displayKPIs}
                segmentSnapshot={segmentSnapshot}
                cohort={cohort}
                startDate={startDate}
                endDate={endDate}
                onChatMessagesChange={setChatMessageCount}
              />
            </div>
          </div>
        </div>

        <div className="border-t pt-6 pb-8 text-center">
          <p className="text-xs text-muted-foreground">
            Built with synthetic claims data · {cohort.total.toLocaleString()} patient cohort · Not real patient data
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default Dashboard;
