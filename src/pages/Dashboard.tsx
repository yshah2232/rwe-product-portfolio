import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, X } from 'lucide-react';
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
  getDailyData,
  aggregateData,
  getKPIs,
  getFilteredKPIs,
  dateToDayNumber,
  type Granularity,
  type ActiveFilter,
} from '@/data/syntheticData';

const Dashboard = () => {
  const [startDate, setStartDate] = useState('2024-01-01');
  const [endDate, setEndDate] = useState('2024-12-31');
  const [granularity, setGranularity] = useState<Granularity>('weekly');
  const [activeFilter, setActiveFilter] = useState<ActiveFilter | null>(null);

  const allData = useMemo(() => getDailyData(), []);

  const startDay = useMemo(() => dateToDayNumber(startDate), [startDate]);
  const endDay = useMemo(() => dateToDayNumber(endDate), [endDate]);

  const effectiveStartDay = Math.min(startDay, endDay);
  const effectiveEndDay = Math.max(startDay, endDay);

  const chartData = useMemo(
    () => aggregateData(allData, effectiveStartDay, effectiveEndDay, granularity),
    [allData, effectiveStartDay, effectiveEndDay, granularity],
  );

  const kpis = useMemo(
    () =>
      activeFilter
        ? getFilteredKPIs(allData, effectiveEndDay, activeFilter)
        : getKPIs(allData, effectiveEndDay),
    [allData, effectiveEndDay, activeFilter],
  );

  const lastDataPoint =
    chartData.length > 0 ? chartData[chartData.length - 1] : allData[allData.length - 1];

  const handleSegmentClick = (type: ActiveFilter['type'], value: string) => {
    setActiveFilter((prev) =>
      prev?.type === type && prev?.value === value ? null : { type, value },
    );
  };

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
          granularity={granularity}
          onStartDateChange={setStartDate}
          onEndDateChange={setEndDate}
          onGranularityChange={setGranularity}
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
            value={kpis.totalPatients.toLocaleString()}
            description="Number of unique patients included in this view."
            detail="These are patients with at least one GLP-1 claim in the selected time window. The cohort is defined by the Patient Time Window filter above."
          />
          <KPICard
            title="Still on Therapy"
            value={`${(kpis.activeRate * 100).toFixed(1)}%`}
            description="Percentage of patients who are still taking their GLP-1 medication."
            detail="A patient is considered active if they refill within the expected treatment window. This typically means a new fill within 30-90 days of the previous one, depending on the medication."
            highlight
            sentiment="positive"
          />
          <KPICard
            title="Stopped Therapy"
            value={`${(kpis.dropOffRate * 100).toFixed(1)}%`}
            description="Percentage of patients who discontinued treatment."
            detail="Patients with no refill after the expected refill window are considered discontinued. This is the inverse of the 'Still on Therapy' rate."
            highlight
            sentiment="negative"
          />
          <KPICard
            title="Typical Refill Delay"
            value={kpis.medianRefillGap.toFixed(1)}
            suffix=" days"
            description="How late patients usually refill their medication."
            detail="This shows the median number of days between the expected refill date and the actual refill date. Higher values indicate patients are stretching their supply or delaying treatment."
          />
        </section>

        {/* Two-column: Charts + AI Insights sidebar */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Charts column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Hero chart */}
            <div id="persistence-curve">
              <PersistencyCurve data={chartData} activeFilter={activeFilter} />
            </div>

            {/* Secondary charts */}
            <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div id="payer-chart">
                <DropOffByPayer
                  data={lastDataPoint}
                  selectedPayer={activeFilter?.type === 'payer' ? activeFilter.value : null}
                  onPayerClick={(payer) => handleSegmentClick('payer', payer)}
                />
              </div>
              <div id="brand-chart">
                <BrandPersistency
                  data={lastDataPoint}
                  selectedBrand={activeFilter?.type === 'brand' ? activeFilter.value : null}
                  onBrandClick={(brand) => handleSegmentClick('brand', brand)}
                />
              </div>
            </section>

            {/* Drilldown */}
            <DrilldownTabs data={chartData} activeFilter={activeFilter} />
          </div>

          {/* AI Insights sidebar */}
          <div className="lg:col-span-1">
            <div className="lg:sticky lg:top-[160px]">
              <AIInsights kpis={kpis} lastDataPoint={lastDataPoint} />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t pt-6 pb-8 text-center">
          <p className="text-xs text-muted-foreground">
            Built with synthetic claims data · 100K patient cohort · Not real patient data
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default Dashboard;
