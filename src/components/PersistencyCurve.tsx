import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import type { DailySnapshot } from '@/data/syntheticData';
import ChartWrapper from './ChartWrapper';

interface PersistencyCurveProps {
  data: DailySnapshot[];
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
      <p className="text-sm font-medium">
        {label === 0 ? 'Start' : `${Math.round(label / 30)} months`} (Day {label})
      </p>
      <p className="text-sm font-semibold mt-1" style={{ color: '#DC2626' }}>
        {payload[0].value.toFixed(1)}% still on therapy
      </p>
    </div>
  );
};

function generateInsight(data: DailySnapshot[]): string {
  if (data.length < 2) return '';
  const day90 = data.find((d) => d.day >= 90);
  const day365 = data[data.length - 1];
  const day90Rate = day90 ? (day90.overall.activeRate * 100).toFixed(0) : 'N/A';
  const endRate = (day365.overall.activeRate * 100).toFixed(0);
  const earlyDrop = data.find((d) => d.day >= 30);
  const earlyDropPct = earlyDrop ? ((1 - earlyDrop.overall.activeRate) * 100).toFixed(0) : 'N/A';

  return `About ${100 - Number(endRate)}% of patients discontinue therapy within the observation period. The steepest drop-off occurs in the first 90 days, where approximately ${earlyDropPct}% of patients have already stopped by month 1 and only ${day90Rate}% remain active at 3 months. This early attrition pattern suggests the greatest intervention opportunity is within the first quarter of treatment.`;
}

const PersistencyCurve = ({ data }: PersistencyCurveProps) => {
  const chartData = data.map((d) => ({
    day: d.day,
    activeRate: +(d.overall.activeRate * 100).toFixed(1),
  }));

  const insight = generateInsight(data);

  const csvData = {
    headers: ['Day', 'Active Rate (%)'],
    rows: chartData.map((d) => [d.day, d.activeRate] as (string | number)[]),
  };

  return (
    <ChartWrapper
      title="Patient Persistence Over Time"
      subtitle="How many patients remain on therapy as time passes"
      insight={insight}
      csvData={csvData}
    >
      <ResponsiveContainer width="100%" height={380}>
        <AreaChart data={chartData} margin={{ top: 5, right: 10, bottom: 20, left: 0 }}>
          <defs>
            <linearGradient id="persistencyGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#DC2626" stopOpacity={0.2} />
              <stop offset="95%" stopColor="#DC2626" stopOpacity={0.01} />
            </linearGradient>
          </defs>
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
          <ReferenceLine x={90} stroke="hsl(220, 9%, 75%)" strokeDasharray="4 4" label={{ value: '3mo', position: 'top', fontSize: 10, fill: 'hsl(220, 9%, 60%)' }} />
          <ReferenceLine x={365} stroke="hsl(220, 9%, 75%)" strokeDasharray="4 4" label={{ value: '12mo', position: 'top', fontSize: 10, fill: 'hsl(220, 9%, 60%)' }} />
          <Area
            type="monotone"
            dataKey="activeRate"
            stroke="#DC2626"
            fill="url(#persistencyGradient)"
            strokeWidth={2.5}
            dot={false}
            activeDot={{ r: 5, fill: '#DC2626', stroke: '#fff', strokeWidth: 2 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </ChartWrapper>
  );
};

export default PersistencyCurve;
