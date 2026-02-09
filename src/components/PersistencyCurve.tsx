import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import type { DailySnapshot } from '@/data/syntheticData';

interface PersistencyCurveProps {
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
      <p className="text-sm font-medium">
        Day {label} ({formatDay(label)})
      </p>
      <p className="text-sm font-semibold mt-1" style={{ color: '#DC2626' }}>
        {payload[0].value.toFixed(1)}% Active
      </p>
    </div>
  );
};

const PersistencyCurve = ({ data }: PersistencyCurveProps) => {
  const chartData = data.map((d) => ({
    day: d.day,
    activeRate: +(d.overall.activeRate * 100).toFixed(1),
  }));

  return (
    <div className="rounded-xl border bg-card p-4 md:p-6 shadow-sm">
      <h3 className="text-lg font-semibold text-foreground mb-0.5">Persistency Curve</h3>
      <p className="text-sm text-muted-foreground mb-4">
        Percentage of patients remaining active over time since index
      </p>
      <ResponsiveContainer width="100%" height={350}>
        <AreaChart data={chartData} margin={{ top: 5, right: 10, bottom: 5, left: -10 }}>
          <defs>
            <linearGradient id="persistencyGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#DC2626" stopOpacity={0.25} />
              <stop offset="95%" stopColor="#DC2626" stopOpacity={0.02} />
            </linearGradient>
          </defs>
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
    </div>
  );
};

export default PersistencyCurve;
