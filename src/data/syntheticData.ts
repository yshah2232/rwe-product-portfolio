// Seeded pseudo-random number generator for reproducible synthetic data
class SeededRNG {
  private seed: number;
  constructor(seed: number) {
    this.seed = seed;
  }
  next(): number {
    this.seed = (this.seed * 16807) % 2147483647;
    return (this.seed - 1) / 2147483646;
  }
}

const rng = new SeededRNG(42);

const TOTAL_PATIENTS = 100000;

export const BRANDS = ['Ozempic', 'Wegovy', 'Mounjaro', 'Zepbound'];
export const PAYERS = ['Commercial', 'Medicare', 'Medicaid', 'Cash'];
export const INDICATIONS = ['Type 2 Diabetes', 'Weight Management', 'Cardiovascular'];

const BRAND_DIST: Record<string, number> = {
  Ozempic: 0.35,
  Wegovy: 0.20,
  Mounjaro: 0.30,
  Zepbound: 0.15,
};

const PAYER_DIST: Record<string, number> = {
  Commercial: 0.45,
  Medicare: 0.25,
  Medicaid: 0.20,
  Cash: 0.10,
};

const INDICATION_DIST: Record<string, number> = {
  'Type 2 Diabetes': 0.60,
  'Weight Management': 0.30,
  Cardiovascular: 0.10,
};

interface WeibullParams {
  pInf: number;
  lambda: number;
  k: number;
}

const OVERALL_PARAMS: WeibullParams = { pInf: 0.35, lambda: 180, k: 0.65 };

const BRAND_PARAMS: Record<string, WeibullParams> = {
  Ozempic: { pInf: 0.42, lambda: 200, k: 0.70 },
  Wegovy: { pInf: 0.30, lambda: 160, k: 0.60 },
  Mounjaro: { pInf: 0.37, lambda: 185, k: 0.68 },
  Zepbound: { pInf: 0.25, lambda: 150, k: 0.58 },
};

const PAYER_PARAMS: Record<string, WeibullParams> = {
  Commercial: { pInf: 0.40, lambda: 200, k: 0.70 },
  Medicare: { pInf: 0.32, lambda: 170, k: 0.65 },
  Medicaid: { pInf: 0.22, lambda: 140, k: 0.55 },
  Cash: { pInf: 0.12, lambda: 110, k: 0.45 },
};

const INDICATION_PARAMS: Record<string, WeibullParams> = {
  'Type 2 Diabetes': { pInf: 0.40, lambda: 190, k: 0.70 },
  'Weight Management': { pInf: 0.25, lambda: 150, k: 0.55 },
  Cardiovascular: { pInf: 0.42, lambda: 200, k: 0.72 },
};

function weibullSurvival(day: number, params: WeibullParams): number {
  const { pInf, lambda, k } = params;
  return pInf + (1 - pInf) * Math.exp(-Math.pow(day / lambda, k));
}

function addNoise(value: number): number {
  const noise = rng.next() * 0.03 - 0.015;
  return Math.max(0, Math.min(1, value + noise));
}

export interface DailySnapshot {
  day: number;
  date: string;
  overall: {
    activeRate: number;
    dropOffRate: number;
    totalPatients: number;
    activePatients: number;
    medianRefillGap: number;
  };
  byBrand: Record<string, { activeRate: number; patients: number; activePatients: number }>;
  byPayer: Record<string, { activeRate: number; dropOffRate: number; patients: number; activePatients: number }>;
  byIndication: Record<string, { activeRate: number; patients: number; activePatients: number }>;
}

function generateDailyData(): DailySnapshot[] {
  const data: DailySnapshot[] = [];
  const indexDate = new Date('2024-01-01');

  for (let day = 0; day <= 365; day++) {
    const date = new Date(indexDate);
    date.setDate(date.getDate() + day);
    const dateStr = date.toISOString().split('T')[0];

    const overallRate = day === 0 ? 1 : addNoise(weibullSurvival(day, OVERALL_PARAMS));
    const medianRefillGap = 2 + (day / 365) * 10 + rng.next() * 2;

    const byBrand: Record<string, { activeRate: number; patients: number; activePatients: number }> = {};
    for (const brand of BRANDS) {
      const rate = day === 0 ? 1 : addNoise(weibullSurvival(day, BRAND_PARAMS[brand]));
      const patients = Math.round(TOTAL_PATIENTS * BRAND_DIST[brand]);
      byBrand[brand] = {
        activeRate: rate,
        patients,
        activePatients: Math.round(patients * rate),
      };
    }

    const byPayer: Record<string, { activeRate: number; dropOffRate: number; patients: number; activePatients: number }> = {};
    for (const payer of PAYERS) {
      const rate = day === 0 ? 1 : addNoise(weibullSurvival(day, PAYER_PARAMS[payer]));
      const patients = Math.round(TOTAL_PATIENTS * PAYER_DIST[payer]);
      byPayer[payer] = {
        activeRate: rate,
        dropOffRate: 1 - rate,
        patients,
        activePatients: Math.round(patients * rate),
      };
    }

    const byIndication: Record<string, { activeRate: number; patients: number; activePatients: number }> = {};
    for (const indication of INDICATIONS) {
      const rate = day === 0 ? 1 : addNoise(weibullSurvival(day, INDICATION_PARAMS[indication]));
      const patients = Math.round(TOTAL_PATIENTS * INDICATION_DIST[indication]);
      byIndication[indication] = {
        activeRate: rate,
        patients,
        activePatients: Math.round(patients * rate),
      };
    }

    data.push({
      day,
      date: dateStr,
      overall: {
        activeRate: overallRate,
        dropOffRate: 1 - overallRate,
        totalPatients: TOTAL_PATIENTS,
        activePatients: Math.round(TOTAL_PATIENTS * overallRate),
        medianRefillGap: Math.round(medianRefillGap * 10) / 10,
      },
      byBrand,
      byPayer,
      byIndication,
    });
  }

  return data;
}

const DAILY_DATA = generateDailyData();

export function getDailyData(): DailySnapshot[] {
  return DAILY_DATA;
}

const INDEX_DATE_MS = new Date('2024-01-01').getTime();

export function dateToDayNumber(dateStr: string): number {
  const dateMs = new Date(dateStr).getTime();
  return Math.max(0, Math.min(365, Math.round((dateMs - INDEX_DATE_MS) / (1000 * 60 * 60 * 24))));
}

export type Granularity = 'daily' | 'weekly' | '36days' | '72days';

export function aggregateData(
  data: DailySnapshot[],
  startDay: number,
  endDay: number,
  granularity: Granularity,
): DailySnapshot[] {
  const filtered = data.filter((d) => d.day >= startDay && d.day <= endDay);
  if (filtered.length === 0) return [];

  const interval =
    granularity === 'daily' ? 1 :
    granularity === 'weekly' ? 7 :
    granularity === '36days' ? 36 : 72;

  if (interval === 1) return filtered;

  const result: DailySnapshot[] = [];
  for (let i = 0; i < filtered.length; i += interval) {
    const endIdx = Math.min(i + interval - 1, filtered.length - 1);
    result.push(filtered[endIdx]);
  }

  const lastFiltered = filtered[filtered.length - 1];
  if (result.length > 0 && result[result.length - 1].day !== lastFiltered.day) {
    result.push(lastFiltered);
  }

  return result;
}

export interface KPIData {
  totalPatients: number;
  activeRate: number;
  dropOffRate: number;
  medianRefillGap: number;
}

export function getKPIs(data: DailySnapshot[], endDay: number): KPIData {
  const snapshot = data[Math.min(endDay, data.length - 1)];
  return {
    totalPatients: snapshot.overall.totalPatients,
    activeRate: snapshot.overall.activeRate,
    dropOffRate: snapshot.overall.dropOffRate,
    medianRefillGap: snapshot.overall.medianRefillGap,
  };
}

export type FilterType = 'payer' | 'brand' | 'indication';

export interface ActiveFilter {
  type: FilterType;
  value: string;
}

export function getFilteredKPIs(data: DailySnapshot[], endDay: number, filter: ActiveFilter): KPIData {
  const snapshot = data[Math.min(endDay, data.length - 1)];
  if (filter.type === 'payer') {
    const seg = snapshot.byPayer[filter.value];
    return {
      totalPatients: seg.patients,
      activeRate: seg.activeRate,
      dropOffRate: seg.dropOffRate,
      medianRefillGap: snapshot.overall.medianRefillGap,
    };
  }
  if (filter.type === 'brand') {
    const seg = snapshot.byBrand[filter.value];
    return {
      totalPatients: seg.patients,
      activeRate: seg.activeRate,
      dropOffRate: 1 - seg.activeRate,
      medianRefillGap: snapshot.overall.medianRefillGap,
    };
  }
  const seg = snapshot.byIndication[filter.value];
  return {
    totalPatients: seg.patients,
    activeRate: seg.activeRate,
    dropOffRate: 1 - seg.activeRate,
    medianRefillGap: snapshot.overall.medianRefillGap,
  };
}

// Chart color constants — distinct, accessible palette
export const CHART_COLORS = {
  primary: '#DC2626',
  blue: '#2563EB',
  emerald: '#059669',
  amber: '#D97706',
  purple: '#7C3AED',
};

export const BRAND_COLORS: Record<string, string> = {
  Ozempic: '#DC2626',
  Wegovy: '#2563EB',
  Mounjaro: '#059669',
  Zepbound: '#D97706',
};

export const PAYER_COLORS: Record<string, string> = {
  Commercial: '#2563EB',
  Medicare: '#059669',
  Medicaid: '#D97706',
  Cash: '#DC2626',
};

export const INDICATION_COLORS: Record<string, string> = {
  'Type 2 Diabetes': '#DC2626',
  'Weight Management': '#2563EB',
  Cardiovascular: '#059669',
};
