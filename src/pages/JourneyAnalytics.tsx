import { useMemo, useState, useCallback } from 'react';
import { useWorld } from '@/contexts/WorldContext';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import TrustBadge from '@/components/TrustBadge';
import WorldSwitcher from '@/components/WorldSwitcher';
import ChartWrapper from '@/components/ChartWrapper';
import CohortFilterBar, { useFilteredCohort, type CohortFilters } from '@/components/CohortFilterBar';
import AIInsights from '@/components/AIInsights';
import ExportPPT from '@/components/ExportPPT';
import TicketDialog from '@/components/TicketDialog';
import GuidedTour from '@/components/GuidedTour';
import InfoPanel from '@/components/InfoPanel';
import KPICard from '@/components/KPICard';
import PersistencyCurve from '@/components/PersistencyCurve';
import DropOffByPayer from '@/components/DropOffByPayer';
import BrandPersistency from '@/components/BrandPersistency';
import PatientMap from '@/components/PatientMap';
import DrilldownTabs from '@/components/DrilldownTabs';
import { buildCohortResult, buildKPIs, buildSegmentSnapshot, buildPersistenceCurve } from '@/data/engine/jsonToLegacy';
import type { TrustInfo, Journey, Patient } from '@/data/engine/types';
import type { ActiveFilter } from '@/data/csvDataService';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip,
  ResponsiveContainer, Cell, Legend,
  LineChart, Line, ComposedChart, Area, AreaChart,
  LabelList,
} from 'recharts';
import { Activity, Shield, Zap, Waves, Loader2, ArrowLeft, X } from 'lucide-react';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';

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

// ── KPI Card ──
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
function FlowTab({ journeys }: { journeys: Journey[] }) {
  const data = useMemo(() => {
    if (!journeys.length) return { sankeyData: [], summary: { total: 0, active: 0, stopped: 0, restarted: 0 } };

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
  }, [journeys]);

  if (data.sankeyData.length === 0) {
    return (
      <div className="rounded-xl border border-destructive/50 bg-destructive/5 p-6">
        <p className="text-sm text-destructive font-medium">⚠ No journey data matches current filters. Adjust cohort filters above.</p>
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
      <div className="flex items-center gap-2 mb-2">
        <TrustBadge trust={TRUST.sankey} />
        <span className="text-[10px] text-muted-foreground">Fields: lineNumber, discontinueFlag, switchFlag, restartFlag</span>
      </div>

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
        insight={`Discontinuation rates ${discRateData.length > 1 ? `range from ${Math.min(...discRateData.map(d => d.discRate)).toFixed(0)}% to ${Math.max(...discRateData.map(d => d.discRate)).toFixed(0)}%` : 'shown'} across therapy lines.`}
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
function FrictionTab({ journeys, patients }: { journeys: Journey[]; patients: Patient[] }) {
  const [authOnly, setAuthOnly] = useState(false);

  const data = useMemo(() => {
    if (!journeys.length) return { byPayer: [], byState: [], histogram: [] };

    const patientMap = new Map(patients.map(p => [p.patientId, p]));

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
        return { state, median: sorted[Math.floor(sorted.length / 2)] || 0, count: vals.length };
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
  }, [journeys, patients, authOnly]);

  const payerInsight = data.byPayer.length > 0
    ? `${data.byPayer[0].payer} shows the highest median time-to-start at ${data.byPayer[0].median} days. ${data.byPayer[data.byPayer.length - 1]?.payer || 'Other'} has the shortest wait at ${data.byPayer[data.byPayer.length - 1]?.median || 0} days.`
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

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 mb-2">
        <TrustBadge trust={TRUST.friction} />
        <span className="text-[10px] text-muted-foreground">Fields: timeToStartDays, payerSegment, state</span>
      </div>

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
function StabilityTab({ journeys }: { journeys: Journey[] }) {
  const data = useMemo(() => {
    if (!journeys.length) return { pdcHist: [], gapHist: [], unstableCount: 0, stableCount: 0, avgPdc: 0, avgGap: 0 };

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
  }, [journeys]);

  const pdcInsight = `Average PDC is ${(data.avgPdc * 100).toFixed(0)}%. Patients with PDC ≥ 80% are considered adherent. ${data.pdcHist.filter(d => d.pdcVal >= 0.8).reduce((s, d) => s + d.count, 0).toLocaleString()} patients meet this threshold.`;
  const gapInsight = `${data.unstableCount.toLocaleString()} patients (${((data.unstableCount / (data.unstableCount + data.stableCount)) * 100).toFixed(1)}%) have refill gaps ≥ 90 days, flagged as unstable. Average refill gap is ${data.avgGap.toFixed(0)} days.`;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 mb-2">
        <TrustBadge trust={TRUST.stability} />
        <span className="text-[10px] text-muted-foreground">Fields: pdcProxy, refillGapDays</span>
      </div>

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
function AccelerationTab({ journeys }: { journeys: Journey[] }) {
  const { dataset, world } = useWorld();

  const data = useMemo(() => {
    if (!dataset) return null;

    if (world === 'glp1') {
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
  }, [dataset, world, journeys]);

  if (!dataset || !data) return null;

  const trustKey = `acceleration_${world}` as keyof typeof TRUST;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 mb-2">
        <TrustBadge trust={TRUST[trustKey] || TRUST.acceleration_glp1} />
        <span className="text-[10px] text-muted-foreground">
          {world === 'glp1' && 'Fields: lineStartMonth, lineEndMonth, discontinueFlag'}
          {world === 'nsclc' && 'Fields: eventsSummary.byMonth (lab, diagnosis, procedure)'}
          {world === 'alzheimer' && 'Fields: eventsSummary.byMonth (lab, visit)'}
        </span>
      </div>

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
            insight={`${((data.early / data.total) * 100).toFixed(0)}% of patients discontinued within 6 months — the critical early attrition window.`}
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
            insight={`${data.totalLabs.toLocaleString()} total lab/imaging events tracked.`}
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
            insight={`${data.totalMonitoring.toLocaleString()} monitoring events tracked. ARIA surveillance requires MRI at key infusion milestones.`}
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
export default function PatientJourney() {
  const navigate = useNavigate();
  const { loading, dataset, world } = useWorld();

  // Cross-filtering state (mirrors GLP-1 dashboard)
  const [activeFilter, setActiveFilter] = useState<ActiveFilter | null>(null);
  const [chatMessageCount, setChatMessageCount] = useState(0);
  const [showExitDialog, setShowExitDialog] = useState(false);

  // Sorted months for the slider
  const allMonths = useMemo(() => {
    if (!dataset) return [];
    return [...new Set(dataset.patients.map(p => String(p.diagnosisMonth)))].filter(Boolean).sort();
  }, [dataset]);

  const [filters, setFilters] = useState<CohortFilters>({
    selectedICD: [],
    selectedNDC: [],
    monthRange: [0, 0],
  });

  // Reset month range when dataset changes
  useMemo(() => {
    if (allMonths.length > 0) {
      setFilters(prev => ({ ...prev, monthRange: [0, allMonths.length - 1] }));
    }
  }, [allMonths.length]);

  const { patients: filteredPatients, journeys: filteredJourneys, diagnosisOnlyCount } = useFilteredCohort(filters, allMonths);

  // Build legacy-compatible data structures for reused components
  const kpis = useMemo(() => buildKPIs(filteredPatients, filteredJourneys), [filteredPatients, filteredJourneys]);

  const cohort = useMemo(() => buildCohortResult(filteredPatients, filteredJourneys), [filteredPatients, filteredJourneys]);

  const segmentSnapshot = useMemo(() => buildSegmentSnapshot(filteredPatients, filteredJourneys), [filteredPatients, filteredJourneys]);

  const curveData = useMemo(
    () => buildPersistenceCurve(filteredJourneys, activeFilter, filteredPatients),
    [filteredJourneys, activeFilter, filteredPatients],
  );

  const displayKPIs = useMemo(() => {
    if (!activeFilter) return kpis;
    const segments = activeFilter.type === 'payer' ? cohort.byPayer : cohort.byBrand;
    const seg = segments.find(s => s.name === activeFilter.value);
    if (!seg) return kpis;
    return { ...kpis, totalPatients: seg.patients };
  }, [kpis, activeFilter, cohort]);

  const startDate = allMonths[filters.monthRange[0]] || '2023-01';
  const endDate = allMonths[filters.monthRange[1]] || '2024-12';

  const handleSegmentClick = (type: ActiveFilter['type'], value: string) => {
    setActiveFilter(prev =>
      prev?.type === type && prev?.value === value ? null : { type, value },
    );
  };

  const handleBackClick = useCallback((e: React.MouseEvent) => {
    if (chatMessageCount > 0) {
      e.preventDefault();
      setShowExitDialog(true);
    }
  }, [chatMessageCount]);

  const handleConfirmExit = useCallback(() => {
    setShowExitDialog(false);
    navigate('/');
  }, [navigate]);

  return (
    <div className="min-h-screen bg-background">
      {/* Unsaved chat exit dialog */}
      <Dialog open={showExitDialog} onOpenChange={setShowExitDialog}>
        <DialogContent className="max-w-sm">
          <DialogTitle>Unsaved Chat</DialogTitle>
          <DialogDescription>
            You have {chatMessageCount} chat message{chatMessageCount !== 1 ? 's' : ''} in the AI Q&A. Save your chat before leaving, or it will be lost.
          </DialogDescription>
          <div className="flex gap-2 justify-end mt-4">
            <Button variant="outline" onClick={() => setShowExitDialog(false)}>Stay</Button>
            <Button variant="destructive" onClick={handleConfirmExit}>Leave without saving</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Sticky header */}
      <div className="sticky top-0 z-20 bg-background/95 backdrop-blur-sm">
        <div className="max-w-[1400px] mx-auto px-4 md:px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              to="/"
              onClick={handleBackClick}
              className="inline-flex items-center justify-center h-8 w-8 rounded-lg hover:bg-muted transition-colors"
              aria-label="Back to portfolio"
            >
              <ArrowLeft className="h-5 w-5 text-foreground" />
            </Link>
            <h1 className="text-2xl md:text-3xl font-extrabold text-foreground tracking-tight">Patient Journey</h1>
          </div>
          <div className="flex items-center gap-1">
            <WorldSwitcher />
            <ExportPPT kpis={displayKPIs} segmentSnapshot={segmentSnapshot} cohort={cohort} curveData={curveData} startDate={startDate} endDate={endDate} />
            <TicketDialog />
            <GuidedTour />
            <InfoPanel />
          </div>
        </div>
        <div className="max-w-[1400px] mx-auto px-4 md:px-6">
          <div className="border-t border-border/40" />
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64 gap-3 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span className="text-sm font-medium">Loading world data…</span>
        </div>
      ) : (
        <motion.div
          className="max-w-[1400px] mx-auto px-4 md:px-6 py-6 space-y-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          {/* Cohort Filter Bar */}
          <CohortFilterBar
            filters={filters}
            onFiltersChange={setFilters}
            filteredPatientCount={filteredPatients.length}
            totalPatientCount={dataset?.patients.length || 0}
            diagnosisOnlyCount={diagnosisOnlyCount}
          />

          {/* Active filter badge */}
          {activeFilter && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-2"
            >
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Filtered by:</span>
              <button
                onClick={() => setActiveFilter(null)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-semibold hover:bg-primary/20 transition-colors"
              >
                {activeFilter.value}
                <X className="h-3.5 w-3.5" />
              </button>
              <span className="text-xs text-muted-foreground">Click again or press × to clear</span>
            </motion.div>
          )}

          {/* KPI row — mirrors GLP-1 dashboard */}
          <section className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
            <KPICard title="Patients Analyzed" value={displayKPIs.totalPatients.toLocaleString()} description="Unique patients matching cohort filters." detail="Patients are filtered by ICD-10, NDC codes, and diagnosis month range from the cohort filter bar above." />
            <KPICard title="Still on Therapy" value={`${(displayKPIs.activeRate * 100).toFixed(1)}%`} description="Patients with active therapy (discontinueFlag = 0)." detail="Derived from journey records: percentage of journeys where discontinueFlag is 0." highlight sentiment="positive" />
            <KPICard title="Stopped Therapy" value={`${(displayKPIs.dropOffRate * 100).toFixed(1)}%`} description="Patients who discontinued treatment." detail="Calculated as 100% minus Still on Therapy rate." highlight sentiment="negative" />
            <KPICard title="Typical Refill Delay" value={displayKPIs.medianRefillGap.toFixed(1)} suffix=" days" description="Median refill gap across all journeys." detail="Sourced from journey refillGapDays: the median value across all filtered journeys." />
          </section>

          {/* Two-column: Charts + AI Insights sidebar */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              {/* Persistence Curve */}
              <div id="persistence-curve">
                <PersistencyCurve data={curveData} activeFilter={activeFilter} />
              </div>

              {/* Payer + Brand breakdown */}
              <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div id="payer-chart">
                  <DropOffByPayer data={segmentSnapshot} selectedPayer={activeFilter?.type === 'payer' ? activeFilter.value : null} onPayerClick={(payer) => handleSegmentClick('payer', payer)} />
                </div>
                <div id="brand-chart">
                  <BrandPersistency data={segmentSnapshot} selectedBrand={activeFilter?.type === 'brand' ? activeFilter.value : null} onBrandClick={(brand) => handleSegmentClick('brand', brand)} />
                </div>
              </section>

              {/* Geographic Map */}
              <div id="geo-map">
                <PatientMap cohort={cohort} />
              </div>

              {/* Segmented Drilldown */}
              <DrilldownTabs cohort={cohort} activeFilter={activeFilter} />

              {/* Journey-specific tabs */}
              <Tabs defaultValue="flow" className="w-full">
                <TabsList className="grid grid-cols-4 w-full max-w-lg mb-6">
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

                <TabsContent value="flow"><FlowTab journeys={filteredJourneys} /></TabsContent>
                <TabsContent value="friction"><FrictionTab journeys={filteredJourneys} patients={filteredPatients} /></TabsContent>
                <TabsContent value="stability"><StabilityTab journeys={filteredJourneys} /></TabsContent>
                <TabsContent value="acceleration"><AccelerationTab journeys={filteredJourneys} /></TabsContent>
              </Tabs>
            </div>

            <div className="lg:col-span-1">
              <div className="lg:sticky lg:top-[80px]">
                <AIInsights
                  kpis={displayKPIs}
                  segmentSnapshot={segmentSnapshot}
                  cohort={cohort}
                  startDate={startDate}
                  endDate={endDate}
                  onChatMessagesChange={setChatMessageCount}
                />
              </div>
            </div>
          </div>

          <div className="border-t pt-6 pb-8 text-center">
            <p className="text-xs text-muted-foreground">
              Built with synthetic claims data · {cohort.total.toLocaleString()} patient cohort · Not real patient data
            </p>
          </div>
        </motion.div>
      )}
    </div>
  );
}
