import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  Legend,
  LabelList,
} from 'recharts';
import type { DailySnapshot } from '@/data/syntheticData';
import { BRANDS, BRAND_COLORS } from '@/data/syntheticData';
import ChartWrapper from './ChartWrapper';

interface BrandPersistencyProps {
  data: DailySnapshot;
}

const CustomTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null;
  const entry = payload[0].payload;
  return (
    <div className="rounded-lg border bg-card p-3 shadow-lg text-card-foreground">
      <p className="text-sm font-medium">{entry.name}</p>
      <p className="text-sm font-semibold mt-1" style={{ color: entry.color }}>
        {payload[0].value.toFixed(1)}% still on therapy
      </p>
    </div>
  );
};

function generateInsight(data: DailySnapshot): string {
  const rates = BRANDS.map((b) => ({
    name: b,
    rate: data.byBrand[b].activeRate,
  }));
  rates.sort((a, b) => b.rate - a.rate);
  const best = rates[0];
  const worst = rates[rates.length - 1];
  return `${best.name} leads in persistence at ${(best.rate * 100).toFixed(0)}%, while ${worst.name} shows the lowest at ${(worst.rate * 100).toFixed(0)}%. The ${(best.rate * 100 - worst.rate * 100).toFixed(0)} percentage-point spread across brands may reflect differences in dosing convenience, side-effect profiles, or payer coverage.`;
}

const BrandPersistency = ({ data }: BrandPersistencyProps) => {
  const chartData = BRANDS.map((brand) => ({
    name: brand,
    activeRate: +(data.byBrand[brand].activeRate * 100).toFixed(1),
    color: BRAND_COLORS[brand],
  }));

  const insight = generateInsight(data);

  const csvData = {
    headers: ['Brand', 'Persistence Rate (%)'],
    rows: chartData.map((d) => [d.name, d.activeRate] as (string | number)[]),
  };

  const legendPayload = chartData.map((d) => ({
    value: d.name,
    type: 'square' as const,
    color: d.color,
  }));

  return (
    <ChartWrapper
      title="Persistence by Brand"
      subtitle="Which GLP-1 brands retain patients best"
      insight={insight}
      csvData={csvData}
    >
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={chartData} layout="vertical" margin={{ top: 5, right: 30, bottom: 5, left: 10 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 13%, 91%)" horizontal={false} />
          <XAxis
            type="number"
            domain={[0, 100]}
            tickFormatter={(v: number) => `${v}%`}
            stroke="hsl(220, 9%, 46%)"
            fontSize={12}
            tickLine={false}
          />
          <YAxis
            type="category"
            dataKey="name"
            stroke="hsl(220, 9%, 46%)"
            fontSize={12}
            width={80}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend payload={legendPayload} wrapperStyle={{ fontSize: '12px', paddingTop: '12px' }} />
          <Bar dataKey="activeRate" radius={[0, 6, 6, 0]} maxBarSize={32}>
            <LabelList dataKey="activeRate" position="right" fontSize={11} formatter={(v: number) => `${v}%`} fill="hsl(220, 9%, 46%)" />
            {chartData.map((entry, i) => (
              <Cell key={i} fill={entry.color} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </ChartWrapper>
  );
};

export default BrandPersistency;
