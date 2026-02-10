// Geographic distribution utilities
// Maps US Census regions to states and generates synthetic state/ZIP3 distributions

export interface StateInfo {
  fips: string;
  name: string;
  abbr: string;
  region: string;
  populationWeight: number; // relative weight within region
}

// US Census Bureau region → state mapping with approximate population weights
export const CENSUS_STATES: StateInfo[] = [
  // Northeast
  { fips: '09', name: 'Connecticut', abbr: 'CT', region: 'Northeast', populationWeight: 3.6 },
  { fips: '23', name: 'Maine', abbr: 'ME', region: 'Northeast', populationWeight: 1.4 },
  { fips: '25', name: 'Massachusetts', abbr: 'MA', region: 'Northeast', populationWeight: 7.0 },
  { fips: '33', name: 'New Hampshire', abbr: 'NH', region: 'Northeast', populationWeight: 1.4 },
  { fips: '44', name: 'Rhode Island', abbr: 'RI', region: 'Northeast', populationWeight: 1.1 },
  { fips: '50', name: 'Vermont', abbr: 'VT', region: 'Northeast', populationWeight: 0.6 },
  { fips: '34', name: 'New Jersey', abbr: 'NJ', region: 'Northeast', populationWeight: 9.3 },
  { fips: '36', name: 'New York', abbr: 'NY', region: 'Northeast', populationWeight: 19.5 },
  { fips: '42', name: 'Pennsylvania', abbr: 'PA', region: 'Northeast', populationWeight: 13.0 },
  // Midwest
  { fips: '17', name: 'Illinois', abbr: 'IL', region: 'Midwest', populationWeight: 12.7 },
  { fips: '18', name: 'Indiana', abbr: 'IN', region: 'Midwest', populationWeight: 6.8 },
  { fips: '26', name: 'Michigan', abbr: 'MI', region: 'Midwest', populationWeight: 10.0 },
  { fips: '39', name: 'Ohio', abbr: 'OH', region: 'Midwest', populationWeight: 11.8 },
  { fips: '55', name: 'Wisconsin', abbr: 'WI', region: 'Midwest', populationWeight: 5.9 },
  { fips: '19', name: 'Iowa', abbr: 'IA', region: 'Midwest', populationWeight: 3.2 },
  { fips: '20', name: 'Kansas', abbr: 'KS', region: 'Midwest', populationWeight: 2.9 },
  { fips: '27', name: 'Minnesota', abbr: 'MN', region: 'Midwest', populationWeight: 5.7 },
  { fips: '29', name: 'Missouri', abbr: 'MO', region: 'Midwest', populationWeight: 6.2 },
  { fips: '31', name: 'Nebraska', abbr: 'NE', region: 'Midwest', populationWeight: 2.0 },
  { fips: '38', name: 'North Dakota', abbr: 'ND', region: 'Midwest', populationWeight: 0.8 },
  { fips: '46', name: 'South Dakota', abbr: 'SD', region: 'Midwest', populationWeight: 0.9 },
  // South
  { fips: '10', name: 'Delaware', abbr: 'DE', region: 'South', populationWeight: 1.0 },
  { fips: '11', name: 'District of Columbia', abbr: 'DC', region: 'South', populationWeight: 0.7 },
  { fips: '12', name: 'Florida', abbr: 'FL', region: 'South', populationWeight: 22.2 },
  { fips: '13', name: 'Georgia', abbr: 'GA', region: 'South', populationWeight: 10.9 },
  { fips: '24', name: 'Maryland', abbr: 'MD', region: 'South', populationWeight: 6.2 },
  { fips: '37', name: 'North Carolina', abbr: 'NC', region: 'South', populationWeight: 10.6 },
  { fips: '45', name: 'South Carolina', abbr: 'SC', region: 'South', populationWeight: 5.2 },
  { fips: '51', name: 'Virginia', abbr: 'VA', region: 'South', populationWeight: 8.6 },
  { fips: '54', name: 'West Virginia', abbr: 'WV', region: 'South', populationWeight: 1.8 },
  { fips: '01', name: 'Alabama', abbr: 'AL', region: 'South', populationWeight: 5.1 },
  { fips: '21', name: 'Kentucky', abbr: 'KY', region: 'South', populationWeight: 4.5 },
  { fips: '28', name: 'Mississippi', abbr: 'MS', region: 'South', populationWeight: 3.0 },
  { fips: '47', name: 'Tennessee', abbr: 'TN', region: 'South', populationWeight: 7.0 },
  { fips: '05', name: 'Arkansas', abbr: 'AR', region: 'South', populationWeight: 3.0 },
  { fips: '22', name: 'Louisiana', abbr: 'LA', region: 'South', populationWeight: 4.6 },
  { fips: '40', name: 'Oklahoma', abbr: 'OK', region: 'South', populationWeight: 4.0 },
  { fips: '48', name: 'Texas', abbr: 'TX', region: 'South', populationWeight: 30.0 },
  // West
  { fips: '04', name: 'Arizona', abbr: 'AZ', region: 'West', populationWeight: 7.4 },
  { fips: '08', name: 'Colorado', abbr: 'CO', region: 'West', populationWeight: 5.8 },
  { fips: '16', name: 'Idaho', abbr: 'ID', region: 'West', populationWeight: 1.9 },
  { fips: '30', name: 'Montana', abbr: 'MT', region: 'West', populationWeight: 1.1 },
  { fips: '32', name: 'Nevada', abbr: 'NV', region: 'West', populationWeight: 3.2 },
  { fips: '35', name: 'New Mexico', abbr: 'NM', region: 'West', populationWeight: 2.1 },
  { fips: '49', name: 'Utah', abbr: 'UT', region: 'West', populationWeight: 3.3 },
  { fips: '56', name: 'Wyoming', abbr: 'WY', region: 'West', populationWeight: 0.6 },
  { fips: '02', name: 'Alaska', abbr: 'AK', region: 'West', populationWeight: 0.7 },
  { fips: '06', name: 'California', abbr: 'CA', region: 'West', populationWeight: 39.0 },
  { fips: '15', name: 'Hawaii', abbr: 'HI', region: 'West', populationWeight: 1.4 },
  { fips: '41', name: 'Oregon', abbr: 'OR', region: 'West', populationWeight: 4.2 },
  { fips: '53', name: 'Washington', abbr: 'WA', region: 'West', populationWeight: 7.7 },
];

export interface StatePatientData {
  fips: string;
  name: string;
  abbr: string;
  region: string;
  patients: number;
  density: number; // patients per population weight unit (normalized)
}

export interface ZIP3Data {
  zip3: string;
  state: string;
  region: string;
  patients: number;
  lat: number;
  lng: number;
}

// Seeded pseudo-random for reproducibility
function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return s / 2147483647;
  };
}

export function distributePatientsByState(
  regionCounts: Record<string, number>,
): StatePatientData[] {
  const rng = seededRandom(42);
  const results: StatePatientData[] = [];

  const regions = ['Northeast', 'Midwest', 'South', 'West'];
  for (const region of regions) {
    const totalForRegion = regionCounts[region] || 0;
    const states = CENSUS_STATES.filter((s) => s.region === region);
    const totalWeight = states.reduce((sum, s) => sum + s.populationWeight, 0);

    // Add slight randomness to weights
    const adjustedWeights = states.map((s) => s.populationWeight * (0.85 + rng() * 0.3));
    const adjTotal = adjustedWeights.reduce((sum, w) => sum + w, 0);

    let remaining = totalForRegion;
    states.forEach((state, i) => {
      const share = adjustedWeights[i] / adjTotal;
      const patients = i === states.length - 1 ? remaining : Math.round(totalForRegion * share);
      remaining -= patients;
      results.push({
        fips: state.fips,
        name: state.name,
        abbr: state.abbr,
        region: state.region,
        patients: Math.max(0, patients),
        density: totalWeight > 0 ? (patients / state.populationWeight) : 0,
      });
    });
  }

  return results;
}

// Sample ZIP3 prefixes per state for visualization
const STATE_ZIP3_SAMPLES: Record<string, { zip3: string; lat: number; lng: number }[]> = {
  CA: [
    { zip3: '900', lat: 34.05, lng: -118.25 },
    { zip3: '941', lat: 37.77, lng: -122.42 },
    { zip3: '921', lat: 32.72, lng: -117.16 },
    { zip3: '958', lat: 38.58, lng: -121.49 },
  ],
  TX: [
    { zip3: '770', lat: 29.76, lng: -95.37 },
    { zip3: '752', lat: 32.78, lng: -96.80 },
    { zip3: '782', lat: 29.42, lng: -98.49 },
    { zip3: '787', lat: 30.27, lng: -97.74 },
  ],
  FL: [
    { zip3: '331', lat: 25.76, lng: -80.19 },
    { zip3: '327', lat: 28.54, lng: -81.38 },
    { zip3: '336', lat: 27.95, lng: -82.46 },
    { zip3: '322', lat: 30.33, lng: -81.66 },
  ],
  NY: [
    { zip3: '100', lat: 40.71, lng: -74.01 },
    { zip3: '142', lat: 42.89, lng: -78.88 },
    { zip3: '122', lat: 42.65, lng: -73.76 },
  ],
  IL: [
    { zip3: '606', lat: 41.88, lng: -87.63 },
    { zip3: '617', lat: 40.69, lng: -89.59 },
  ],
  PA: [
    { zip3: '191', lat: 39.95, lng: -75.17 },
    { zip3: '152', lat: 40.44, lng: -80.00 },
  ],
  OH: [
    { zip3: '441', lat: 41.50, lng: -81.69 },
    { zip3: '432', lat: 39.96, lng: -82.99 },
    { zip3: '452', lat: 39.10, lng: -84.51 },
  ],
  GA: [
    { zip3: '303', lat: 33.75, lng: -84.39 },
    { zip3: '310', lat: 32.08, lng: -81.09 },
  ],
  NC: [
    { zip3: '272', lat: 35.78, lng: -78.64 },
    { zip3: '282', lat: 35.23, lng: -80.84 },
  ],
  MI: [
    { zip3: '481', lat: 42.33, lng: -83.05 },
    { zip3: '495', lat: 42.96, lng: -85.66 },
  ],
  NJ: [
    { zip3: '070', lat: 40.74, lng: -74.17 },
    { zip3: '085', lat: 40.22, lng: -74.76 },
  ],
  VA: [
    { zip3: '221', lat: 38.80, lng: -77.05 },
    { zip3: '232', lat: 37.54, lng: -77.44 },
  ],
  WA: [
    { zip3: '981', lat: 47.61, lng: -122.33 },
    { zip3: '992', lat: 47.66, lng: -117.43 },
  ],
  AZ: [
    { zip3: '850', lat: 33.45, lng: -112.07 },
    { zip3: '857', lat: 32.22, lng: -110.97 },
  ],
  MA: [
    { zip3: '021', lat: 42.36, lng: -71.06 },
    { zip3: '015', lat: 42.26, lng: -71.80 },
  ],
  TN: [
    { zip3: '372', lat: 36.16, lng: -86.78 },
    { zip3: '381', lat: 35.15, lng: -90.05 },
  ],
  CO: [
    { zip3: '802', lat: 39.74, lng: -104.99 },
    { zip3: '809', lat: 38.83, lng: -104.82 },
  ],
  MO: [
    { zip3: '631', lat: 38.63, lng: -90.20 },
    { zip3: '641', lat: 39.10, lng: -94.58 },
  ],
  MN: [
    { zip3: '554', lat: 44.98, lng: -93.27 },
  ],
  WI: [
    { zip3: '532', lat: 43.04, lng: -87.91 },
    { zip3: '537', lat: 43.07, lng: -89.40 },
  ],
  IN: [
    { zip3: '462', lat: 39.77, lng: -86.16 },
  ],
};

export function generateZIP3Data(stateData: StatePatientData[]): ZIP3Data[] {
  const rng = seededRandom(123);
  const results: ZIP3Data[] = [];

  for (const state of stateData) {
    const zips = STATE_ZIP3_SAMPLES[state.abbr];
    if (!zips || zips.length === 0) {
      // Create a single synthetic ZIP3 for states without explicit samples
      results.push({
        zip3: state.fips + '0',
        state: state.abbr,
        region: state.region,
        patients: state.patients,
        lat: 39 + (rng() - 0.5) * 10,
        lng: -95 + (rng() - 0.5) * 20,
      });
      continue;
    }

    // Distribute patients across ZIP3s with randomized weighting
    const weights = zips.map(() => 0.5 + rng());
    const totalW = weights.reduce((s, w) => s + w, 0);
    let remaining = state.patients;

    zips.forEach((zip, i) => {
      const pts = i === zips.length - 1 ? remaining : Math.round(state.patients * weights[i] / totalW);
      remaining -= pts;
      results.push({
        zip3: zip.zip3,
        state: state.abbr,
        region: state.region,
        patients: Math.max(0, pts),
        lat: zip.lat,
        lng: zip.lng,
      });
    });
  }

  return results;
}

export const REGION_COLORS: Record<string, string> = {
  Northeast: '#DC2626',
  Midwest: '#B91C1C',
  South: '#991B1B',
  West: '#7F1D1D',
};
