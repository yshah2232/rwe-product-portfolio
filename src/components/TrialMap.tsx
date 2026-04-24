// US Map view of trial results. Shows # of trials with at least one US site
// per state, using react-simple-maps + the public us-atlas TopoJSON.
// Live data: derived from CTG.gov trial.countries (we currently only know
// "US" yes/no per trial, so the map paints all US-listed trials uniformly
// and shows aggregate counts in the legend).

import { useMemo, useState } from 'react';
import { ComposableMap, Geographies, Geography } from 'react-simple-maps';
import { MapPin, Globe } from 'lucide-react';

const GEO_URL = 'https://cdn.jsdelivr.net/npm/us-atlas@3/states-10m.json';

interface TrialLite {
  nctId: string;
  countries: string[];
}

interface Props {
  trials: TrialLite[];
}

const TrialMap = ({ trials }: Props) => {
  const [hovered, setHovered] = useState<string | null>(null);

  const { usCount, intlCount, countryBreakdown } = useMemo(() => {
    let us = 0;
    let intl = 0;
    const countries = new Map<string, number>();
    for (const t of trials) {
      const isUs = t.countries.some((c) => c === 'United States' || c === 'USA');
      if (isUs) us += 1;
      const hasOther = t.countries.some((c) => c !== 'United States' && c !== 'USA');
      if (hasOther) intl += 1;
      for (const c of t.countries) {
        countries.set(c, (countries.get(c) ?? 0) + 1);
      }
    }
    const breakdown = Array.from(countries.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8);
    return { usCount: us, intlCount: intl, countryBreakdown: breakdown };
  }, [trials]);

  // Color states uniformly when there are US-listed trials. Without per-site data,
  // we paint all 50 states with a soft fill and let the legend tell the story.
  const stateFill = usCount > 0 ? 'hsl(var(--primary) / 0.18)' : 'hsl(var(--muted))';
  const stateStroke = 'hsl(var(--border))';

  return (
    <div className="rounded-xl border border-border/60 bg-card overflow-hidden">
      {/* Legend / summary strip */}
      <div className="px-5 py-4 border-b border-border/60 bg-muted/20 flex flex-wrap items-center gap-x-6 gap-y-2 text-[12.5px]">
        <div className="inline-flex items-center gap-2">
          <span className="inline-block w-3 h-3 rounded-sm bg-primary/30 border border-primary/50" />
          <span className="text-muted-foreground">US-listed trials:</span>
          <span className="font-semibold text-foreground">{usCount}</span>
        </div>
        <div className="inline-flex items-center gap-2">
          <Globe className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="text-muted-foreground">Trials with ex-US sites:</span>
          <span className="font-semibold text-foreground">{intlCount}</span>
        </div>
        <div className="ml-auto text-[11px] text-muted-foreground italic">
          State-level site counts not exposed by CTG.gov keyword API · drill-in coming with Module 3 (Sites)
        </div>
      </div>

      {/* US choropleth */}
      <div className="relative bg-background">
        <ComposableMap
          projection="geoAlbersUsa"
          projectionConfig={{ scale: 1000 }}
          width={900}
          height={500}
          style={{ width: '100%', height: 'auto' }}
        >
          <Geographies geography={GEO_URL}>
            {({ geographies }) =>
              geographies.map((geo) => {
                const name = geo.properties.name as string;
                return (
                  <Geography
                    key={geo.rsmKey}
                    geography={geo}
                    onMouseEnter={() => setHovered(name)}
                    onMouseLeave={() => setHovered(null)}
                    style={{
                      default: {
                        fill: stateFill,
                        stroke: stateStroke,
                        strokeWidth: 0.6,
                        outline: 'none',
                      },
                      hover: {
                        fill: 'hsl(var(--primary) / 0.4)',
                        stroke: 'hsl(var(--primary))',
                        strokeWidth: 0.8,
                        outline: 'none',
                        cursor: 'pointer',
                      },
                      pressed: { outline: 'none', fill: 'hsl(var(--primary) / 0.5)' },
                    }}
                  />
                );
              })
            }
          </Geographies>
        </ComposableMap>
        {hovered && (
          <div className="absolute top-3 left-3 px-2.5 py-1.5 rounded-md bg-foreground text-background text-[11px] font-medium shadow-lg pointer-events-none">
            <MapPin className="h-3 w-3 inline-block mr-1" />
            {hovered}
          </div>
        )}
      </div>

      {/* Country breakdown */}
      {countryBreakdown.length > 0 && (
        <div className="px-5 py-4 border-t border-border/60">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-2">
            Trial geography (top countries by # of trials with at least one site)
          </p>
          <div className="flex flex-wrap gap-1.5">
            {countryBreakdown.map(([country, count]) => (
              <span
                key={country}
                className="text-[12px] px-2.5 py-1 rounded-full bg-muted/60 border border-border/50 text-foreground"
              >
                <span className="font-medium">{country}</span>
                <span className="text-muted-foreground ml-1.5">{count}</span>
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default TrialMap;
