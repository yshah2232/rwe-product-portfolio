import { useState, useMemo, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  ReferenceLine,
} from 'recharts';
import type { ActiveFilter, CohortResult } from '@/data/csvDataService';
import { getSegmentPersistenceRate, PAYER_COLORS, BRAND_COLORS } from '@/data/csvDataService';
import ChartWrapper from './ChartWrapper';

interface DrilldownTabsProps {
  cohort: CohortResult;
  activeFilter?: ActiveFilter | null;
}

const TIME_POINTS = [0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330, 365];

const formatDay = (day: number) => {
  if (day === 0) return 'Start';
  return `${Math.round(day / 30)}mo`;
};

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border bg-card p-3 shadow-lg text-card-foreground">
      <p className="text-sm font-medium mb-1">
        {label === 0 ? 'Start' : `${Math.round(label / 30)} months`}
      </p>
      {payload.map((entry: any, i: number) => (
        <p key={i} className="text-sm" style={{ color: entry.color }}>
          {entry.name}: {typeof entry.value === 'number' ? entry.value.toFixed(1) : entry.value}%
        </p>
      ))}
    </div>
  );
};

type TabType = 'payer' | 'brand';

const DrilldownTabs = ({ cohort, activeFilter }: DrilldownTabsProps) => {
  const [activeTab, setActiveTab] = useState<TabType>('payer');

  useEffect(() => {
    if (activeFilter && (activeFilter.type === 'payer' || activeFilter.type === 'brand')) {
      setActiveTab(activeFilter.type);
    }
  }, [activeFilter]);

  const payers = useMemo(() => cohort.byPayer.map((s) => s.name), [cohort]);
  const brands = useMemo(() => cohort.byBrand.map((s) => s.name), [cohort]);

  const payerData = useMemo(
    () => TIME_POINTS.map((day) => ({
      day,
      ...Object.fromEntries(payers.map((p) => [p, +(getSegmentPersistenceRate('payer', p, day) * 100).toFixed(1)])),
    })),
    [payers],
  );

  const brandData = useMemo(
    () => TIME_POINTS.map((day) => ({
      day,
      ...Object.fromEntries(brands.map((b) => [b, +(getSegmentPersistenceRate('brand', b, day) * 100).toFixed(1)])),
    })),
    [brands],
  );

  const getInsight = (tab: TabType): string => {
    const segments = tab === 'payer' ? payers : brands;
    const last = tab === 'payer' ? payerData[payerData.length - 1] : brandData[brandData.length - 1];
    if (!last || segments.length === 0) return '';
    const rates = segments.map((s) => ({ name: s, rate: (last as any)[s] as number }));
    rates.sort((a, b) => b.rate - a.rate);
    const best = rates[0];
    const worst = rates[rates.length - 1];
    if (tab === 'payer') {
      return `${best.name} patients show consistently higher persistence across the entire observation period at ${best.rate.toFixed(0)}%, while ${worst.name} patients fall to ${worst.rate.toFixed(0)}%. This gap suggests cost-related barriers compound over time.`;
    }
    return `${best.name} maintains the highest retention curve at ${best.rate.toFixed(0)}%, while ${worst.name} drops to ${worst.rate.toFixed(0)}%. Differentiation becomes more pronounced after 6 months.`;
  };

  const renderChart = (chartData: any[], lines: { key: string; color: string }[]) => {
    const highlightedKey = activeFilter?.type === activeTab ? activeFilter.value : null;
    return (
      <ResponsiveContainer width="100%" height={350}>
        <LineChart data={chartData} margin={{ top: 5, right: 10, bottom: 20, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 13%, 91%)" />
          <XAxis dataKey="day" ticks={TIME_POINTS} tickFormatter={formatDay} stroke="hsl(220, 9%, 46%)" fontSize={11} tickLine={false}
            label={{ value: 'Time since first prescription', position: 'insideBottom', offset: -12, fontSize: 11, fill: 'hsl(220, 9%, 46%)' }} />
          <YAxis domain={[0, 100]} tickFormatter={(v: number) => `${v}%`} stroke="hsl(220, 9%, 46%)" fontSize={11} tickLine={false} axisLine={false}
            label={{ value: 'Patients still on therapy', angle: -90, position: 'insideLeft', offset: 15, fontSize: 11, fill: 'hsl(220, 9%, 46%)' }} />
          <Tooltip content={<CustomTooltip />} />
          <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '8px' }} iconType="line" />
          <ReferenceLine x={90} stroke="hsl(220, 9%, 80%)" strokeDasharray="4 4" />
          {lines.map((line) => (
            <Line key={line.key} type="monotone" dataKey={line.key} name={line.key} stroke={line.color}
              strokeWidth={highlightedKey === line.key ? 3 : highlightedKey ? 1 : 2}
              strokeOpacity={highlightedKey && highlightedKey !== line.key ? 0.3 : 1}
              dot={false} activeDot={{ r: 4 }} />
          ))}
        </LineChart>
      </ResponsiveContainer>
    );
  };

  const csvExportData = useMemo(() => {
    const data = activeTab === 'payer' ? payerData : brandData;
    const segments = activeTab === 'payer' ? payers : brands;
    return {
      headers: ['Day', ...segments],
      rows: data.map((row) => [row.day, ...segments.map((s) => (row as any)[s])] as (string | number)[]),
    };
  }, [activeTab, payerData, brandData, payers, brands]);

  return (
    <ChartWrapper
      title="Segmented Persistence Analysis"
      subtitle="Compare how different patient groups stay on therapy over time"
      insight={getInsight(activeTab)}
      csvData={csvExportData}
    >
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as TabType)}>
        <TabsList className="mb-4">
          <TabsTrigger value="payer">By Payer</TabsTrigger>
          <TabsTrigger value="brand">By Brand</TabsTrigger>
        </TabsList>
        <TabsContent value="payer">
          {renderChart(
            payerData,
            payers.map((p) => ({ key: p, color: PAYER_COLORS[p] || '#6B7280' })),
          )}
        </TabsContent>
        <TabsContent value="brand">
          {renderChart(
            brandData,
            brands.map((b) => ({ key: b, color: BRAND_COLORS[b] || '#6B7280' })),
          )}
        </TabsContent>
      </Tabs>
    </ChartWrapper>
  );
};

export default DrilldownTabs;
