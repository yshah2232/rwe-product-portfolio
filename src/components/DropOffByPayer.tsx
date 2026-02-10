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
import type { SegmentSnapshot } from '@/data/csvDataService';
import { PAYER_COLORS } from '@/data/csvDataService';
import ChartWrapper from './ChartWrapper';

interface DropOffByPayerProps {
  data: SegmentSnapshot;
  selectedPayer?: string | null;
  onPayerClick?: (payer: string) => void;
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
      <p className="text-xs text-muted-foreground mt-1">{entry.patients.toLocaleString()} patients</p>
      <p className="text-[10px] text-muted-foreground mt-1">Click to filter all charts</p>
    </div>
  );
};

const DropOffByPayer = ({ data, selectedPayer, onPayerClick }: DropOffByPayerProps) => {
  const payers = Object.keys(data.byPayer);
  const chartData = payers.map((payer) => ({
    name: payer,
    dropOffRate: +(data.byPayer[payer].dropOffRate * 100).toFixed(1),
    patients: data.byPayer[payer].patients,
    color: PAYER_COLORS[payer] || '#6B7280',
  }));

  // Sort by drop-off rate descending
  chartData.sort((a, b) => b.dropOffRate - a.dropOffRate);

  const highest = chartData[0];
  const lowest = chartData[chartData.length - 1];
  const insight = `${highest.name} patients show the highest discontinuation rate at ${highest.dropOffRate.toFixed(0)}%, while ${lowest.name} patients are most likely to stay on therapy at ${(100 - lowest.dropOffRate).toFixed(0)}% persistence. This ${(highest.dropOffRate - lowest.dropOffRate).toFixed(0)} percentage-point gap suggests that coverage and cost barriers significantly influence treatment continuity.`;

  const csvData = {
    headers: ['Payer Type', 'Discontinuation Rate (%)', 'Patients'],
    rows: chartData.map((d) => [d.name, d.dropOffRate, d.patients] as (string | number)[]),
  };

  const legendPayload = chartData.map((d) => ({
    value: d.name,
    type: 'square' as const,
    color: d.color,
  }));

  return (
    <ChartWrapper title="Discontinuation by Payer Type" subtitle="Which payer groups see the most drop-off" insight={insight} csvData={csvData}>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={chartData} margin={{ top: 15, right: 10, bottom: 5, left: -10 }}
          onClick={(state) => {
            if (state?.activePayload?.[0]?.payload?.name && onPayerClick) {
              onPayerClick(state.activePayload[0].payload.name);
            }
          }}
          style={{ cursor: onPayerClick ? 'pointer' : undefined }}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 13%, 91%)" />
          <XAxis dataKey="name" stroke="hsl(220, 9%, 46%)" fontSize={12} tickLine={false} />
          <YAxis domain={[0, 100]} tickFormatter={(v: number) => `${v}%`} stroke="hsl(220, 9%, 46%)" fontSize={12} tickLine={false} axisLine={false} />
          <Tooltip content={<CustomTooltip />} />
          <Legend payload={legendPayload} wrapperStyle={{ fontSize: '12px', paddingTop: '12px' }} />
          <Bar dataKey="dropOffRate" radius={[6, 6, 0, 0]} maxBarSize={56}>
            <LabelList dataKey="dropOffRate" position="top" fontSize={11} formatter={(v: number) => `${v}%`} fill="hsl(220, 9%, 46%)" />
            {chartData.map((entry, i) => (
              <Cell key={i} fill={entry.color} opacity={selectedPayer && selectedPayer !== entry.name ? 0.25 : 1}
                stroke={selectedPayer === entry.name ? entry.color : 'none'} strokeWidth={selectedPayer === entry.name ? 2 : 0} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </ChartWrapper>
  );
};

export default DropOffByPayer;
