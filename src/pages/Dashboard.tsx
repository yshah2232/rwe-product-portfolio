import { useState, useMemo, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, X, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
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
  const [startDate, setStartDate] = useState('2024-01-01');
  const [endDate, setEndDate] = useState('2024-12-31');
  const [viewBy, setViewBy] = useState<ViewBy>('Daily');
  const [activeFilter, setActiveFilter] = useState<ActiveFilter | null>(null);

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

  // Filtered cohort based on date window
  const cohort = useMemo(
    () => filterCohort(patients, startDate, endDate),
    [patients, startDate, endDate],
  );

  // KPIs
  const kpis = useMemo(
    () => computeKPIs(cohort, persistence, refill, viewBy),
    [cohort, persistence, refill, viewBy],
  );

  // Filtered KPIs when a segment is active
  const displayKPIs = useMemo(() => {
    if (!activeFilter) return kpis;
    const segments = activeFilter.type === 'payer' ? cohort.byPayer : cohort.byBrand;
    const seg = segments.find((s) => s.name === activeFilter.value);
    if (!seg) return kpis;
    return {
      ...kpis,
      totalPatients: seg.patients,
    };
  }, [kpis, activeFilter, cohort]);

  // Persistence curve data
  const curveData = useMemo(
    () => getPersistenceCurveData(persistence, viewBy, activeFilter),
    [persistence, viewBy, activeFilter],
  );

  // Segment snapshot for bar charts
  const segmentSnapshot = useMemo(
    () => getSegmentSnapshot(cohort),
    [cohort],
  );

  const handleSegmentClick = (type: ActiveFilter['type'], value: string) => {
    setActiveFilter((prev) =>
      prev?.type === type && prev?.value === value ? null : { type, value },
    );
  };

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
      {/* Sticky header */}
      <div className="sticky top-0 z-20 bg-background/95 backdrop-blur-sm">
        <div className="max-w-[1400px] mx-auto px-4 md:px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              to="/"
              className="inline-flex items-center justify-center h-8 w-8 rounded-lg hover:bg-muted transition-colors"
              aria-label="Back to portfolio"
            >
              <ArrowLeft className="h-5 w-5 text-foreground" />
            </Link>
            <h1 className="text-2xl md:text-3xl font-extrabold text-foreground tracking-tight">GLP-1 Patient Insights</h1>
          </div>
          <div className="flex items-center gap-1">
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
          <KPICard
            title="Patients Analyzed"
            value={displayKPIs.totalPatients.toLocaleString()}
            description="Unique patients with index_date in the selected time window."
            detail="A patient is included only if their first GLP-1 claim (index_date) falls within the Patient Time Window. Changing the date range rebuilds the entire cohort."
          />
          <KPICard
            title="Still on Therapy"
            value={`${(displayKPIs.activeRate * 100).toFixed(1)}%`}
            description="Percentage of patients still active at the latest observed time point."
            detail="Derived from persistence_summary.csv: the active_rate at the last time_since_index_days row for the selected View By."
            highlight
            sentiment="positive"
          />
          <KPICard
            title="Stopped Therapy"
            value={`${(displayKPIs.dropOffRate * 100).toFixed(1)}%`}
            description="Percentage of patients who discontinued treatment."
            detail="Calculated as 100% minus Still on Therapy. Reflects patients who did not refill within the expected treatment window."
            highlight
            sentiment="negative"
          />
          <KPICard
            title="Typical Refill Delay"
            value={displayKPIs.medianRefillGap.toFixed(1)}
            suffix=" days"
            description="Median number of days patients delay their refill."
            detail="Sourced from refill_metrics.csv: the median_refill_gap_days for the selected View By granularity."
          />
        </section>

        {/* Two-column: Charts + AI Insights sidebar */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Charts column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Hero chart */}
            <div id="persistence-curve">
              <PersistencyCurve data={curveData} activeFilter={activeFilter} />
            </div>

            {/* Secondary charts */}
            <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div id="payer-chart">
                <DropOffByPayer
                  data={segmentSnapshot}
                  selectedPayer={activeFilter?.type === 'payer' ? activeFilter.value : null}
                  onPayerClick={(payer) => handleSegmentClick('payer', payer)}
                />
              </div>
              <div id="brand-chart">
                <BrandPersistency
                  data={segmentSnapshot}
                  selectedBrand={activeFilter?.type === 'brand' ? activeFilter.value : null}
                  onBrandClick={(brand) => handleSegmentClick('brand', brand)}
                />
              </div>
            </section>

            {/* Drilldown */}
            <DrilldownTabs cohort={cohort} activeFilter={activeFilter} />
          </div>

          {/* AI Insights sidebar */}
          <div className="lg:col-span-1">
            <div className="lg:sticky lg:top-[160px]">
              <AIInsights kpis={displayKPIs} segmentSnapshot={segmentSnapshot} cohort={cohort} />
            </div>
          </div>
        </div>

        {/* Footer */}
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
