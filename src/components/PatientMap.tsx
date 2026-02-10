import { useState, useMemo, useCallback } from 'react';
import {
  ComposableMap,
  Geographies,
  Geography,
  Marker,
} from 'react-simple-maps';
import { Slider } from '@/components/ui/slider';
import { RotateCcw } from 'lucide-react';
import ChartWrapper from './ChartWrapper';
import type { CohortResult } from '@/data/csvDataService';
import {
  distributePatientsByState,
  generateZIP3Data,
  type StatePatientData,
} from '@/data/geoDistribution';

const GEO_URL = 'https://cdn.jsdelivr.net/npm/us-atlas@3/states-10m.json';

type MapViewMode = 'region' | 'state' | 'zip3';

interface PatientMapProps {
  cohort: CohortResult;
}

// Red gradient scale
function getDensityColor(value: number, min: number, max: number): string {
  if (max === min) return 'hsl(0, 60%, 85%)';
  const t = Math.min(1, Math.max(0, (value - min) / (max - min)));
  const s = 50 + t * 22;
  const l = 92 - t * 67;
  return `hsl(0, ${s}%, ${l}%)`;
}

const REGION_FILL: Record<string, { base: string; label: string }> = {
  Northeast: { base: 'hsl(0, 55%, 75%)', label: 'Northeast' },
  Midwest: { base: 'hsl(0, 60%, 60%)', label: 'Midwest' },
  South: { base: 'hsl(0, 65%, 45%)', label: 'South' },
  West: { base: 'hsl(0, 70%, 35%)', label: 'West' },
};

function getRegionColor(region: string, patients: number, minP: number, maxP: number): string {
  if (maxP === minP) return REGION_FILL[region]?.base || 'hsl(0, 50%, 85%)';
  const t = Math.min(1, Math.max(0, (patients - minP) / (maxP - minP)));
  const s = 50 + t * 22;
  const l = 88 - t * 60;
  return `hsl(0, ${s}%, ${l}%)`;
}

const PatientMap = ({ cohort }: PatientMapProps) => {
  const [viewMode, setViewMode] = useState<MapViewMode>('state');
  const [hoveredState, setHoveredState] = useState<StatePatientData | null>(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });
  const [threshold, setThreshold] = useState(0);

  const regionCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    cohort.byRegion.forEach((seg) => { counts[seg.name] = seg.patients; });
    return counts;
  }, [cohort]);

  const stateData = useMemo(() => distributePatientsByState(regionCounts), [regionCounts]);
  const zip3Data = useMemo(() => generateZIP3Data(stateData), [stateData]);

  const stateMap = useMemo(() => {
    const map: Record<string, StatePatientData> = {};
    stateData.forEach((s) => { map[s.fips] = s; });
    return map;
  }, [stateData]);

  // Compute min/max for slider
  const { globalMin, globalMax } = useMemo(() => {
    if (viewMode === 'region') {
      const vals = cohort.byRegion.map((r) => r.patients);
      return { globalMin: Math.min(...vals), globalMax: Math.max(...vals) };
    }
    if (viewMode === 'zip3') {
      const vals = zip3Data.map((z) => z.patients);
      return { globalMin: Math.min(...vals), globalMax: Math.max(...vals) };
    }
    const vals = stateData.map((s) => s.patients);
    return { globalMin: Math.min(...vals), globalMax: Math.max(...vals) };
  }, [viewMode, stateData, zip3Data, cohort]);

  // Filtered data based on threshold
  const filteredStates = useMemo(
    () => stateData.filter((s) => s.patients >= threshold),
    [stateData, threshold],
  );
  const filteredZip3 = useMemo(
    () => zip3Data.filter((z) => z.patients >= threshold),
    [zip3Data, threshold],
  );

  // Dynamic color scale min/max (above threshold)
  const { scaleMin, scaleMax } = useMemo(() => {
    if (viewMode === 'region') {
      const vals = cohort.byRegion.filter((r) => r.patients >= threshold).map((r) => r.patients);
      if (vals.length === 0) return { scaleMin: 0, scaleMax: 1 };
      return { scaleMin: Math.min(...vals), scaleMax: Math.max(...vals) };
    }
    if (viewMode === 'zip3') {
      const vals = filteredZip3.map((z) => z.patients);
      if (vals.length === 0) return { scaleMin: 0, scaleMax: 1 };
      return { scaleMin: Math.min(...vals), scaleMax: Math.max(...vals) };
    }
    const vals = filteredStates.map((s) => s.patients);
    if (vals.length === 0) return { scaleMin: 0, scaleMax: 1 };
    return { scaleMin: Math.min(...vals), scaleMax: Math.max(...vals) };
  }, [viewMode, filteredStates, filteredZip3, cohort, threshold]);

  const filteredStateSet = useMemo(
    () => new Set(filteredStates.map((s) => s.fips)),
    [filteredStates],
  );

  const regionPatientMap = useMemo(() => {
    const m: Record<string, number> = {};
    cohort.byRegion.forEach((r) => { m[r.name] = r.patients; });
    return m;
  }, [cohort]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    setTooltipPos({ x: e.clientX, y: e.clientY });
  }, []);

  const handleReset = useCallback(() => {
    setViewMode('state');
    setThreshold(0);
  }, []);

  // Insight
  const insight = useMemo(() => {
    const sorted = [...stateData].sort((a, b) => b.patients - a.patients);
    const top3 = sorted.slice(0, 3);
    const regionTotals = cohort.byRegion.slice().sort((a, b) => b.patients - a.patients);
    const topRegion = regionTotals[0];
    return `The ${topRegion?.name} region accounts for the highest patient concentration with ${topRegion?.patients.toLocaleString()} patients (${((topRegion?.share ?? 0) * 100).toFixed(0)}% of cohort). At the state level, ${top3[0]?.name} (${top3[0]?.patients.toLocaleString()}), ${top3[1]?.name} (${top3[1]?.patients.toLocaleString()}), and ${top3[2]?.name} (${top3[2]?.patients.toLocaleString()}) are the top contributors.`;
  }, [stateData, cohort]);

  // CSV data
  const csvData = useMemo(() => {
    if (viewMode === 'region') {
      return {
        headers: ['Region', 'Patients', 'Share (%)'],
        rows: cohort.byRegion.sort((a, b) => b.patients - a.patients)
          .map((r) => [r.name, r.patients, +(r.share * 100).toFixed(1)] as (string | number)[]),
      };
    }
    if (viewMode === 'zip3') {
      return {
        headers: ['ZIP3', 'State', 'Region', 'Patients'],
        rows: filteredZip3.sort((a, b) => b.patients - a.patients)
          .map((z) => [z.zip3, z.state, z.region, z.patients] as (string | number)[]),
      };
    }
    return {
      headers: ['State', 'Abbreviation', 'Region', 'Patients'],
      rows: filteredStates.sort((a, b) => b.patients - a.patients)
        .map((s) => [s.name, s.abbr, s.region, s.patients] as (string | number)[]),
    };
  }, [viewMode, filteredStates, filteredZip3, cohort]);

  // Table view
  const tableView = useMemo(() => {
    let rows: { label: string; region: string; patients: number }[];
    if (viewMode === 'region') {
      rows = cohort.byRegion.sort((a, b) => b.patients - a.patients).map((r) => ({
        label: r.name,
        region: `${(r.share * 100).toFixed(1)}% share`,
        patients: r.patients,
      }));
    } else if (viewMode === 'zip3') {
      rows = filteredZip3.sort((a, b) => b.patients - a.patients).slice(0, 50).map((z) => ({
        label: `ZIP3: ${z.zip3}`,
        region: `${z.state} — ${z.region}`,
        patients: z.patients,
      }));
    } else {
      rows = filteredStates.sort((a, b) => b.patients - a.patients).map((s) => ({
        label: `${s.name} (${s.abbr})`,
        region: s.region,
        patients: s.patients,
      }));
    }

    return (
      <div className="max-h-[400px] overflow-auto">
        <table className="w-full text-sm">
          <thead className="sticky top-0 bg-card">
            <tr className="border-b">
              <th className="text-left py-2 px-2 font-medium text-muted-foreground">{viewMode === 'zip3' ? 'ZIP3' : viewMode === 'region' ? 'Region' : 'State'}</th>
              <th className="text-left py-2 px-2 font-medium text-muted-foreground">{viewMode === 'region' ? 'Share' : 'Region'}</th>
              <th className="text-right py-2 px-2 font-medium text-muted-foreground">Patients</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i} className="border-b border-border/30 hover:bg-muted/30">
                <td className="py-1.5 px-2">{r.label}</td>
                <td className="py-1.5 px-2 text-muted-foreground">{r.region}</td>
                <td className="py-1.5 px-2 text-right font-medium">{r.patients.toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }, [viewMode, filteredStates, filteredZip3, cohort]);

  return (
    <ChartWrapper
      title="Patient Geographic Distribution"
      subtitle="Simulated distribution based on Census region data"
      insight={insight}
      csvData={csvData}
      tableView={tableView}
    >
      {/* Controls row */}
      <div className="flex flex-wrap items-center gap-3 mb-3">
        {/* View tabs */}
        <div className="inline-flex rounded-lg border border-border/60 p-0.5 bg-muted/30">
          {(['region', 'state', 'zip3'] as MapViewMode[]).map((mode) => (
            <button
              key={mode}
              onClick={() => mode !== 'zip3' && setViewMode(mode)}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                mode === 'zip3'
                  ? 'text-muted-foreground/40 cursor-not-allowed'
                  : viewMode === mode
                    ? 'bg-card text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
              }`}
              disabled={mode === 'zip3'}
              title={mode === 'zip3' ? 'ZIP3 boundary view — Work in Progress' : undefined}
            >
              {mode === 'zip3' ? 'ZIP3 (WIP)' : mode.charAt(0).toUpperCase() + mode.slice(1)}
            </button>
          ))}
        </div>

        {/* Reset */}
        <button
          onClick={handleReset}
          className="p-1.5 rounded-md hover:bg-muted transition-colors text-muted-foreground/50 hover:text-muted-foreground"
          aria-label="Reset map"
          title="Reset to default"
        >
          <RotateCcw className="h-3.5 w-3.5" />
        </button>

        <span className="text-[10px] text-muted-foreground italic">
          Distribution simulated from region-level data
        </span>
      </div>

      {/* Merged color index + slider */}
      <div className="mb-3 px-1 rounded-lg border border-border/40 bg-muted/20 p-3 space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
            Patient Density Index
          </label>
          <span className="text-xs font-medium text-foreground">
            {threshold > 0 ? `Showing ≥ ${threshold.toLocaleString()}` : 'Showing all'}
          </span>
        </div>

        {/* Color gradient bar with min/max labels */}
        <div>
          <div
            className="w-full h-3 rounded-full"
            style={{
              background: 'linear-gradient(to right, hsl(0, 50%, 92%), hsl(0, 60%, 70%), hsl(0, 65%, 50%), hsl(0, 72%, 25%))',
            }}
          />
          <div className="flex justify-between mt-0.5">
            <span className="text-[10px] font-medium text-muted-foreground">{scaleMin.toLocaleString()} patients</span>
            <span className="text-[10px] font-medium text-muted-foreground">{scaleMax.toLocaleString()} patients</span>
          </div>
        </div>

        {/* Slider on the gradient */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] text-muted-foreground">Filter threshold</span>
          </div>
          <Slider
            value={[threshold]}
            onValueChange={([v]) => setThreshold(v)}
            min={0}
            max={globalMax}
            step={Math.max(1, Math.floor(globalMax / 100))}
            className="w-full"
          />
          <div className="flex justify-between mt-0.5">
            <span className="text-[10px] text-muted-foreground">0</span>
            <span className="text-[10px] text-muted-foreground">{globalMax.toLocaleString()}</span>
          </div>
        </div>

        {/* Region color key (visible in region mode) */}
        {viewMode === 'region' && (
          <div className="flex flex-wrap gap-x-4 gap-y-1 pt-1 border-t border-border/30">
            {cohort.byRegion.sort((a, b) => b.patients - a.patients).map((r) => (
              <div key={r.name} className="flex items-center gap-1.5">
                <div
                  className="w-3 h-3 rounded-sm border border-border/40"
                  style={{ backgroundColor: getRegionColor(r.name, r.patients, scaleMin, scaleMax) }}
                />
                <span className="text-[10px] text-foreground font-medium">{r.name}</span>
                <span className="text-[10px] text-muted-foreground">({r.patients.toLocaleString()})</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="relative" onMouseMove={handleMouseMove}>
        <ComposableMap
          projection="geoAlbersUsa"
          projectionConfig={{ scale: 1000 }}
          width={800}
          height={500}
          style={{ width: '100%', height: 'auto' }}
        >
          <Geographies geography={GEO_URL}>
            {({ geographies }) =>
              geographies.map((geo) => {
                const fips = geo.id;
                const stateInfo = stateMap[fips];

                let fill = '#f0f0f0';
                if (viewMode === 'region' && stateInfo) {
                  const regionPts = regionPatientMap[stateInfo.region] || 0;
                  if (regionPts >= threshold) {
                    fill = getRegionColor(stateInfo.region, regionPts, scaleMin, scaleMax);
                  }
                } else if (stateInfo && filteredStateSet.has(fips)) {
                  fill = getDensityColor(stateInfo.patients, scaleMin, scaleMax);
                }

                return (
                  <Geography
                    key={geo.rsmKey}
                    geography={geo}
                    fill={fill}
                    stroke="#ffffff"
                    strokeWidth={viewMode === 'region' ? 0.3 : 0.5}
                    style={{
                      default: { outline: 'none' },
                      hover: { outline: 'none', strokeWidth: 1.5, stroke: '#333' },
                      pressed: { outline: 'none' },
                    }}
                    onMouseEnter={() => stateInfo && setHoveredState(stateInfo)}
                    onMouseLeave={() => setHoveredState(null)}
                  />
                );
              })
            }
          </Geographies>

          {/* ZIP3 heatmap overlay */}
          {viewMode === 'zip3' &&
            filteredZip3.map((z) => {
              const t = scaleMax > 0 ? Math.min(1, (z.patients - scaleMin) / (scaleMax - scaleMin || 1)) : 0;
              const radius = Math.max(6, Math.min(22, t * 24));
              const s = 50 + t * 22;
              const l = 80 - t * 50;
              return (
                <Marker key={`${z.state}-${z.zip3}`} coordinates={[z.lng, z.lat]}>
                  <circle
                    r={radius}
                    fill={`hsl(0, ${s}%, ${l}%)`}
                    stroke="none"
                    opacity={0.55 + t * 0.3}
                  />
                  <circle
                    r={radius * 0.5}
                    fill={`hsl(0, ${s + 5}%, ${l - 15}%)`}
                    stroke="none"
                    opacity={0.7 + t * 0.2}
                  />
                </Marker>
              );
            })}
        </ComposableMap>

        {/* Tooltip */}
        {hoveredState && (
          <div
            className="fixed z-50 pointer-events-none rounded-lg border bg-card p-3 shadow-lg text-card-foreground"
            style={{ left: tooltipPos.x + 12, top: tooltipPos.y - 40 }}
          >
            <p className="text-sm font-semibold">{hoveredState.name} ({hoveredState.abbr})</p>
            <p className="text-xs text-muted-foreground">{hoveredState.region} region</p>
            <p className="text-sm font-bold mt-1" style={{ color: 'hsl(0, 72%, 40%)' }}>
              {hoveredState.patients.toLocaleString()} patients
            </p>
          </div>
        )}
      </div>
    </ChartWrapper>
  );
};

export default PatientMap;
