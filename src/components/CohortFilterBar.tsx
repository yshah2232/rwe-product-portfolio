import { useState, useMemo } from 'react';
import { useWorld } from '@/contexts/WorldContext';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Filter, ChevronDown, X, Users, Calendar, FileCode2 } from 'lucide-react';
import type { Codeset, Patient, Journey } from '@/data/engine/types';

export interface CohortFilters {
  selectedICD: string[];
  selectedNDC: string[];
  monthRange: [number, number]; // indices into sorted months array
}

interface CohortFilterBarProps {
  filters: CohortFilters;
  onFiltersChange: (f: CohortFilters) => void;
  filteredPatientCount: number;
  totalPatientCount: number;
  diagnosisOnlyCount: number;
}

export default function CohortFilterBar({
  filters,
  onFiltersChange,
  filteredPatientCount,
  totalPatientCount,
  diagnosisOnlyCount,
}: CohortFilterBarProps) {
  const { dataset } = useWorld();

  const { icdCodes, ndcCodes, allMonths } = useMemo(() => {
    if (!dataset) return { icdCodes: [], ndcCodes: [], allMonths: [] };
    const codesets = dataset.codesets || [];
    const icd = codesets.filter(c => c.codeSystem === 'ICD10');
    const ndc = codesets.filter(c => c.codeSystem === 'NDC');

    // Get unique months from patients diagnosisMonth
    const months = [...new Set(dataset.patients.map(p => String(p.diagnosisMonth)))].filter(Boolean).sort();

    return { icdCodes: icd, ndcCodes: ndc, allMonths: months };
  }, [dataset]);

  const hasActiveFilters = filters.selectedICD.length > 0 || filters.selectedNDC.length > 0 ||
    filters.monthRange[0] !== 0 || filters.monthRange[1] !== Math.max(0, allMonths.length - 1);

  const formatMonth = (idx: number) => {
    if (!allMonths[idx]) return '';
    const m = allMonths[idx];
    // e.g. "2024-03" -> "Mar 2024"
    const [y, mo] = String(m).split('-');
    const names = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    return `${names[parseInt(mo) - 1] || mo} ${y}`;
  };

  const toggleCode = (type: 'icd' | 'ndc', code: string) => {
    const key = type === 'icd' ? 'selectedICD' : 'selectedNDC';
    const current = filters[key];
    const next = current.includes(code) ? current.filter(c => c !== code) : [...current, code];
    onFiltersChange({ ...filters, [key]: next });
  };

  const clearAll = () => {
    onFiltersChange({ selectedICD: [], selectedNDC: [], monthRange: [0, Math.max(0, allMonths.length - 1)] });
  };

  if (!dataset) return null;

  return (
    <div className="rounded-xl border border-border/50 bg-card p-4 space-y-4">
      {/* Top row: filter controls */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <Filter className="h-4 w-4 text-primary" />
          Cohort Filters
        </div>

        {/* ICD Codes */}
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className="gap-1.5 h-8 text-xs">
              <FileCode2 className="h-3.5 w-3.5" />
              ICD-10 Codes
              {filters.selectedICD.length > 0 && (
                <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-[10px]">{filters.selectedICD.length}</Badge>
              )}
              <ChevronDown className="h-3 w-3 ml-0.5" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80 max-h-72 overflow-auto p-3" align="start">
            <p className="text-xs font-semibold text-muted-foreground mb-2">Diagnosis Codes (ICD-10)</p>
            <div className="space-y-1.5">
              {icdCodes.map(c => (
                <label key={c.code} className="flex items-start gap-2 cursor-pointer hover:bg-muted/40 rounded-md p-1.5 transition-colors">
                  <Checkbox
                    checked={filters.selectedICD.includes(c.code)}
                    onCheckedChange={() => toggleCode('icd', c.code)}
                    className="mt-0.5"
                  />
                  <div className="text-xs">
                    <span className="font-mono font-semibold text-foreground">{c.code}</span>
                    <span className="text-muted-foreground ml-1.5">{c.plainDescription}</span>
                  </div>
                </label>
              ))}
              {icdCodes.length === 0 && <p className="text-xs text-muted-foreground">No ICD-10 codes available</p>}
            </div>
          </PopoverContent>
        </Popover>

        {/* NDC Codes */}
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className="gap-1.5 h-8 text-xs">
              <FileCode2 className="h-3.5 w-3.5" />
              NDC / Drug Codes
              {filters.selectedNDC.length > 0 && (
                <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-[10px]">{filters.selectedNDC.length}</Badge>
              )}
              <ChevronDown className="h-3 w-3 ml-0.5" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80 max-h-72 overflow-auto p-3" align="start">
            <p className="text-xs font-semibold text-muted-foreground mb-2">Drug / Product Codes (NDC)</p>
            <div className="space-y-1.5">
              {ndcCodes.map(c => (
                <label key={c.code} className="flex items-start gap-2 cursor-pointer hover:bg-muted/40 rounded-md p-1.5 transition-colors">
                  <Checkbox
                    checked={filters.selectedNDC.includes(c.code)}
                    onCheckedChange={() => toggleCode('ndc', c.code)}
                    className="mt-0.5"
                  />
                  <div className="text-xs">
                    <span className="font-mono font-semibold text-foreground">{c.code}</span>
                    <span className="text-muted-foreground ml-1.5">{c.plainDescription}</span>
                  </div>
                </label>
              ))}
              {ndcCodes.length === 0 && <p className="text-xs text-muted-foreground">No NDC codes available</p>}
            </div>
          </PopoverContent>
        </Popover>

        {/* Date range */}
        {allMonths.length > 1 && (
          <div className="flex items-center gap-3 ml-auto">
            <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
            <div className="flex flex-col gap-1 min-w-[220px]">
              <div className="flex justify-between text-[10px] text-muted-foreground">
                <span>{formatMonth(filters.monthRange[0])}</span>
                <span>{formatMonth(filters.monthRange[1])}</span>
              </div>
              <Slider
                min={0}
                max={allMonths.length - 1}
                step={1}
                value={filters.monthRange}
                onValueChange={(v) => onFiltersChange({ ...filters, monthRange: v as [number, number] })}
                className="w-full"
              />
            </div>
          </div>
        )}

        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={clearAll} className="h-8 text-xs text-muted-foreground gap-1">
            <X className="h-3 w-3" /> Clear
          </Button>
        )}
      </div>

      {/* Active filter badges */}
      {hasActiveFilters && (
        <div className="flex flex-wrap items-center gap-1.5">
          {filters.selectedICD.map(code => (
            <Badge key={code} variant="outline" className="gap-1 text-[10px] font-mono cursor-pointer hover:bg-destructive/10"
              onClick={() => toggleCode('icd', code)}>
              ICD: {code} <X className="h-2.5 w-2.5" />
            </Badge>
          ))}
          {filters.selectedNDC.map(code => (
            <Badge key={code} variant="outline" className="gap-1 text-[10px] font-mono cursor-pointer hover:bg-destructive/10"
              onClick={() => toggleCode('ndc', code)}>
              NDC: {code} <X className="h-2.5 w-2.5" />
            </Badge>
          ))}
        </div>
      )}

      {/* Cohort summary stats */}
      <div className="flex flex-wrap items-center gap-4 pt-1 border-t border-border/30">
        <div className="flex items-center gap-2">
          <Users className="h-3.5 w-3.5 text-primary" />
          <span className="text-sm font-bold text-foreground">{filteredPatientCount.toLocaleString()}</span>
          <span className="text-xs text-muted-foreground">patients matched</span>
          {filteredPatientCount < totalPatientCount && (
            <span className="text-[10px] text-muted-foreground/70">of {totalPatientCount.toLocaleString()} total</span>
          )}
        </div>
        <div className="h-4 w-px bg-border/50" />
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-muted-foreground">Diagnosis-only qualification:</span>
          <span className="text-xs font-semibold text-foreground">{diagnosisOnlyCount.toLocaleString()}</span>
        </div>
      </div>
    </div>
  );
}

/**
 * Hook to apply cohort filters to patients and journeys.
 */
export function useFilteredCohort(
  filters: CohortFilters,
  allMonths: string[],
) {
  const { dataset } = useWorld();

  return useMemo(() => {
    if (!dataset) return { patients: [], journeys: [], diagnosisOnlyCount: 0 };

    const patients = dataset.patients;
    const journeys = dataset.journeys;

    // Month range filter
    const startMonth = allMonths[filters.monthRange[0]] || '';
    const endMonth = allMonths[filters.monthRange[1]] || '';

    let filteredPatients = patients;

    // Filter by month range
    if (startMonth && endMonth) {
      filteredPatients = filteredPatients.filter(p => {
        const dm = String(p.diagnosisMonth);
        return dm >= startMonth && dm <= endMonth;
      });
    }

    // Diagnosis-only count (before NDC filter)
    const diagnosisOnlyCount = filteredPatients.length;

    // Note: ICD and NDC filters are conceptual — they show which codes define the cohort.
    // Since our synthetic data doesn't have per-patient code-level detail, 
    // we treat them as informational. The cohort is filtered by month range.

    const patientIds = new Set(filteredPatients.map(p => p.patientId));
    const filteredJourneys = journeys.filter(j => patientIds.has(j.patientId));

    return { patients: filteredPatients, journeys: filteredJourneys, diagnosisOnlyCount };
  }, [dataset, filters, allMonths]);
}
