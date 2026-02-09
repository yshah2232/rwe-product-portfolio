import { useState, useMemo } from 'react';
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
} from 'recharts';
import type { DailySnapshot } from '@/data/syntheticData';
import {
  BRANDS,
  PAYERS,
  INDICATIONS,
  BRAND_COLORS,
  PAYER_COLORS,
  INDICATION_COLORS,
} from '@/data/syntheticData';

interface DrilldownTabsProps {
  data: DailySnapshot[];
}

const MONTH_TICKS = [0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330, 365];

const formatDay = (day: number) => {
  if (day === 0) return 'Index';
  const month = Math.round(day / 30);
  return `${month}mo`;
};

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border bg-card p-3 shadow-lg text-card-foreground">
      <p className="text-sm font-medium mb-1">
        Day {label} ({formatDay(label)})
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

const DrilldownTabs = ({ data }: DrilldownTabsProps) => {
  const [activeTab, setActiveTab] = useState<TabType>('payer');

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

  const renderChart = (chartData: any[], lines: { key: string; color: string }[]) => (
    <ResponsiveContainer width="100%" height={350}>
      <LineChart data={chartData} margin={{ top: 5, right: 10, bottom: 5, left: -10 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 13%, 91%)" />
        <XAxis
          dataKey="day"
          ticks={MONTH_TICKS}
          tickFormatter={formatDay}
          stroke="hsl(220, 9%, 46%)"
          fontSize={12}
          tickLine={false}
        />
        <YAxis
          domain={[0, 100]}
          tickFormatter={(v: number) => `${v}%`}
          stroke="hsl(220, 9%, 46%)"
          fontSize={12}
          tickLine={false}
          axisLine={false}
        />
        <Tooltip content={<CustomTooltip />} />
        <Legend
          wrapperStyle={{ fontSize: '12px', paddingTop: '8px' }}
          iconType="line"
        />
        {lines.map((line) => (
          <Line
            key={line.key}
            type="monotone"
            dataKey={line.key}
            name={line.key}
            stroke={line.color}
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4 }}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );

  return (
    <div className="rounded-xl border bg-card p-4 md:p-6 shadow-sm">
      <h3 className="text-lg font-semibold text-foreground mb-0.5">Drilldown Analysis</h3>
      <p className="text-sm text-muted-foreground mb-4">
        Persistency curves segmented by different dimensions
      </p>

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
    </div>
  );
};

export default DrilldownTabs;
