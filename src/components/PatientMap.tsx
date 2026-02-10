import { useState, useMemo, useCallback } from 'react';
import {
  ComposableMap,
  Geographies,
  Geography,
  Marker,
} from 'react-simple-maps';
import ChartWrapper from './ChartWrapper';
import type { CohortResult } from '@/data/csvDataService';
import {
  distributePatientsByState,
  generateZIP3Data,
  type StatePatientData,
  type ZIP3Data,
} from '@/data/geoDistribution';

const GEO_URL = 'https://cdn.jsdelivr.net/npm/us-atlas@3/states-10m.json';

interface PatientMapProps {
  cohort: CohortResult;
}

// Red gradient scale: light → medium → dark
function getDensityColor(value: number, min: number, max: number): string {
  if (max === min) return 'hsl(0, 60%, 85%)';
  const t = Math.min(1, Math.max(0, (value - min) / (max - min)));
  // HSL: hue=0 (red), saturation 50→72%, lightness 92→25%
  const s = 50 + t * 22;
  const l = 92 - t * 67;
  return `hsl(0, ${s}%, ${l}%)`;
}

function getZIP3Color(patients: number, max: number): string {
  if (max === 0) return 'hsl(0, 60%, 85%)';
  const t = Math.min(1, patients / max);
  const s = 50 + t * 22;
  const l = 92 - t * 67;
  return `hsl(0, ${s}%, ${l}%)`;
}

const PatientMap = ({ cohort }: PatientMapProps) => {
  const [viewMode, setViewMode] = useState<'state' | 'zip3'>('state');
  const [hoveredState, setHoveredState] = useState<StatePatientData | null>(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });

  // Build region counts from cohort
  const regionCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    cohort.byRegion.forEach((seg) => {
      counts[seg.name] = seg.patients;
    });
    return counts;
  }, [cohort]);

  const stateData = useMemo(() => distributePatientsByState(regionCounts), [regionCounts]);
  const zip3Data = useMemo(() => generateZIP3Data(stateData), [stateData]);

  const stateMap = useMemo(() => {
    const map: Record<string, StatePatientData> = {};
    stateData.forEach((s) => { map[s.fips] = s; });
    return map;
  }, [stateData]);

  const { minPatients, maxPatients } = useMemo(() => {
    const pts = stateData.map((s) => s.patients);
    return { minPatients: Math.min(...pts), maxPatients: Math.max(...pts) };
  }, [stateData]);

  const maxZip3 = useMemo(() => Math.max(...zip3Data.map((z) => z.patients)), [zip3Data]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    setTooltipPos({ x: e.clientX, y: e.clientY });
  }, []);

  // Generate insight
  const insight = useMemo(() => {
    const sorted = [...stateData].sort((a, b) => b.patients - a.patients);
    const top3 = sorted.slice(0, 3);
    const regionTotals = cohort.byRegion
      .slice()
      .sort((a, b) => b.patients - a.patients);
    const topRegion = regionTotals[0];
    return `The ${topRegion?.name} region accounts for the highest patient concentration with ${topRegion?.patients.toLocaleString()} patients (${((topRegion?.share ?? 0) * 100).toFixed(0)}% of cohort). At the state level, ${top3[0]?.name} (${top3[0]?.patients.toLocaleString()}), ${top3[1]?.name} (${top3[1]?.patients.toLocaleString()}), and ${top3[2]?.name} (${top3[2]?.patients.toLocaleString()}) are the top contributors. This distribution aligns with population density and GLP-1 prescribing patterns in metro areas.`;
  }, [stateData, cohort]);

  // CSV data
  const csvData = useMemo(() => {
    if (viewMode === 'state') {
      return {
        headers: ['State', 'Abbreviation', 'Region', 'Patients'],
        rows: stateData
          .sort((a, b) => b.patients - a.patients)
          .map((s) => [s.name, s.abbr, s.region, s.patients] as (string | number)[]),
      };
    }
    return {
      headers: ['ZIP3', 'State', 'Region', 'Patients'],
      rows: zip3Data
        .sort((a, b) => b.patients - a.patients)
        .map((z) => [z.zip3, z.state, z.region, z.patients] as (string | number)[]),
    };
  }, [viewMode, stateData, zip3Data]);

  // Table view
  const tableView = useMemo(() => {
    const rows = viewMode === 'state'
      ? stateData.sort((a, b) => b.patients - a.patients).map((s) => ({
          label: `${s.name} (${s.abbr})`,
          region: s.region,
          patients: s.patients,
        }))
      : zip3Data.sort((a, b) => b.patients - a.patients).slice(0, 50).map((z) => ({
          label: `ZIP3: ${z.zip3}`,
          region: `${z.state} — ${z.region}`,
          patients: z.patients,
        }));

    return (
      <div className="max-h-[400px] overflow-auto">
        <table className="w-full text-sm">
          <thead className="sticky top-0 bg-card">
            <tr className="border-b">
              <th className="text-left py-2 px-2 font-medium text-muted-foreground">{viewMode === 'state' ? 'State' : 'ZIP3'}</th>
              <th className="text-left py-2 px-2 font-medium text-muted-foreground">Region</th>
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
  }, [viewMode, stateData, zip3Data]);

  return (
    <ChartWrapper
      title="Patient Geographic Distribution"
      subtitle="Simulated state-level distribution based on Census region data"
      insight={insight}
      csvData={csvData}
      tableView={tableView}
    >
      {/* Toggle */}
      <div className="flex items-center gap-2 mb-3">
        <div className="inline-flex rounded-lg border border-border/60 p-0.5 bg-muted/30">
          <button
            onClick={() => setViewMode('state')}
            className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${viewMode === 'state' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
          >
            State View
          </button>
          <button
            onClick={() => setViewMode('zip3')}
            className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${viewMode === 'zip3' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
          >
            ZIP3 View
          </button>
        </div>
        <span className="text-[10px] text-muted-foreground italic">
          Distribution simulated from region-level data using population weights
        </span>
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
                const fill = stateInfo
                  ? getDensityColor(stateInfo.patients, minPatients, maxPatients)
                  : '#f5f5f5';

                return (
                  <Geography
                    key={geo.rsmKey}
                    geography={geo}
                    fill={fill}
                    stroke="#ffffff"
                    strokeWidth={0.5}
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

          {/* ZIP3 markers */}
          {viewMode === 'zip3' &&
            zip3Data.map((z) => (
              <Marker key={z.zip3} coordinates={[z.lng, z.lat]}>
                <circle
                  r={Math.max(3, Math.min(12, (z.patients / maxZip3) * 14))}
                  fill={getZIP3Color(z.patients, maxZip3)}
                  stroke="#fff"
                  strokeWidth={0.8}
                  opacity={0.85}
                />
              </Marker>
            ))}
        </ComposableMap>

        {/* Custom tooltip */}
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

        {/* Gradient legend */}
        <div className="absolute bottom-2 right-2 flex items-center gap-2 bg-card/90 backdrop-blur-sm rounded-lg border px-3 py-2">
          <span className="text-[10px] text-muted-foreground font-medium">Low</span>
          <div
            className="w-24 h-3 rounded-full"
            style={{
              background: 'linear-gradient(to right, hsl(0, 50%, 92%), hsl(0, 60%, 60%), hsl(0, 72%, 25%))',
            }}
          />
          <span className="text-[10px] text-muted-foreground font-medium">High</span>
        </div>
      </div>
    </ChartWrapper>
  );
};

export default PatientMap;
