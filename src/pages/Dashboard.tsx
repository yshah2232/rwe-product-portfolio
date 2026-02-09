import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, BookOpen } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import GlobalControls from '@/components/GlobalControls';
import KPICard from '@/components/KPICard';
import PersistencyCurve from '@/components/PersistencyCurve';
import DropOffByPayer from '@/components/DropOffByPayer';
import BrandPersistency from '@/components/BrandPersistency';
import DrilldownTabs from '@/components/DrilldownTabs';
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
      {/* Sticky header & controls */}
      <div className="sticky top-0 z-20 bg-background/95 backdrop-blur-sm border-b">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center gap-3">
          <Link
            to="/"
            className="inline-flex items-center justify-center h-8 w-8 rounded-lg hover:bg-muted transition-colors"
            aria-label="Back to portfolio"
          >
            <ArrowLeft className="h-5 w-5 text-foreground" />
          </Link>
          <h1 className="text-xl font-bold text-foreground">GLP-1 Pharma Insights</h1>
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
        className="max-w-6xl mx-auto px-4 py-6 space-y-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        {/* KPI row */}
        <section className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
          <KPICard
            title="Total GLP-1 Patients"
            value={kpis.totalPatients.toLocaleString()}
            definition="Unique patients in selected time window"
          />
          <KPICard
            title="Active Rate"
            value={`${(kpis.activeRate * 100).toFixed(1)}%`}
            definition="Percentage of patients still active in selected window"
          />
          <KPICard
            title="Drop Off Rate"
            value={`${(kpis.dropOffRate * 100).toFixed(1)}%`}
            definition="Percentage of patients discontinued in selected window"
          />
          <KPICard
            title="Median Refill Gap"
            value={kpis.medianRefillGap.toFixed(1)}
            suffix=" days"
            definition="Median days between expected and actual refill"
          />
        </section>

        {/* Hero chart */}
        <PersistencyCurve data={chartData} />

        {/* Secondary charts */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <DropOffByPayer data={lastDataPoint} />
          <BrandPersistency data={lastDataPoint} />
        </section>

        {/* Drilldown */}
        <DrilldownTabs data={chartData} />

        {/* Footer link */}
        <div className="border-t pt-6 pb-8 flex justify-center">
          <Link to="/methodology">
            <Button variant="outline" size="lg" className="gap-2">
              <BookOpen className="h-4 w-4" />
              View Methodology &amp; Assumptions
            </Button>
          </Link>
        </div>
      </motion.div>
    </div>
  );
};

export default Dashboard;
