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
import { PAYERS, PAYER_COLORS } from '@/data/syntheticData';
import ChartWrapper from './ChartWrapper';

interface DropOffByPayerProps {
  data: DailySnapshot;
}

const CustomTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null;
  const entry = payload[0].payload;
  return (
    <div className="rounded-lg border bg-card p-3 shadow-lg text-card-foreground">
      <p className="text-sm font-medium">{entry.name}</p>
      <p className="text-sm font-semibold mt-1" style={{ color: entry.color }}>
        {payload[0].value.toFixed(1)}% stopped therapy
      </p>
    </div>
  );
};

function generateInsight(data: DailySnapshot): string {
  const rates = PAYERS.map((p) => ({
    name: p,
    rate: data.byPayer[p].dropOffRate,
  }));
  rates.sort((a, b) => b.rate - a.rate);
  const highest = rates[0];
  const lowest = rates[rates.length - 1];
  return `${highest.name} patients show the highest discontinuation rate at ${(highest.rate * 100).toFixed(0)}%, while ${lowest.name} patients are most likely to stay on therapy at ${((1 - lowest.rate) * 100).toFixed(0)}% persistence. This ${(highest.rate * 100 - lowest.rate * 100).toFixed(0)} percentage-point gap suggests that coverage and cost barriers significantly influence treatment continuity.`;
}

const DropOffByPayer = ({ data }: DropOffByPayerProps) => {
  const chartData = PAYERS.map((payer) => ({
    name: payer,
    dropOffRate: +(data.byPayer[payer].dropOffRate * 100).toFixed(1),
    color: PAYER_COLORS[payer],
  }));

  const insight = generateInsight(data);

  const csvData = {
    headers: ['Payer Type', 'Discontinuation Rate (%)'],
    rows: chartData.map((d) => [d.name, d.dropOffRate] as (string | number)[]),
  };

  const legendPayload = chartData.map((d) => ({
    value: d.name,
    type: 'square' as const,
    color: d.color,
  }));

  return (
    <ChartWrapper
      title="Discontinuation by Payer Type"
      subtitle="Which payer groups see the most drop-off"
      insight={insight}
      csvData={csvData}
    >
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={chartData} margin={{ top: 15, right: 10, bottom: 5, left: -10 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 13%, 91%)" />
          <XAxis dataKey="name" stroke="hsl(220, 9%, 46%)" fontSize={12} tickLine={false} />
          <YAxis
            domain={[0, 100]}
            tickFormatter={(v: number) => `${v}%`}
            stroke="hsl(220, 9%, 46%)"
            fontSize={12}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend payload={legendPayload} wrapperStyle={{ fontSize: '12px', paddingTop: '12px' }} />
          <Bar dataKey="dropOffRate" radius={[6, 6, 0, 0]} maxBarSize={56}>
            <LabelList dataKey="dropOffRate" position="top" fontSize={11} formatter={(v: number) => `${v}%`} fill="hsl(220, 9%, 46%)" />
            {chartData.map((entry, i) => (
              <Cell key={i} fill={entry.color} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </ChartWrapper>
  );
};

export default DropOffByPayer;
