import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
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
import {
  getDailyData,
  aggregateData,
  getKPIs,
  dateToDayNumber,
  type Granularity,
} from '@/data/syntheticData';

const Dashboard = () => {
  const [startDate, setStartDate] = useState('2024-01-01');
  const [endDate, setEndDate] = useState('2024-12-31');
  const [granularity, setGranularity] = useState<Granularity>('weekly');

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
    () => getKPIs(allData, effectiveEndDay),
    [allData, effectiveEndDay],
  );

  const lastDataPoint =
    chartData.length > 0 ? chartData[chartData.length - 1] : allData[allData.length - 1];

  return (
    <div className="min-h-screen bg-background">
      {/* Sticky header */}
      <div className="sticky top-0 z-20 bg-background/95 backdrop-blur-sm border-b">
        <div className="max-w-[1400px] mx-auto px-4 md:px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              to="/"
              className="inline-flex items-center justify-center h-8 w-8 rounded-lg hover:bg-muted transition-colors"
              aria-label="Back to portfolio"
            >
              <ArrowLeft className="h-5 w-5 text-foreground" />
            </Link>
            <div>
              <h1 className="text-xl font-bold text-foreground">GLP-1 Patient Insights</h1>
              <p className="text-xs text-muted-foreground">Real-world therapy persistence analysis</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <GuidedTour />
            <InfoPanel />
          </div>
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
        {/* KPI row */}
        <section className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
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
          />
          <KPICard
            title="Stopped Therapy"
            value={`${(kpis.dropOffRate * 100).toFixed(1)}%`}
            description="Percentage of patients who discontinued treatment."
            detail="Patients with no refill after the expected refill window are considered discontinued. This is the inverse of the 'Still on Therapy' rate."
          />
          <KPICard
            title="Typical Refill Delay"
            value={kpis.medianRefillGap.toFixed(1)}
            suffix=" days"
            description="How late patients usually refill their medication."
            detail="This shows the median number of days between the expected refill date and the actual refill date. Higher values indicate patients are stretching their supply or delaying treatment."
          />
        </section>

        {/* AI Insights */}
        <AIInsights kpis={kpis} lastDataPoint={lastDataPoint} />

        {/* Hero chart */}
        <PersistencyCurve data={chartData} />

        {/* Secondary charts */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <DropOffByPayer data={lastDataPoint} />
          <BrandPersistency data={lastDataPoint} />
        </section>

        {/* Drilldown */}
        <DrilldownTabs data={chartData} />

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
