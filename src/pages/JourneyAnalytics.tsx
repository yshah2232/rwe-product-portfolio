import { useMemo, useState } from 'react';
import { useWorld } from '@/contexts/WorldContext';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import TrustBadge from '@/components/TrustBadge';
import WorldSwitcher from '@/components/WorldSwitcher';
import ChartWrapper from '@/components/ChartWrapper';
import type { TrustInfo } from '@/data/engine/types';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip,
  ResponsiveContainer, Cell, Legend,
  LineChart, Line, ComposedChart, Area, AreaChart,
  LabelList,
} from 'recharts';
import { Activity, Shield, Zap, Waves, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';

// ── Trust configs ──
const TRUST: Record<string, TrustInfo> = {
  sankey: { kind: 'observed', confidence: 92, reason: 'Computed from JOURNEYS lineNumber + discontinueFlag. Direct event observation.' },
  friction: { kind: 'observed', confidence: 88, reason: 'timeToStartDays from JOURNEYS joined with payerSegment from PATIENTS.' },
  stability: { kind: 'inferred', confidence: 78, reason: 'pdcProxy is a modeled adherence proxy. refillGapDays inferred from Rx cadence.' },
  acceleration_glp1: { kind: 'inferred', confidence: 74, reason: 'Early discontinuation derived from lineEndMonth − lineStartMonth ≤ 6 months and discontinueFlag.' },
  acceleration_nsclc: { kind: 'inferred', confidence: 72, reason: 'Metastasis code presence inferred from event frequency patterns. Imaging cadence from lab event counts.' },
  acceleration_alz: { kind: 'inferred', confidence: 70, reason: 'MRI monitoring cadence inferred from lab/imaging event frequency per quarter.' },
};

// ── Custom tooltip matching GLP-1 dashboard style ──
const ChartTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border bg-card p-3 shadow-lg text-card-foreground">
      <p className="text-sm font-medium text-foreground">{label}</p>
      {payload.map((entry: any, i: number) => (
        <p key={i} className="text-sm mt-0.5" style={{ color: entry.color || entry.stroke }}>
          <span className="font-semibold">{typeof entry.value === 'number' ? entry.value.toLocaleString() : entry.value}</span>
          {' '}{entry.name}
        </p>
      ))}
    </div>
  );
};

// ── KPI Card (inline, matching dashboard style) ──
function MiniKPI({ label, value, color = 'text-foreground', sub }: { label: string; value: string; color?: string; sub?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="rounded-xl border border-border/50 bg-card p-4 md:p-5 shadow-sm"
    >
      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{label}</p>
      <p className={`mt-2 text-2xl md:text-3xl font-bold ${color}`}>{value}</p>
      {sub && <p className="mt-1 text-xs text-muted-foreground">{sub}</p>}
    </motion.div>
  );
}

// ═══════════════════════════════════════
// FLOW TAB
// ═══════════════════════════════════════
function FlowTab() {
  const { dataset } = useWorld();
  const data = useMemo(() => {
    if (!dataset) return { sankeyData: [], summary: { total: 0, active: 0, stopped: 0, restarted: 0 } };

    const journeys = dataset.journeys;
    const lineGroups = new Map<number, { active: number; stopped: number; switched: number; restarted: number }>();

    journeys.forEach(j => {
      const ln = Number(j.lineNumber);
      if (!lineGroups.has(ln)) lineGroups.set(ln, { active: 0, stopped: 0, switched: 0, restarted: 0 });
      const g = lineGroups.get(ln)!;
      if (Number(j.discontinueFlag) === 1) g.stopped++;
      else g.active++;
      if (Number(j.switchFlag) === 1) g.switched++;
      if (Number(j.restartFlag) === 1) g.restarted++;
    });

    const sankeyData = Array.from(lineGroups.entries())
      .sort((a, b) => a[0] - b[0])
      .map(([line, counts]) => ({
        name: `Line ${line}`,
        active: counts.active,
        stopped: counts.stopped,
        switched: counts.switched,
        restarted: counts.restarted,
        total: counts.active + counts.stopped,
      }));

    const total = journeys.length;
    const active = journeys.filter(j => Number(j.discontinueFlag) === 0).length;
    const stopped = journeys.filter(j => Number(j.discontinueFlag) === 1).length;
    const restarted = journeys.filter(j => Number(j.restartFlag) === 1).length;

    return { sankeyData, summary: { total, active, stopped, restarted } };
  }, [dataset]);

  if (!dataset) return null;

  if (data.sankeyData.length === 0) {
    return (
      <div className="rounded-xl border border-destructive/50 bg-destructive/5 p-6">
        <p className="text-sm text-destructive font-medium">⚠ JOURNEYS has 0 rows or lineNumber values are missing.</p>
      </div>
    );
  }

  const discRateData = data.sankeyData.map(d => ({
    ...d,
    discRate: d.total > 0 ? +((d.stopped / d.total) * 100).toFixed(1) : 0,
  }));

  const flowInsight = `${data.summary.total.toLocaleString()} total journeys across ${data.sankeyData.length} therapy lines. ${((data.summary.stopped / data.summary.total) * 100).toFixed(0)}% discontinued, ${((data.summary.active / data.summary.total) * 100).toFixed(0)}% remain active. ${data.summary.restarted} patients restarted therapy after initial discontinuation.`;

  const csvData = {
    headers: ['Line', 'Active', 'Stopped', 'Switched', 'Restarted', 'Total'],
    rows: data.sankeyData.map(d => [d.name, d.active, d.stopped, d.switched, d.restarted, d.total] as (string | number)[]),
  };

  const tableView = (
    <div className="max-h-[380px] overflow-auto">
      <table className="w-full text-sm">
        <thead className="sticky top-0 bg-card">
          <tr className="border-b">
            <th className="text-left py-2 px-2 font-medium text-muted-foreground">Line</th>
            <th className="text-right py-2 px-2 font-medium text-muted-foreground">Active</th>
            <th className="text-right py-2 px-2 font-medium text-muted-foreground">Stopped</th>
            <th className="text-right py-2 px-2 font-medium text-muted-foreground">Switched</th>
            <th className="text-right py-2 px-2 font-medium text-muted-foreground">Restarted</th>
            <th className="text-right py-2 px-2 font-medium text-muted-foreground">Disc. Rate</th>
          </tr>
        </thead>
        <tbody>
          {discRateData.map((d, i) => (
            <tr key={i} className="border-b border-border/30 hover:bg-muted/30">
              <td className="py-1.5 px-2 font-medium">{d.name}</td>
              <td className="py-1.5 px-2 text-right text-emerald-600">{d.active.toLocaleString()}</td>
              <td className="py-1.5 px-2 text-right text-rose-600">{d.stopped.toLocaleString()}</td>
              <td className="py-1.5 px-2 text-right">{d.switched.toLocaleString()}</td>
              <td className="py-1.5 px-2 text-right">{d.restarted.toLocaleString()}</td>
              <td className="py-1.5 px-2 text-right font-semibold">{d.discRate}%</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        <MiniKPI label="Total Journeys" value={data.summary.total.toLocaleString()} />
        <MiniKPI label="Active (On Therapy)" value={data.summary.active.toLocaleString()} color="text-emerald-600" sub={`${((data.summary.active / data.summary.total) * 100).toFixed(1)}%`} />
        <MiniKPI label="Stopped" value={data.summary.stopped.toLocaleString()} color="text-rose-600" sub={`${((data.summary.stopped / data.summary.total) * 100).toFixed(1)}%`} />
        <MiniKPI label="Restarted" value={data.summary.restarted.toLocaleString()} color="text-amber-500" />
      </div>

      <ChartWrapper title="Patient Flow by Line of Therapy" subtitle="How patients distribute across therapy lines and their end state" insight={flowInsight} csvData={csvData} tableView={tableView}>
        <ResponsiveContainer width="100%" height={380}>
          <BarChart data={data.sankeyData} barCategoryGap="20%">
            <defs>
              <linearGradient id="activeGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="hsl(142, 71%, 45%)" stopOpacity={0.9} />
                <stop offset="100%" stopColor="hsl(142, 71%, 45%)" stopOpacity={0.7} />
              </linearGradient>
              <linearGradient id="stoppedGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="hsl(0, 84%, 60%)" stopOpacity={0.9} />
                <stop offset="100%" stopColor="hsl(0, 84%, 60%)" stopOpacity={0.7} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 13%, 91%)" />
            <XAxis dataKey="name" tick={{ fontSize: 12 }} stroke="hsl(220, 9%, 46%)" tickLine={false} />
            <YAxis tick={{ fontSize: 12 }} stroke="hsl(220, 9%, 46%)" tickLine={false} axisLine={false} />
            <RechartsTooltip content={<ChartTooltip />} />
            <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '12px' }} />
            <Bar dataKey="active" stackId="a" fill="url(#activeGrad)" name="Active" radius={[0, 0, 0, 0]} />
            <Bar dataKey="stopped" stackId="a" fill="url(#stoppedGrad)" name="Stopped" radius={[4, 4, 0, 0]} />
            <Bar dataKey="restarted" stackId="b" fill="hsl(38, 92%, 50%)" name="Restarted" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </ChartWrapper>

      <ChartWrapper
        title="Discontinuation Rate by Line"
        subtitle="Percentage of patients who discontinued on each therapy line"
        insight={`Discontinuation rates ${discRateData.length > 1 ? `range from ${Math.min(...discRateData.map(d => d.discRate)).toFixed(0)}% to ${Math.max(...discRateData.map(d => d.discRate)).toFixed(0)}%` : 'shown'} across therapy lines. Higher lines typically show increased discontinuation as patients exhaust treatment options.`}
      >
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={discRateData}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 13%, 91%)" />
            <XAxis dataKey="name" tick={{ fontSize: 12 }} stroke="hsl(220, 9%, 46%)" tickLine={false} />
            <YAxis tick={{ fontSize: 12 }} stroke="hsl(220, 9%, 46%)" tickLine={false} axisLine={false} tickFormatter={v => `${v}%`} />
            <RechartsTooltip formatter={(v: number) => [`${v.toFixed(1)}%`, 'Disc. Rate']} contentStyle={{ borderRadius: 8, border: '1px solid hsl(220,13%,91%)', fontSize: 12 }} />
            <Bar dataKey="discRate" radius={[6, 6, 0, 0]} maxBarSize={56} name="Disc. Rate">
              <LabelList dataKey="discRate" position="top" fontSize={11} formatter={(v: number) => `${v}%`} fill="hsl(220, 9%, 46%)" />
              {discRateData.map((entry, i) => (
                <Cell key={i} fill={entry.discRate > 40 ? 'hsl(0, 84%, 60%)' : entry.discRate > 25 ? 'hsl(38, 92%, 50%)' : 'hsl(142, 71%, 45%)'} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </ChartWrapper>
    </div>
  );
}

// ═══════════════════════════════════════
// FRICTION TAB
// ═══════════════════════════════════════
function FrictionTab() {
  const { dataset } = useWorld();
  const [authOnly, setAuthOnly] = useState(false);

  const data = useMemo(() => {
    if (!dataset) return { byPayer: [], byState: [], histogram: [] };

    const patientMap = new Map(dataset.patients.map(p => [p.patientId, p]));
    const journeys = dataset.journeys;

    const payerBuckets: Record<string, number[]> = {};
    const stateBuckets: Record<string, number[]> = {};

    journeys.forEach(j => {
      const patient = patientMap.get(j.patientId);
      if (!patient) return;
      const tts = Number(j.timeToStartDays);
      if (tts === 0 && authOnly) return;

      const payer = patient.payerSegment || 'Unknown';
      if (!payerBuckets[payer]) payerBuckets[payer] = [];
      payerBuckets[payer].push(tts);

      const state = patient.state || 'Unknown';
      if (!stateBuckets[state]) stateBuckets[state] = [];
      stateBuckets[state].push(tts);
    });

    const byPayer = Object.entries(payerBuckets).map(([payer, vals]) => {
      const sorted = [...vals].sort((a, b) => a - b);
      return {
        payer,
        median: sorted[Math.floor(sorted.length / 2)] || 0,
        mean: Math.round(vals.reduce((a, b) => a + b, 0) / vals.length),
        p75: sorted[Math.floor(sorted.length * 0.75)] || 0,
        count: vals.length,
      };
    }).sort((a, b) => b.median - a.median);

    const topStates = Object.entries(stateBuckets)
      .sort((a, b) => b[1].length - a[1].length)
      .slice(0, 10)
      .map(([state, vals]) => {
        const sorted = [...vals].sort((a, b) => a - b);
        return {
          state,
          median: sorted[Math.floor(sorted.length / 2)] || 0,
          count: vals.length,
        };
      });

    const allTts = journeys.map(j => Number(j.timeToStartDays));
    const buckets: Record<string, number> = {};
    allTts.forEach(t => {
      const bucket = `${Math.floor(t / 15) * 15}-${Math.floor(t / 15) * 15 + 14}`;
      buckets[bucket] = (buckets[bucket] || 0) + 1;
    });
    const histogram = Object.entries(buckets)
      .sort((a, b) => parseInt(a[0]) - parseInt(b[0]))
      .map(([range, count]) => ({ range, count }));

    return { byPayer, byState: topStates, histogram };
  }, [dataset, authOnly]);

  if (!dataset) return null;

  const payerInsight = data.byPayer.length > 0
    ? `${data.byPayer[0].payer} shows the highest median time-to-start at ${data.byPayer[0].median} days, suggesting more friction in treatment initiation. ${data.byPayer[data.byPayer.length - 1]?.payer || 'Other'} has the shortest wait at ${data.byPayer[data.byPayer.length - 1]?.median || 0} days.`
    : '';

  const payerCsv = {
    headers: ['Payer', 'Median Days', '75th %ile', 'Patients'],
    rows: data.byPayer.map(d => [d.payer, d.median, d.p75, d.count] as (string | number)[]),
  };

  const payerTable = (
    <div className="max-h-[300px] overflow-auto">
      <table className="w-full text-sm">
        <thead className="sticky top-0 bg-card">
          <tr className="border-b">
            <th className="text-left py-2 px-2 font-medium text-muted-foreground">Payer</th>
            <th className="text-right py-2 px-2 font-medium text-muted-foreground">Median</th>
            <th className="text-right py-2 px-2 font-medium text-muted-foreground">75th %</th>
            <th className="text-right py-2 px-2 font-medium text-muted-foreground">Patients</th>
          </tr>
        </thead>
        <tbody>
          {data.byPayer.map((d, i) => (
            <tr key={i} className="border-b border-border/30 hover:bg-muted/30">
              <td className="py-1.5 px-2 font-medium">{d.payer}</td>
              <td className="py-1.5 px-2 text-right">{d.median}d</td>
              <td className="py-1.5 px-2 text-right">{d.p75}d</td>
              <td className="py-1.5 px-2 text-right text-muted-foreground">{d.count.toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  const PAYER_COLORS: Record<string, string> = {
    Commercial: 'hsl(221, 83%, 53%)',
    Medicare: 'hsl(142, 71%, 45%)',
    Medicaid: 'hsl(38, 92%, 50%)',
    Cash: 'hsl(0, 84%, 60%)',
    CashOrOther: 'hsl(0, 84%, 60%)',
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 rounded-lg bg-muted/30 border border-border/40 px-4 py-3">
        <Switch id="auth-filter" checked={authOnly} onCheckedChange={setAuthOnly} />
        <Label htmlFor="auth-filter" className="text-sm text-muted-foreground">
          Show only patients with non-zero time-to-start (authorization friction proxy)
        </Label>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        <MiniKPI label="Avg Time-to-Start" value={`${data.byPayer.length > 0 ? Math.round(data.byPayer.reduce((s, d) => s + d.mean, 0) / data.byPayer.length) : 0}d`} />
        <MiniKPI label="Payer Segments" value={String(data.byPayer.length)} />
        <MiniKPI label="States Analyzed" value={String(data.byState.length)} />
        <MiniKPI label="Patients" value={data.byPayer.reduce((s, d) => s + d.count, 0).toLocaleString()} />
      </div>

      <ChartWrapper title="Time-to-Start by Payer Segment" subtitle="Median days from diagnosis to first therapy, grouped by payer" insight={payerInsight} csvData={payerCsv} tableView={payerTable}>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data.byPayer} layout="vertical" barCategoryGap="25%">
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 13%, 91%)" horizontal={false} />
            <XAxis type="number" tick={{ fontSize: 12 }} stroke="hsl(220, 9%, 46%)" tickLine={false} label={{ value: 'Days', position: 'insideBottomRight', offset: -5, fontSize: 11, fill: 'hsl(220, 9%, 46%)' }} />
            <YAxis dataKey="payer" type="category" width={100} tick={{ fontSize: 12 }} stroke="hsl(220, 9%, 46%)" tickLine={false} axisLine={false} />
            <RechartsTooltip content={<ChartTooltip />} />
            <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '12px' }} />
            <Bar dataKey="median" fill="hsl(262, 60%, 50%)" name="Median" radius={[0, 6, 6, 0]} maxBarSize={32}>
              <LabelList dataKey="median" position="right" fontSize={11} formatter={(v: number) => `${v}d`} fill="hsl(220, 9%, 46%)" />
            </Bar>
            <Bar dataKey="p75" fill="hsl(173, 80%, 40%)" name="75th %ile" radius={[0, 6, 6, 0]} maxBarSize={32} />
          </BarChart>
        </ResponsiveContainer>
      </ChartWrapper>

      <ChartWrapper title="Time-to-Start by State (Top 10)" subtitle="Top 10 states by patient volume with median days to first treatment" insight={`Geographic variation in treatment initiation. ${data.byState[0]?.state || 'Top state'} shows ${data.byState[0]?.median || 0} day median wait.`}>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data.byState}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 13%, 91%)" />
            <XAxis dataKey="state" tick={{ fontSize: 12 }} stroke="hsl(220, 9%, 46%)" tickLine={false} />
            <YAxis tick={{ fontSize: 12 }} stroke="hsl(220, 9%, 46%)" tickLine={false} axisLine={false} label={{ value: 'Days', angle: -90, position: 'insideLeft', offset: 15, fontSize: 11, fill: 'hsl(220, 9%, 46%)' }} />
            <RechartsTooltip content={<ChartTooltip />} />
            <Bar dataKey="median" fill="hsl(221, 83%, 53%)" radius={[6, 6, 0, 0]} maxBarSize={40} name="Median TTS">
              <LabelList dataKey="median" position="top" fontSize={10} formatter={(v: number) => `${v}d`} fill="hsl(220, 9%, 46%)" />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </ChartWrapper>

      <ChartWrapper title="Time-to-Start Distribution" subtitle="How many days patients wait between diagnosis and therapy initiation">
        <ResponsiveContainer width="100%" height={260}>
          <AreaChart data={data.histogram}>
            <defs>
              <linearGradient id="histGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(262, 60%, 50%)" stopOpacity={0.2} />
                <stop offset="95%" stopColor="hsl(262, 60%, 50%)" stopOpacity={0.01} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 13%, 91%)" />
            <XAxis dataKey="range" tick={{ fontSize: 10 }} stroke="hsl(220, 9%, 46%)" tickLine={false} angle={-30} textAnchor="end" height={50} />
            <YAxis tick={{ fontSize: 12 }} stroke="hsl(220, 9%, 46%)" tickLine={false} axisLine={false} />
            <RechartsTooltip formatter={(v: number) => [v.toLocaleString(), 'Patients']} contentStyle={{ borderRadius: 8, border: '1px solid hsl(220,13%,91%)', fontSize: 12 }} />
            <Area type="monotone" dataKey="count" stroke="hsl(262, 60%, 50%)" fill="url(#histGrad)" strokeWidth={2.5} dot={false}
              activeDot={{ r: 5, fill: 'hsl(262, 60%, 50%)', stroke: '#fff', strokeWidth: 2 }} name="Patients" />
          </AreaChart>
        </ResponsiveContainer>
      </ChartWrapper>
    </div>
  );
}

// ═══════════════════════════════════════
// STABILITY TAB
// ═══════════════════════════════════════
function StabilityTab() {
  const { dataset } = useWorld();

  const data = useMemo(() => {
    if (!dataset) return { pdcHist: [], gapHist: [], unstableCount: 0, stableCount: 0, avgPdc: 0, avgGap: 0 };

    const journeys = dataset.journeys;
    const unstableCount = journeys.filter(j => Number(j.refillGapDays) >= 90).length;
    const stableCount = journeys.length - unstableCount;

    const pdcBuckets: Record<string, number> = {};
    journeys.forEach(j => {
      const pdc = Number(j.pdcProxy);
      const bucket = `${(Math.floor(pdc * 10) / 10).toFixed(1)}`;
      pdcBuckets[bucket] = (pdcBuckets[bucket] || 0) + 1;
    });
    const pdcHist = Object.entries(pdcBuckets)
      .sort((a, b) => parseFloat(a[0]) - parseFloat(b[0]))
      .map(([pdc, count]) => ({ pdc: `${(parseFloat(pdc) * 100).toFixed(0)}%`, count, pdcVal: parseFloat(pdc) }));

    const gapBuckets: Record<string, { count: number; unstable: number }> = {};
    journeys.forEach(j => {
      const gap = Number(j.refillGapDays);
      const bucket = `${Math.floor(gap / 30) * 30}`;
      if (!gapBuckets[bucket]) gapBuckets[bucket] = { count: 0, unstable: 0 };
      gapBuckets[bucket].count++;
      if (gap >= 90) gapBuckets[bucket].unstable++;
    });
    const gapHist = Object.entries(gapBuckets)
      .sort((a, b) => parseInt(a[0]) - parseInt(b[0]))
      .map(([days, { count, unstable }]) => ({
        range: `${days}–${parseInt(days) + 29}d`,
        count,
        unstable,
        stable: count - unstable,
      }));

    const avgPdc = journeys.reduce((s, j) => s + Number(j.pdcProxy), 0) / journeys.length;
    const avgGap = journeys.reduce((s, j) => s + Number(j.refillGapDays), 0) / journeys.length;

    return { pdcHist, gapHist, unstableCount, stableCount, avgPdc, avgGap };
  }, [dataset]);

  if (!dataset) return null;

  const pdcInsight = `Average PDC is ${(data.avgPdc * 100).toFixed(0)}%. Patients with PDC ≥ 80% are considered adherent. ${data.pdcHist.filter(d => d.pdcVal >= 0.8).reduce((s, d) => s + d.count, 0).toLocaleString()} patients meet this threshold.`;
  const gapInsight = `${data.unstableCount.toLocaleString()} patients (${((data.unstableCount / (data.unstableCount + data.stableCount)) * 100).toFixed(1)}%) have refill gaps ≥ 90 days, flagged as unstable. Average refill gap is ${data.avgGap.toFixed(0)} days.`;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        <MiniKPI label="Avg PDC Proxy" value={`${(data.avgPdc * 100).toFixed(1)}%`} color={data.avgPdc >= 0.8 ? 'text-emerald-600' : 'text-foreground'} />
        <MiniKPI label="Avg Refill Gap" value={`${data.avgGap.toFixed(0)}d`} />
        <MiniKPI label="Stable (gap < 90d)" value={data.stableCount.toLocaleString()} color="text-emerald-600" sub={`${((data.stableCount / (data.stableCount + data.unstableCount)) * 100).toFixed(1)}%`} />
        <MiniKPI label="Unstable (gap ≥ 90d)" value={data.unstableCount.toLocaleString()} color="text-rose-600" sub="⚠ Flagged" />
      </div>

      <ChartWrapper title="PDC Proxy Distribution" subtitle="Proportion of Days Covered — higher is better adherence. ≥80% = adherent" insight={pdcInsight}>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={data.pdcHist}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 13%, 91%)" />
            <XAxis dataKey="pdc" tick={{ fontSize: 11 }} stroke="hsl(220, 9%, 46%)" tickLine={false} />
            <YAxis tick={{ fontSize: 12 }} stroke="hsl(220, 9%, 46%)" tickLine={false} axisLine={false} />
            <RechartsTooltip formatter={(v: number) => [v.toLocaleString(), 'Patients']} contentStyle={{ borderRadius: 8, border: '1px solid hsl(220,13%,91%)', fontSize: 12 }} />
            <Bar dataKey="count" radius={[6, 6, 0, 0]} maxBarSize={40} name="Patients">
              {data.pdcHist.map((entry, i) => (
                <Cell key={i} fill={entry.pdcVal >= 0.8 ? 'hsl(142, 71%, 45%)' : entry.pdcVal >= 0.5 ? 'hsl(38, 92%, 50%)' : 'hsl(0, 84%, 60%)'} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </ChartWrapper>

      <ChartWrapper title="Refill Gap Distribution" subtitle="Days between refills — ≥90 days flagged as unstable (red)" insight={gapInsight}>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={data.gapHist}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 13%, 91%)" />
            <XAxis dataKey="range" tick={{ fontSize: 10 }} stroke="hsl(220, 9%, 46%)" tickLine={false} />
            <YAxis tick={{ fontSize: 12 }} stroke="hsl(220, 9%, 46%)" tickLine={false} axisLine={false} />
            <RechartsTooltip content={<ChartTooltip />} />
            <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '12px' }} />
            <Bar dataKey="stable" stackId="a" fill="hsl(142, 71%, 45%)" name="Stable" radius={[0, 0, 0, 0]} />
            <Bar dataKey="unstable" stackId="a" fill="hsl(0, 84%, 60%)" name="Unstable ≥90d" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </ChartWrapper>
    </div>
  );
}

// ═══════════════════════════════════════
// ACCELERATION TAB
// ═══════════════════════════════════════
function AccelerationTab() {
  const { dataset, world } = useWorld();

  const data = useMemo(() => {
    if (!dataset) return null;

    if (world === 'glp1') {
      const journeys = dataset.journeys;
      const monthDiff = (start: string, end: string) => {
        const [sy, sm] = String(start).split('-').map(Number);
        const [ey, em] = String(end).split('-').map(Number);
        return (ey - sy) * 12 + (em - sm);
      };

      let early = 0, late = 0, ongoing = 0;
      const byMonth: Record<string, { early: number; late: number; ongoing: number }> = {};

      journeys.forEach(j => {
        const startM = String(j.lineStartMonth);
        const endM = j.lineEndMonth ? String(j.lineEndMonth) : null;
        const disc = Number(j.discontinueFlag) === 1;

        if (!byMonth[startM]) byMonth[startM] = { early: 0, late: 0, ongoing: 0 };

        if (disc && endM) {
          const dur = monthDiff(startM, endM);
          if (dur <= 6) { early++; byMonth[startM].early++; }
          else { late++; byMonth[startM].late++; }
        } else {
          ongoing++; byMonth[startM].ongoing++;
        }
      });

      const timeline = Object.entries(byMonth)
        .sort((a, b) => a[0].localeCompare(b[0]))
        .map(([month, counts]) => ({ month: month.slice(2), ...counts }));

      return { type: 'glp1' as const, early, late, ongoing, total: journeys.length, timeline };
    }

    if (world === 'nsclc') {
      const es = dataset.eventsSummary;
      const labByMonth = Object.entries(es.byMonth)
        .sort((a, b) => a[0].localeCompare(b[0]))
        .map(([month, types]) => ({
          month: month.slice(2),
          labs: (types as Record<string, number>).lab || 0,
          diagnosis: (types as Record<string, number>).diagnosis || 0,
          procedures: (types as Record<string, number>).procedure || 0,
        }));

      return { type: 'nsclc' as const, labByMonth, totalLabs: es.byType?.lab || 0, totalDx: es.byType?.diagnosis || 0 };
    }

    if (world === 'alzheimer') {
      const es = dataset.eventsSummary;
      const cadence = Object.entries(es.byMonth)
        .sort((a, b) => a[0].localeCompare(b[0]))
        .map(([month, types]) => ({
          month: month.slice(2),
          monitoring: (types as Record<string, number>).lab || 0,
          visits: (types as Record<string, number>).visit || 0,
        }));

      return { type: 'alzheimer' as const, cadence, totalMonitoring: es.byType?.lab || 0 };
    }

    return null;
  }, [dataset, world]);

  if (!dataset || !data) return null;

  const trustKey = `acceleration_${world}` as keyof typeof TRUST;

  return (
    <div className="space-y-6">
      {data.type === 'glp1' && (
        <>
          <div className="grid grid-cols-3 gap-3 md:gap-4">
            <MiniKPI label="Early Disc. (≤6mo)" value={data.early.toLocaleString()} color="text-rose-600" sub={`${((data.early / data.total) * 100).toFixed(1)}% of cohort`} />
            <MiniKPI label="Late Disc. (>6mo)" value={data.late.toLocaleString()} sub={`${((data.late / data.total) * 100).toFixed(1)}%`} />
            <MiniKPI label="Ongoing" value={data.ongoing.toLocaleString()} color="text-emerald-600" sub={`${((data.ongoing / data.total) * 100).toFixed(1)}%`} />
          </div>
          <ChartWrapper
            title="Early vs Late Discontinuation by Cohort Start Month"
            subtitle="GLP-1: Patients who stopped within 6 months of initiation vs. those who continued"
            insight={`${((data.early / data.total) * 100).toFixed(0)}% of patients discontinued within 6 months — the critical early attrition window. ${data.ongoing.toLocaleString()} remain ongoing. Early intervention during months 1-6 could retain more patients.`}
          >
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={data.timeline}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 13%, 91%)" />
                <XAxis dataKey="month" tick={{ fontSize: 10 }} stroke="hsl(220, 9%, 46%)" tickLine={false} angle={-30} textAnchor="end" height={50} />
                <YAxis tick={{ fontSize: 12 }} stroke="hsl(220, 9%, 46%)" tickLine={false} axisLine={false} />
                <RechartsTooltip content={<ChartTooltip />} />
                <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '12px' }} />
                <Bar dataKey="early" stackId="a" fill="hsl(0, 84%, 60%)" name="Early Disc ≤6mo" />
                <Bar dataKey="late" stackId="a" fill="hsl(38, 92%, 50%)" name="Late Disc >6mo" />
                <Bar dataKey="ongoing" stackId="a" fill="hsl(142, 71%, 45%)" name="Ongoing" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartWrapper>
        </>
      )}

      {data.type === 'nsclc' && (
        <>
          <div className="grid grid-cols-2 gap-3 md:gap-4">
            <MiniKPI label="Total Lab/Imaging Events" value={data.totalLabs.toLocaleString()} />
            <MiniKPI label="Total Diagnosis Events" value={data.totalDx.toLocaleString()} />
          </div>
          <ChartWrapper
            title="Biomarker Testing & Imaging Cadence"
            subtitle="NSCLC: Monthly lab/imaging volume as a proxy for biomarker testing and imaging surveillance"
            insight={`${data.totalLabs.toLocaleString()} total lab/imaging events tracked. The cadence of testing indicates biomarker-driven treatment decisions and RECIST monitoring compliance.`}
          >
            <ResponsiveContainer width="100%" height={320}>
              <ComposedChart data={data.labByMonth}>
                <defs>
                  <linearGradient id="labGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(262, 60%, 50%)" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="hsl(262, 60%, 50%)" stopOpacity={0.01} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 13%, 91%)" />
                <XAxis dataKey="month" tick={{ fontSize: 10 }} stroke="hsl(220, 9%, 46%)" tickLine={false} angle={-30} textAnchor="end" height={50} />
                <YAxis tick={{ fontSize: 12 }} stroke="hsl(220, 9%, 46%)" tickLine={false} axisLine={false} />
                <RechartsTooltip content={<ChartTooltip />} />
                <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '12px' }} />
                <Area dataKey="labs" fill="url(#labGrad)" stroke="hsl(262, 60%, 50%)" strokeWidth={2.5} name="Labs/Imaging" dot={false}
                  activeDot={{ r: 5, fill: 'hsl(262, 60%, 50%)', stroke: '#fff', strokeWidth: 2 }} />
                <Line dataKey="diagnosis" stroke="hsl(0, 84%, 60%)" strokeWidth={2} dot={false} name="Diagnosis Events" />
              </ComposedChart>
            </ResponsiveContainer>
          </ChartWrapper>
        </>
      )}

      {data.type === 'alzheimer' && (
        <>
          <MiniKPI label="Total Monitoring Events (MRI/Lab proxy)" value={data.totalMonitoring.toLocaleString()} />
          <ChartWrapper
            title="Lecanemab MRI Monitoring Cadence"
            subtitle="Alzheimer: Monthly monitoring events as proxy for ARIA surveillance MRI cadence"
            insight={`${data.totalMonitoring.toLocaleString()} monitoring events tracked. ARIA surveillance requires MRI at baseline, before dose 5, before dose 7, and before dose 14. Monitoring cadence compliance is critical for lecanemab safety.`}
          >
            <ResponsiveContainer width="100%" height={320}>
              <ComposedChart data={data.cadence}>
                <defs>
                  <linearGradient id="monGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(262, 60%, 50%)" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="hsl(262, 60%, 50%)" stopOpacity={0.01} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 13%, 91%)" />
                <XAxis dataKey="month" tick={{ fontSize: 10 }} stroke="hsl(220, 9%, 46%)" tickLine={false} angle={-30} textAnchor="end" height={50} />
                <YAxis tick={{ fontSize: 12 }} stroke="hsl(220, 9%, 46%)" tickLine={false} axisLine={false} />
                <RechartsTooltip content={<ChartTooltip />} />
                <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '12px' }} />
                <Area dataKey="monitoring" fill="url(#monGrad)" stroke="hsl(262, 60%, 50%)" strokeWidth={2.5} name="Monitoring (MRI/Lab)" dot={false}
                  activeDot={{ r: 5, fill: 'hsl(262, 60%, 50%)', stroke: '#fff', strokeWidth: 2 }} />
                <Line dataKey="visits" stroke="hsl(142, 71%, 45%)" strokeWidth={2} dot={false} name="Visits" />
              </ComposedChart>
            </ResponsiveContainer>
          </ChartWrapper>
        </>
      )}
    </div>
  );
}

// ═══════════════════════════════════════
// MAIN PAGE
// ═══════════════════════════════════════
export default function JourneyAnalytics() {
  const { loading } = useWorld();

  return (
    <div className="max-w-6xl mx-auto px-6 md:px-10 py-8 w-full">
      <div className="flex items-center justify-between gap-4 mb-8">
        <div>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-xs font-semibold tracking-[0.3em] uppercase mb-2 text-primary"
          >
            Patient Journey Module
          </motion.p>
          <motion.h1
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-2xl md:text-3xl font-extrabold text-foreground tracking-tight"
          >
            Journey Analytics
          </motion.h1>
          <p className="text-sm text-muted-foreground mt-1">Patient flow, friction, stability & acceleration across therapy lines.</p>
        </div>
        <WorldSwitcher />
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64 gap-3 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span className="text-sm font-medium">Loading world data…</span>
        </div>
      ) : (
        <Tabs defaultValue="flow" className="w-full">
          <TabsList className="grid grid-cols-4 w-full max-w-lg mb-8">
            <TabsTrigger value="flow" className="gap-1.5 text-xs">
              <Waves className="h-3.5 w-3.5" /> Flow
            </TabsTrigger>
            <TabsTrigger value="friction" className="gap-1.5 text-xs">
              <Shield className="h-3.5 w-3.5" /> Friction
            </TabsTrigger>
            <TabsTrigger value="stability" className="gap-1.5 text-xs">
              <Activity className="h-3.5 w-3.5" /> Stability
            </TabsTrigger>
            <TabsTrigger value="acceleration" className="gap-1.5 text-xs">
              <Zap className="h-3.5 w-3.5" /> Acceleration
            </TabsTrigger>
          </TabsList>

          <TabsContent value="flow"><FlowTab /></TabsContent>
          <TabsContent value="friction"><FrictionTab /></TabsContent>
          <TabsContent value="stability"><StabilityTab /></TabsContent>
          <TabsContent value="acceleration"><AccelerationTab /></TabsContent>
        </Tabs>
      )}
    </div>
  );
}
