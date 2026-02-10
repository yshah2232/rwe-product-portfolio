import { useMemo } from 'react';
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
import { BRAND_COLORS } from '@/data/csvDataService';
import ChartWrapper from './ChartWrapper';

interface BrandPersistencyProps {
  data: SegmentSnapshot;
  selectedBrand?: string | null;
  onBrandClick?: (brand: string) => void;
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
      <p className="text-xs text-muted-foreground mt-1">{entry.patients.toLocaleString()} patients</p>
      <p className="text-[10px] text-muted-foreground mt-1">Click to filter all charts</p>
    </div>
  );
};

const BrandPersistency = ({ data, selectedBrand, onBrandClick }: BrandPersistencyProps) => {
  const brands = Object.keys(data.byBrand);
  const chartData = brands.map((brand) => ({
    name: brand,
    activeRate: +(data.byBrand[brand].activeRate * 100).toFixed(1),
    patients: data.byBrand[brand].patients,
    color: BRAND_COLORS[brand] || '#6B7280',
  }));

  chartData.sort((a, b) => b.activeRate - a.activeRate);

  const best = chartData[0];
  const worst = chartData[chartData.length - 1];
  const insight = `${best.name} leads in persistence at ${best.activeRate.toFixed(0)}%, while ${worst.name} shows the lowest at ${worst.activeRate.toFixed(0)}%. The ${(best.activeRate - worst.activeRate).toFixed(0)} percentage-point spread across brands may reflect differences in dosing convenience, side-effect profiles, or payer coverage.`;

  const csvData = {
    headers: ['Brand', 'Persistence Rate (%)', 'Patients'],
    rows: chartData.map((d) => [d.name, d.activeRate, d.patients] as (string | number)[]),
  };

  const legendPayload = chartData.map((d) => ({
    value: d.name,
    type: 'square' as const,
    color: d.color,
  }));

  const tableView = useMemo(() => (
    <div className="max-h-[300px] overflow-auto">
      <table className="w-full text-sm">
        <thead className="sticky top-0 bg-card">
          <tr className="border-b">
            <th className="text-left py-2 px-2 font-medium text-muted-foreground">Brand</th>
            <th className="text-right py-2 px-2 font-medium text-muted-foreground">Persistence (%)</th>
            <th className="text-right py-2 px-2 font-medium text-muted-foreground">Patients</th>
          </tr>
        </thead>
        <tbody>
          {chartData.map((d, i) => (
            <tr key={i} className="border-b border-border/30 hover:bg-muted/30">
              <td className="py-1.5 px-2 flex items-center gap-2">
                <span className="w-3 h-3 rounded-sm inline-block" style={{ backgroundColor: d.color }} />
                {d.name}
              </td>
              <td className="py-1.5 px-2 text-right font-medium">{d.activeRate.toFixed(1)}%</td>
              <td className="py-1.5 px-2 text-right">{d.patients.toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  ), [chartData]);

  return (
    <ChartWrapper title="Persistence by Brand" subtitle="Which GLP-1 brands retain patients best" insight={insight} csvData={csvData} tableView={tableView}>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={chartData} layout="vertical" margin={{ top: 5, right: 30, bottom: 5, left: 10 }}
          onClick={(state) => {
            if (state?.activePayload?.[0]?.payload?.name && onBrandClick) {
              onBrandClick(state.activePayload[0].payload.name);
            }
          }}
          style={{ cursor: onBrandClick ? 'pointer' : undefined }}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 13%, 91%)" horizontal={false} />
          <XAxis type="number" domain={[0, 100]} tickFormatter={(v: number) => `${v}%`} stroke="hsl(220, 9%, 46%)" fontSize={12} tickLine={false} />
          <YAxis type="category" dataKey="name" stroke="hsl(220, 9%, 46%)" fontSize={12} width={80} tickLine={false} axisLine={false} />
          <Tooltip content={<CustomTooltip />} />
          <Legend payload={legendPayload} wrapperStyle={{ fontSize: '12px', paddingTop: '12px' }} />
          <Bar dataKey="activeRate" radius={[0, 6, 6, 0]} maxBarSize={32}>
            <LabelList dataKey="activeRate" position="right" fontSize={11} formatter={(v: number) => `${v}%`} fill="hsl(220, 9%, 46%)" />
            {chartData.map((entry, i) => (
              <Cell key={i} fill={entry.color} opacity={selectedBrand && selectedBrand !== entry.name ? 0.25 : 1}
                stroke={selectedBrand === entry.name ? entry.color : 'none'} strokeWidth={selectedBrand === entry.name ? 2 : 0} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </ChartWrapper>
  );
};

export default BrandPersistency;
