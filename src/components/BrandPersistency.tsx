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
import { BRANDS, BRAND_COLORS } from '@/data/syntheticData';

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
        {payload[0].value.toFixed(1)}% Active
      </p>
    </div>
  );
};

const BrandPersistency = ({ data }: BrandPersistencyProps) => {
  const chartData = BRANDS.map((brand) => ({
    name: brand,
    activeRate: +(data.byBrand[brand].activeRate * 100).toFixed(1),
    color: BRAND_COLORS[brand],
  }));

  return (
    <div className="rounded-xl border bg-card p-4 md:p-6 shadow-sm">
      <h3 className="text-lg font-semibold text-foreground mb-0.5">Brand Level Persistency</h3>
      <p className="text-sm text-muted-foreground mb-4">Active rate by GLP-1 brand</p>
      <ResponsiveContainer width="100%" height={280}>
        <BarChart data={chartData} layout="vertical" margin={{ top: 5, right: 20, bottom: 5, left: 10 }}>
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
          <Bar dataKey="activeRate" radius={[0, 6, 6, 0]} maxBarSize={32}>
            {chartData.map((entry, i) => (
              <Cell key={i} fill={entry.color} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default BrandPersistency;
