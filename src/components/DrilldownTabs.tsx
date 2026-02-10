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
import type { DailySnapshot } from '@/data/syntheticData';
import type { ActiveFilter } from '@/data/syntheticData';
import {
  BRANDS,
  PAYERS,
  INDICATIONS,
  BRAND_COLORS,
  PAYER_COLORS,
  INDICATION_COLORS,
} from '@/data/syntheticData';
import ChartWrapper from './ChartWrapper';

interface DrilldownTabsProps {
  data: DailySnapshot[];
  activeFilter?: ActiveFilter | null;
}

const MONTH_TICKS = [0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330, 365];

const formatDay = (day: number) => {
  if (day === 0) return 'Start';
  const month = Math.round(day / 30);
  return `${month}mo`;
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

type TabType = 'payer' | 'brand' | 'indication';

const TAB_INSIGHTS: Record<TabType, (data: DailySnapshot[]) => string> = {
  payer: (data) => {
    if (data.length < 2) return '';
    const last = data[data.length - 1];
    const rates = PAYERS.map((p) => ({ name: p, rate: last.byPayer[p].activeRate }));
    rates.sort((a, b) => b.rate - a.rate);
    return `${rates[0].name} patients show consistently higher persistence across the entire observation period, while ${rates[rates.length - 1].name} patients diverge early and continue declining faster. This gap widens over time, suggesting that cost-related barriers compound.`;
  },
  brand: (data) => {
    if (data.length < 2) return '';
    const last = data[data.length - 1];
    const rates = BRANDS.map((b) => ({ name: b, rate: last.byBrand[b].activeRate }));
    rates.sort((a, b) => b.rate - a.rate);
    return `${rates[0].name} maintains the highest retention curve throughout, though all brands show similar early drop-off patterns in the first 90 days. Differentiation becomes more pronounced after 6 months, where ${rates[rates.length - 1].name} falls below ${(rates[rates.length - 1].rate * 100).toFixed(0)}%.`;
  },
  indication: (data) => {
    if (data.length < 2) return '';
    const last = data[data.length - 1];
    const rates = INDICATIONS.map((i) => ({ name: i, rate: last.byIndication[i].activeRate }));
    rates.sort((a, b) => b.rate - a.rate);
    return `Patients prescribed for ${rates[0].name} show the strongest persistence at ${(rates[0].rate * 100).toFixed(0)}%, likely driven by medical necessity. ${rates[rates.length - 1].name} patients drop off fastest, suggesting elective use patterns and potentially lower perceived urgency.`;
  },
};

const DrilldownTabs = ({ data, activeFilter }: DrilldownTabsProps) => {
  const [activeTab, setActiveTab] = useState<TabType>('payer');

  // Auto-switch tab to match active filter type
  useEffect(() => {
    if (activeFilter) {
      setActiveTab(activeFilter.type as TabType);
    }
  }, [activeFilter]);

  const payerData = useMemo(
    () =>
      data.map((d) => ({
        day: d.day,
        ...Object.fromEntries(
          PAYERS.map((p) => [p, +(d.byPayer[p].activeRate * 100).toFixed(1)]),
        ),
      })),
    [data],
  );

  const brandData = useMemo(
    () =>
      data.map((d) => ({
        day: d.day,
        ...Object.fromEntries(
          BRANDS.map((b) => [b, +(d.byBrand[b].activeRate * 100).toFixed(1)]),
        ),
      })),
    [data],
  );

  const indicationData = useMemo(
    () =>
      data.map((d) => ({
        day: d.day,
        ...Object.fromEntries(
          INDICATIONS.map((ind) => [ind, +(d.byIndication[ind].activeRate * 100).toFixed(1)]),
        ),
      })),
    [data],
  );

  const insight = TAB_INSIGHTS[activeTab](data);

  const renderChart = (chartData: any[], lines: { key: string; color: string }[]) => {
    // Determine which line is highlighted based on active filter
    const highlightedKey = activeFilter?.type === activeTab ? activeFilter.value : null;

    return (
      <ResponsiveContainer width="100%" height={350}>
        <LineChart data={chartData} margin={{ top: 5, right: 10, bottom: 20, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 13%, 91%)" />
          <XAxis
            dataKey="day"
            ticks={MONTH_TICKS}
            tickFormatter={formatDay}
            stroke="hsl(220, 9%, 46%)"
            fontSize={11}
            tickLine={false}
            label={{ value: 'Time since first prescription', position: 'insideBottom', offset: -12, fontSize: 11, fill: 'hsl(220, 9%, 46%)' }}
          />
          <YAxis
            domain={[0, 100]}
            tickFormatter={(v: number) => `${v}%`}
            stroke="hsl(220, 9%, 46%)"
            fontSize={11}
            tickLine={false}
            axisLine={false}
            label={{ value: 'Patients still on therapy', angle: -90, position: 'insideLeft', offset: 15, fontSize: 11, fill: 'hsl(220, 9%, 46%)' }}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '8px' }} iconType="line" />
          <ReferenceLine x={90} stroke="hsl(220, 9%, 80%)" strokeDasharray="4 4" />
          {lines.map((line) => (
            <Line
              key={line.key}
              type="monotone"
              dataKey={line.key}
              name={line.key}
              stroke={line.color}
              strokeWidth={highlightedKey === line.key ? 3 : highlightedKey ? 1 : 2}
              strokeOpacity={highlightedKey && highlightedKey !== line.key ? 0.3 : 1}
              dot={false}
              activeDot={{ r: 4 }}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    );
  };

  return (
    <ChartWrapper
      title="Segmented Persistence Analysis"
      subtitle="Compare how different patient groups stay on therapy over time"
      insight={insight}
    >
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as TabType)}>
        <TabsList className="mb-4">
          <TabsTrigger value="payer">By Payer</TabsTrigger>
          <TabsTrigger value="brand">By Brand</TabsTrigger>
          <TabsTrigger value="indication">By Indication</TabsTrigger>
        </TabsList>

        <TabsContent value="payer">
          {renderChart(
            payerData,
            PAYERS.map((p) => ({ key: p, color: PAYER_COLORS[p] })),
          )}
        </TabsContent>

        <TabsContent value="brand">
          {renderChart(
            brandData,
            BRANDS.map((b) => ({ key: b, color: BRAND_COLORS[b] })),
          )}
        </TabsContent>

        <TabsContent value="indication">
          {renderChart(
            indicationData,
            INDICATIONS.map((ind) => ({ key: ind, color: INDICATION_COLORS[ind] })),
          )}
        </TabsContent>
      </Tabs>
    </ChartWrapper>
  );
};

export default DrilldownTabs;
