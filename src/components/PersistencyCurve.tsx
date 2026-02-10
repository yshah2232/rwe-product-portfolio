import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  LineChart,
  Line,
} from 'recharts';
import type { DailySnapshot } from '@/data/syntheticData';
import type { ActiveFilter } from '@/data/syntheticData';
import ChartWrapper from './ChartWrapper';

interface PersistencyCurveProps {
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
      <p className="text-sm font-medium">
        {label === 0 ? 'Start' : `${Math.round(label / 30)} months`} (Day {label})
      </p>
      {payload.map((entry: any, i: number) => (
        <p key={i} className="text-sm font-semibold mt-1" style={{ color: entry.stroke || entry.color }}>
          {entry.name}: {typeof entry.value === 'number' ? entry.value.toFixed(1) : entry.value}%
        </p>
      ))}
    </div>
  );
};

function getActiveRate(d: DailySnapshot, filter: ActiveFilter): number {
  if (filter.type === 'payer') return d.byPayer[filter.value].activeRate;
  if (filter.type === 'brand') return d.byBrand[filter.value].activeRate;
  return d.byIndication[filter.value].activeRate;
}

function generateInsight(data: DailySnapshot[], filter?: ActiveFilter | null): string {
  if (data.length < 2) return '';
  const getRate = (d: DailySnapshot) => filter ? getActiveRate(d, filter) : d.overall.activeRate;
  const day90 = data.find((d) => d.day >= 90);
  const day365 = data[data.length - 1];
  const day90Rate = day90 ? (getRate(day90) * 100).toFixed(0) : 'N/A';
  const endRate = (getRate(day365) * 100).toFixed(0);
  const earlyDrop = data.find((d) => d.day >= 30);
  const earlyDropPct = earlyDrop ? ((1 - getRate(earlyDrop)) * 100).toFixed(0) : 'N/A';
  const segment = filter ? ` for ${filter.value} patients` : '';

  return `About ${100 - Number(endRate)}% of patients${segment} discontinue therapy within the observation period. The steepest drop-off occurs in the first 90 days, where approximately ${earlyDropPct}% have already stopped by month 1 and only ${day90Rate}% remain active at 3 months.`;
}

const PersistencyCurve = ({ data, activeFilter }: PersistencyCurveProps) => {
  const hasFilter = !!activeFilter;

  // When filtered, show both overall (dimmed) and segment line
  const chartData = data.map((d) => ({
    day: d.day,
    activeRate: +(d.overall.activeRate * 100).toFixed(1),
    ...(hasFilter
      ? { filteredRate: +(getActiveRate(d, activeFilter!) * 100).toFixed(1) }
      : {}),
  }));

  const insight = generateInsight(data, activeFilter);
  const subtitle = hasFilter
    ? `Showing ${activeFilter!.value} vs. overall persistence`
    : 'How many patients remain on therapy as time passes';

  const csvData = {
    headers: hasFilter ? ['Day', 'Overall (%)', `${activeFilter!.value} (%)`] : ['Day', 'Active Rate (%)'],
    rows: chartData.map((d) =>
      hasFilter
        ? [d.day, d.activeRate, (d as any).filteredRate] as (string | number)[]
        : [d.day, d.activeRate] as (string | number)[],
    ),
  };

  if (hasFilter) {
    return (
      <ChartWrapper
        title="Patient Persistence Over Time"
        subtitle={subtitle}
        insight={insight}
        csvData={csvData}
      >
        <ResponsiveContainer width="100%" height={380}>
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
            <ReferenceLine x={90} stroke="hsl(220, 9%, 75%)" strokeDasharray="4 4" label={{ value: '3mo', position: 'top', fontSize: 10, fill: 'hsl(220, 9%, 60%)' }} />
            <Line
              type="monotone"
              dataKey="activeRate"
              name="Overall"
              stroke="hsl(220, 9%, 75%)"
              strokeWidth={1.5}
              strokeDasharray="4 4"
              dot={false}
            />
            <Line
              type="monotone"
              dataKey="filteredRate"
              name={activeFilter!.value}
              stroke="#DC2626"
              strokeWidth={2.5}
              dot={false}
              activeDot={{ r: 5, fill: '#DC2626', stroke: '#fff', strokeWidth: 2 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </ChartWrapper>
    );
  }

  return (
    <ChartWrapper
      title="Patient Persistence Over Time"
      subtitle={subtitle}
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
            name="Overall"
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
