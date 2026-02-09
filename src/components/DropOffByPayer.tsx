import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import type { DailySnapshot } from '@/data/syntheticData';
import { PAYERS, PAYER_COLORS } from '@/data/syntheticData';

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
        {payload[0].value.toFixed(1)}% Drop Off
      </p>
    </div>
  );
};

const DropOffByPayer = ({ data }: DropOffByPayerProps) => {
  const chartData = PAYERS.map((payer) => ({
    name: payer,
    dropOffRate: +(data.byPayer[payer].dropOffRate * 100).toFixed(1),
    color: PAYER_COLORS[payer],
  }));

  return (
    <div className="rounded-xl border bg-card p-4 md:p-6 shadow-sm">
      <h3 className="text-lg font-semibold text-foreground mb-0.5">Drop Off by Payer</h3>
      <p className="text-sm text-muted-foreground mb-4">Discontinuation rate by payer type</p>
      <ResponsiveContainer width="100%" height={280}>
        <BarChart data={chartData} margin={{ top: 5, right: 10, bottom: 5, left: -10 }}>
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
          <Bar dataKey="dropOffRate" radius={[6, 6, 0, 0]} maxBarSize={56}>
            {chartData.map((entry, i) => (
              <Cell key={i} fill={entry.color} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default DropOffByPayer;
