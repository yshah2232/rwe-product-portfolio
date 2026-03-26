import { useMemo, useState } from 'react';
import { useWorld } from '@/contexts/WorldContext';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import TrustBadge from '@/components/TrustBadge';
import WorldSwitcher from '@/components/WorldSwitcher';
import SiteNav from '@/components/SiteNav';
import SiteFooter from '@/components/SiteFooter';
import type { TrustInfo, Journey, Patient } from '@/data/engine/types';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip,
  ResponsiveContainer, Cell, ScatterChart, Scatter, ZAxis, Legend,
  LineChart, Line, PieChart, Pie, ComposedChart, Area,
} from 'recharts';
import { Info, Activity, Shield, Zap, Waves } from 'lucide-react';

// ── Trust configs ──
const TRUST: Record<string, TrustInfo> = {
  sankey: { kind: 'observed', confidence: 92, reason: 'Computed from JOURNEYS lineNumber + discontinueFlag. Direct event observation.' },
  friction: { kind: 'observed', confidence: 88, reason: 'timeToStartDays from JOURNEYS joined with payerSegment from PATIENTS.' },
  stability: { kind: 'inferred', confidence: 78, reason: 'pdcProxy is a modeled adherence proxy. refillGapDays inferred from Rx cadence.' },
  acceleration_glp1: { kind: 'inferred', confidence: 74, reason: 'Early discontinuation derived from lineEndMonth − lineStartMonth ≤ 6 months and discontinueFlag.' },
  acceleration_nsclc: { kind: 'inferred', confidence: 72, reason: 'Metastasis code presence inferred from event frequency patterns. Imaging cadence from lab event counts.' },
  acceleration_alz: { kind: 'inferred', confidence: 70, reason: 'MRI monitoring cadence inferred from lab/imaging event frequency per quarter.' },
};

function ChartTooltipBox({ title, fields }: { title: string; fields: string[] }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button className="inline-flex items-center justify-center rounded-full w-5 h-5 bg-muted hover:bg-accent transition-colors">
          <Info className="h-3 w-3 text-muted-foreground" />
        </button>
      </TooltipTrigger>
      <TooltipContent side="top" className="max-w-xs text-xs">
        <p className="font-semibold mb-1">{title}</p>
        <p className="text-muted-foreground">Fields: {fields.join(', ')}</p>
      </TooltipContent>
    </Tooltip>
  );
}

function ChartHeader({ title, trust, fields, description }: { title: string; trust: TrustInfo; fields: string[]; description?: string }) {
  return (
    <div className="flex items-start justify-between gap-2 mb-4">
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold text-foreground">{title}</h3>
          <ChartTooltipBox title={title} fields={fields} />
        </div>
        {description && <p className="text-xs text-muted-foreground">{description}</p>}
      </div>
      <TrustBadge trust={trust} size="sm" />
    </div>
  );
}

// ── Color palette using CSS vars ──
const COLORS = [
  'hsl(262, 60%, 50%)', // primary
  'hsl(221, 83%, 53%)', // chart-2
  'hsl(142, 71%, 45%)', // chart-3
  'hsl(38, 92%, 50%)',  // chart-4
  'hsl(173, 80%, 40%)', // chart-5
  'hsl(0, 84%, 60%)',   // destructive
];

// ═══════════════════════════════════════
// FLOW TAB - Sankey-like visualization
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

  if (!dataset) return <div className="text-muted-foreground text-sm p-4">Loading...</div>;

  if (data.sankeyData.length === 0) {
    return (
      <Card className="border-destructive/50 bg-destructive/5">
        <CardContent className="p-6">
          <p className="text-sm text-destructive font-medium">⚠ Debug: JOURNEYS has 0 rows or lineNumber values are missing. Check data files.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Journeys', value: data.summary.total, color: 'text-foreground' },
          { label: 'Active (On Therapy)', value: data.summary.active, color: 'text-emerald-600' },
          { label: 'Stopped (Discontinued)', value: data.summary.stopped, color: 'text-red-500' },
          { label: 'Restarted', value: data.summary.restarted, color: 'text-amber-500' },
        ].map(kpi => (
          <Card key={kpi.label} className="border-border/50">
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">{kpi.label}</p>
              <p className={`text-2xl font-bold ${kpi.color}`}>{kpi.value.toLocaleString()}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Stacked Bar (Sankey proxy) */}
      <Card>
        <CardContent className="p-6">
          <ChartHeader
            title="Patient Flow by Line of Therapy"
            trust={TRUST.sankey}
            fields={['lineNumber', 'discontinueFlag', 'switchFlag', 'restartFlag']}
            description="Stacked view: how patients distribute across therapy lines and their end state."
          />
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.sankeyData} barCategoryGap="20%">
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(250, 13%, 91%)" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} stroke="hsl(250, 9%, 46%)" />
                <YAxis tick={{ fontSize: 12 }} stroke="hsl(250, 9%, 46%)" />
                <RechartsTooltip
                  contentStyle={{ borderRadius: 8, border: '1px solid hsl(250,13%,91%)', fontSize: 12 }}
                  formatter={(value: number, name: string) => [value.toLocaleString(), name.charAt(0).toUpperCase() + name.slice(1)]}
                />
                <Legend />
                <Bar dataKey="active" stackId="a" fill={COLORS[2]} name="Active" radius={[0, 0, 0, 0]} />
                <Bar dataKey="stopped" stackId="a" fill={COLORS[5]} name="Stopped" radius={[0, 0, 0, 0]} />
                <Bar dataKey="restarted" stackId="b" fill={COLORS[3]} name="Restarted" />
                <Bar dataKey="switched" stackId="b" fill={COLORS[1]} name="Switched" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Discontinuation rate by line */}
      <Card>
        <CardContent className="p-6">
          <ChartHeader
            title="Discontinuation Rate by Line"
            trust={TRUST.sankey}
            fields={['lineNumber', 'discontinueFlag']}
            description="Percentage of patients who discontinued on each therapy line."
          />
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.sankeyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(250, 13%, 91%)" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} stroke="hsl(250, 9%, 46%)" />
                <YAxis tick={{ fontSize: 12 }} stroke="hsl(250, 9%, 46%)" tickFormatter={v => `${v}%`} />
                <RechartsTooltip formatter={(v: number) => [`${v.toFixed(1)}%`, 'Discontinuation Rate']} />
                <Bar
                  dataKey="discRate"
                  fill={COLORS[0]}
                  radius={[4, 4, 0, 0]}
                  name="Disc. Rate %"
                >
                  {data.sankeyData.map((entry, i) => {
                    const rate = entry.total > 0 ? (entry.stopped / entry.total) * 100 : 0;
                    return <Cell key={i} fill={rate > 40 ? COLORS[5] : rate > 25 ? COLORS[3] : COLORS[2]} />;
                  })}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          {/* Inject discRate */}
          <div className="mt-3 flex flex-wrap gap-2">
            {data.sankeyData.map(d => (
              <Badge key={d.name} variant="outline" className="text-xs">
                {d.name}: {d.total > 0 ? ((d.stopped / d.total) * 100).toFixed(1) : 0}%
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>
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
    const authPatients = new Set<string>();
    if (dataset.eventsSummary?.patientProviderMap) {
      // We don't have per-event data, use all patients for now
      // Auth filter uses journeys with timeToStartDays > median as proxy
    }

    let journeys = dataset.journeys;

    // Group by payer
    const payerBuckets: Record<string, number[]> = {};
    const stateBuckets: Record<string, number[]> = {};

    journeys.forEach(j => {
      const patient = patientMap.get(j.patientId);
      if (!patient) return;
      const tts = Number(j.timeToStartDays);
      if (tts === 0 && authOnly) return; // skip zero-wait if auth filter on

      const payer = patient.payerSegment || 'Unknown';
      if (!payerBuckets[payer]) payerBuckets[payer] = [];
      payerBuckets[payer].push(tts);

      const state = patient.state || 'Unknown';
      if (!stateBuckets[state]) stateBuckets[state] = [];
      stateBuckets[state].push(tts);
    });

    const byPayer = Object.entries(payerBuckets).map(([payer, vals]) => ({
      payer,
      median: vals.sort((a, b) => a - b)[Math.floor(vals.length / 2)] || 0,
      mean: Math.round(vals.reduce((a, b) => a + b, 0) / vals.length),
      p75: vals.sort((a, b) => a - b)[Math.floor(vals.length * 0.75)] || 0,
      count: vals.length,
    }));

    const topStates = Object.entries(stateBuckets)
      .sort((a, b) => b[1].length - a[1].length)
      .slice(0, 10)
      .map(([state, vals]) => ({
        state,
        median: vals.sort((a, b) => a - b)[Math.floor(vals.length / 2)] || 0,
        mean: Math.round(vals.reduce((a, b) => a + b, 0) / vals.length),
        count: vals.length,
      }));

    // Histogram buckets
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

  if (!dataset) return <div className="text-muted-foreground text-sm p-4">Loading...</div>;

  const allFlat = data.histogram.length <= 1;

  return (
    <div className="space-y-6">
      {/* Auth Toggle */}
      <div className="flex items-center gap-3">
        <Switch id="auth-filter" checked={authOnly} onCheckedChange={setAuthOnly} />
        <Label htmlFor="auth-filter" className="text-sm text-muted-foreground">
          Show only patients with non-zero time-to-start (authorization friction proxy)
        </Label>
      </div>

      {allFlat && (
        <Card className="border-amber-200 bg-amber-50/50">
          <CardContent className="p-4">
            <p className="text-sm text-amber-700">⚠ Debug: timeToStartDays values may be uniform. Verify non-zero distribution in JOURNEYS.</p>
          </CardContent>
        </Card>
      )}

      {/* By Payer */}
      <Card>
        <CardContent className="p-6">
          <ChartHeader
            title="Time-to-Start by Payer Segment"
            trust={TRUST.friction}
            fields={['timeToStartDays', 'payerSegment']}
            description="Median days from diagnosis to first therapy, grouped by payer."
          />
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.byPayer} layout="vertical" barCategoryGap="25%">
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(250, 13%, 91%)" />
                <XAxis type="number" tick={{ fontSize: 12 }} stroke="hsl(250, 9%, 46%)" label={{ value: 'Days', position: 'insideBottomRight', offset: -5, fontSize: 11 }} />
                <YAxis dataKey="payer" type="category" width={100} tick={{ fontSize: 12 }} stroke="hsl(250, 9%, 46%)" />
                <RechartsTooltip
                  contentStyle={{ borderRadius: 8, border: '1px solid hsl(250,13%,91%)', fontSize: 12 }}
                  formatter={(v: number, name: string) => [`${v} days`, name === 'median' ? 'Median' : name === 'p75' ? '75th %ile' : name]}
                />
                <Legend />
                <Bar dataKey="median" fill={COLORS[0]} name="Median" radius={[0, 4, 4, 0]} />
                <Bar dataKey="p75" fill={COLORS[4]} name="75th Percentile" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Top States */}
      <Card>
        <CardContent className="p-6">
          <ChartHeader
            title="Time-to-Start by State (Top 10)"
            trust={TRUST.friction}
            fields={['timeToStartDays', 'state']}
            description="Top 10 states by patient volume. Shows median days to first treatment."
          />
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.byState}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(250, 13%, 91%)" />
                <XAxis dataKey="state" tick={{ fontSize: 12 }} stroke="hsl(250, 9%, 46%)" />
                <YAxis tick={{ fontSize: 12 }} stroke="hsl(250, 9%, 46%)" label={{ value: 'Days', angle: -90, position: 'insideLeft', fontSize: 11 }} />
                <RechartsTooltip formatter={(v: number) => [`${v} days`, 'Median TTS']} />
                <Bar dataKey="median" fill={COLORS[1]} radius={[4, 4, 0, 0]}>
                  {data.byState.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Histogram */}
      <Card>
        <CardContent className="p-6">
          <ChartHeader
            title="Time-to-Start Distribution"
            trust={TRUST.friction}
            fields={['timeToStartDays']}
            description="Histogram of days between diagnosis and therapy initiation."
          />
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.histogram}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(250, 13%, 91%)" />
                <XAxis dataKey="range" tick={{ fontSize: 10 }} stroke="hsl(250, 9%, 46%)" angle={-30} textAnchor="end" height={50} />
                <YAxis tick={{ fontSize: 12 }} stroke="hsl(250, 9%, 46%)" />
                <RechartsTooltip formatter={(v: number) => [v, 'Patients']} />
                <Bar dataKey="count" fill={COLORS[0]} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
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

    // PDC histogram
    const pdcBuckets: Record<string, number> = {};
    journeys.forEach(j => {
      const pdc = Number(j.pdcProxy);
      const bucket = `${(Math.floor(pdc * 10) / 10).toFixed(1)}`;
      pdcBuckets[bucket] = (pdcBuckets[bucket] || 0) + 1;
    });
    const pdcHist = Object.entries(pdcBuckets)
      .sort((a, b) => parseFloat(a[0]) - parseFloat(b[0]))
      .map(([pdc, count]) => ({ pdc: `${(parseFloat(pdc) * 100).toFixed(0)}%`, count, pdcVal: parseFloat(pdc) }));

    // Refill gap histogram
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
        daysVal: parseInt(days),
      }));

    const avgPdc = journeys.reduce((s, j) => s + Number(j.pdcProxy), 0) / journeys.length;
    const avgGap = journeys.reduce((s, j) => s + Number(j.refillGapDays), 0) / journeys.length;

    return { pdcHist, gapHist, unstableCount, stableCount, avgPdc, avgGap };
  }, [dataset]);

  if (!dataset) return <div className="text-muted-foreground text-sm p-4">Loading...</div>;

  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-border/50">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Avg PDC Proxy</p>
            <p className="text-2xl font-bold text-foreground">{(data.avgPdc * 100).toFixed(1)}%</p>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Avg Refill Gap</p>
            <p className="text-2xl font-bold text-foreground">{data.avgGap.toFixed(0)} days</p>
          </CardContent>
        </Card>
        <Card className="border-emerald-200 bg-emerald-50/30">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Stable (gap &lt; 90d)</p>
            <p className="text-2xl font-bold text-emerald-600">{data.stableCount.toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card className="border-red-200 bg-red-50/30">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              Unstable (gap ≥ 90d)
              <Badge variant="destructive" className="text-[10px] px-1 py-0">FLAG</Badge>
            </p>
            <p className="text-2xl font-bold text-red-500">{data.unstableCount.toLocaleString()}</p>
          </CardContent>
        </Card>
      </div>

      {/* PDC Distribution */}
      <Card>
        <CardContent className="p-6">
          <ChartHeader
            title="PDC Proxy Distribution"
            trust={TRUST.stability}
            fields={['pdcProxy']}
            description="Proportion of Days Covered. Higher = better adherence. <80% generally considered non-adherent."
          />
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.pdcHist}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(250, 13%, 91%)" />
                <XAxis dataKey="pdc" tick={{ fontSize: 11 }} stroke="hsl(250, 9%, 46%)" />
                <YAxis tick={{ fontSize: 12 }} stroke="hsl(250, 9%, 46%)" />
                <RechartsTooltip formatter={(v: number) => [v, 'Patients']} />
                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                  {data.pdcHist.map((entry, i) => (
                    <Cell key={i} fill={entry.pdcVal >= 0.8 ? COLORS[2] : entry.pdcVal >= 0.5 ? COLORS[3] : COLORS[5]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Refill Gap Distribution */}
      <Card>
        <CardContent className="p-6">
          <ChartHeader
            title="Refill Gap Distribution"
            trust={TRUST.stability}
            fields={['refillGapDays']}
            description="Days between refills. ≥90 days flagged as unstable (red). Red bars indicate instability risk."
          />
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.gapHist}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(250, 13%, 91%)" />
                <XAxis dataKey="range" tick={{ fontSize: 10 }} stroke="hsl(250, 9%, 46%)" angle={-20} textAnchor="end" height={50} />
                <YAxis tick={{ fontSize: 12 }} stroke="hsl(250, 9%, 46%)" />
                <RechartsTooltip formatter={(v: number, name: string) => [v, name === 'stable' ? 'Stable' : 'Unstable (≥90d)']} />
                <Legend />
                <Bar dataKey="stable" stackId="a" fill={COLORS[2]} name="Stable" />
                <Bar dataKey="unstable" stackId="a" fill={COLORS[5]} name="Unstable ≥90d" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ═══════════════════════════════════════
// ACCELERATION TAB - World-specific
// ═══════════════════════════════════════
function AccelerationTab() {
  const { dataset, world } = useWorld();

  const data = useMemo(() => {
    if (!dataset) return null;

    if (world === 'glp1') {
      // Early discontinuation within 6 months
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
      // Imaging/lab cadence from events_summary
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
      // MRI monitoring cadence - lab events as proxy
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

  if (!dataset || !data) return <div className="text-muted-foreground text-sm p-4">Loading...</div>;

  const trustKey = `acceleration_${world}` as keyof typeof TRUST;

  return (
    <div className="space-y-6">
      {data.type === 'glp1' && (
        <>
          <div className="grid grid-cols-3 gap-4">
            <Card className="border-red-200 bg-red-50/30">
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground">Early Disc. (≤6mo)</p>
                <p className="text-2xl font-bold text-red-500">{data.early}</p>
                <p className="text-xs text-muted-foreground">{((data.early / data.total) * 100).toFixed(1)}% of cohort</p>
              </CardContent>
            </Card>
            <Card className="border-border/50">
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground">Late Disc. (&gt;6mo)</p>
                <p className="text-2xl font-bold text-foreground">{data.late}</p>
              </CardContent>
            </Card>
            <Card className="border-emerald-200 bg-emerald-50/30">
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground">Ongoing</p>
                <p className="text-2xl font-bold text-emerald-600">{data.ongoing}</p>
              </CardContent>
            </Card>
          </div>
          <Card>
            <CardContent className="p-6">
              <ChartHeader
                title="Early vs Late Discontinuation by Cohort Start Month"
                trust={TRUST[trustKey]}
                fields={['lineStartMonth', 'lineEndMonth', 'discontinueFlag']}
                description="GLP-1: Patients who stopped within 6 months of initiation vs. those who continued."
              />
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.timeline}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(250, 13%, 91%)" />
                    <XAxis dataKey="month" tick={{ fontSize: 10 }} stroke="hsl(250, 9%, 46%)" angle={-30} textAnchor="end" height={50} />
                    <YAxis tick={{ fontSize: 12 }} stroke="hsl(250, 9%, 46%)" />
                    <RechartsTooltip />
                    <Legend />
                    <Bar dataKey="early" stackId="a" fill={COLORS[5]} name="Early Disc ≤6mo" />
                    <Bar dataKey="late" stackId="a" fill={COLORS[3]} name="Late Disc >6mo" />
                    <Bar dataKey="ongoing" stackId="a" fill={COLORS[2]} name="Ongoing" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {data.type === 'nsclc' && (
        <>
          <div className="grid grid-cols-2 gap-4">
            <Card className="border-border/50">
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground">Total Lab/Imaging Events</p>
                <p className="text-2xl font-bold text-foreground">{data.totalLabs.toLocaleString()}</p>
              </CardContent>
            </Card>
            <Card className="border-border/50">
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground">Total Diagnosis Events</p>
                <p className="text-2xl font-bold text-foreground">{data.totalDx.toLocaleString()}</p>
              </CardContent>
            </Card>
          </div>
          <Card>
            <CardContent className="p-6">
              <ChartHeader
                title="Metastasis/Biomarker Testing & Imaging Cadence"
                trust={TRUST[trustKey]}
                fields={['eventType=lab', 'eventType=diagnosis', 'month']}
                description="NSCLC: Monthly lab/imaging volume as a proxy for biomarker testing and imaging surveillance."
              />
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={data.labByMonth}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(250, 13%, 91%)" />
                    <XAxis dataKey="month" tick={{ fontSize: 10 }} stroke="hsl(250, 9%, 46%)" angle={-30} textAnchor="end" height={50} />
                    <YAxis tick={{ fontSize: 12 }} stroke="hsl(250, 9%, 46%)" />
                    <RechartsTooltip />
                    <Legend />
                    <Area dataKey="labs" fill={COLORS[0]} fillOpacity={0.15} stroke={COLORS[0]} name="Labs/Imaging" />
                    <Line dataKey="diagnosis" stroke={COLORS[5]} strokeWidth={2} dot={false} name="Diagnosis Events" />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {data.type === 'alzheimer' && (
        <>
          <Card className="border-border/50">
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">Total Monitoring Events (MRI/Lab proxy)</p>
              <p className="text-2xl font-bold text-foreground">{data.totalMonitoring.toLocaleString()}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <ChartHeader
                title="Lecanemab MRI Monitoring Cadence"
                trust={TRUST[trustKey]}
                fields={['eventType=lab', 'eventType=visit', 'month']}
                description="Alzheimer: Monthly monitoring events as proxy for ARIA surveillance MRI cadence."
              />
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={data.cadence}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(250, 13%, 91%)" />
                    <XAxis dataKey="month" tick={{ fontSize: 10 }} stroke="hsl(250, 9%, 46%)" angle={-30} textAnchor="end" height={50} />
                    <YAxis tick={{ fontSize: 12 }} stroke="hsl(250, 9%, 46%)" />
                    <RechartsTooltip />
                    <Legend />
                    <Area dataKey="monitoring" fill={COLORS[0]} fillOpacity={0.15} stroke={COLORS[0]} name="Monitoring (MRI/Lab)" />
                    <Line dataKey="visits" stroke={COLORS[2]} strokeWidth={2} dot={false} name="Visits" />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}

// ═══════════════════════════════════════
// MAIN PAGE
// ═══════════════════════════════════════
export default function JourneyAnalytics() {
  const { world, loading } = useWorld();

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <SiteNav />
      <main className="flex-1 max-w-6xl mx-auto px-6 md:px-10 py-8 w-full">
        <div className="flex items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-foreground tracking-tight">Journey Analytics</h1>
            <p className="text-sm text-muted-foreground mt-1">Patient flow, friction, stability & acceleration across therapy lines.</p>
          </div>
          <WorldSwitcher />
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-64 text-muted-foreground">Loading world data...</div>
        ) : (
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

            <TabsContent value="flow"><FlowTab /></TabsContent>
            <TabsContent value="friction"><FrictionTab /></TabsContent>
            <TabsContent value="stability"><StabilityTab /></TabsContent>
            <TabsContent value="acceleration"><AccelerationTab /></TabsContent>
          </Tabs>
        )}
      </main>
      <SiteFooter />
    </div>
  );
}
