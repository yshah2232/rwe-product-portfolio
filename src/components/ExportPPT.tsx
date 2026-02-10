import { useState, useCallback } from 'react';
import { FileDown, Loader2 } from 'lucide-react';
import type { KPIData, SegmentSnapshot, CohortResult, PersistenceCurvePoint } from '@/data/csvDataService';

interface ExportPPTProps {
  kpis: KPIData;
  segmentSnapshot: SegmentSnapshot;
  cohort: CohortResult;
  curveData: PersistenceCurvePoint[];
  startDate: string;
  endDate: string;
}

const ExportPPT = ({ kpis, segmentSnapshot, cohort, curveData, startDate, endDate }: ExportPPTProps) => {
  const [exporting, setExporting] = useState(false);

  const handleExport = useCallback(async () => {
    setExporting(true);
    try {
      const pptxgen = (await import('pptxgenjs')).default;
      const pptx = new pptxgen();
      pptx.layout = 'LAYOUT_WIDE';
      pptx.author = 'GLP-1 Patient Insights';
      pptx.title = 'GLP-1 Patient Insights Dashboard';

      // Title slide
      const slide1 = pptx.addSlide();
      slide1.addText('GLP-1 Patient Insights', { x: 0.5, y: 1.5, w: 12, h: 1.5, fontSize: 36, bold: true, color: 'DC2626', fontFace: 'Arial' });
      slide1.addText(`Cohort Period: ${startDate} — ${endDate}`, { x: 0.5, y: 3, w: 12, h: 0.5, fontSize: 16, color: '666666', fontFace: 'Arial' });
      slide1.addText(`Generated: ${new Date().toLocaleString()}`, { x: 0.5, y: 3.6, w: 12, h: 0.5, fontSize: 12, color: '999999', fontFace: 'Arial' });

      // KPI slide
      const slide2 = pptx.addSlide();
      slide2.addText('Key Performance Indicators', { x: 0.5, y: 0.3, w: 12, h: 0.6, fontSize: 24, bold: true, color: '333333', fontFace: 'Arial' });
      const kpiData = [
        ['Metric', 'Value'],
        ['Patients Analyzed', kpis.totalPatients.toLocaleString()],
        ['Still on Therapy', `${(kpis.activeRate * 100).toFixed(1)}%`],
        ['Stopped Therapy', `${(kpis.dropOffRate * 100).toFixed(1)}%`],
        ['Typical Refill Delay', `${kpis.medianRefillGap.toFixed(1)} days`],
      ];
      slide2.addTable(kpiData as any, {
        x: 0.5, y: 1.2, w: 6,
        border: { pt: 0.5, color: 'E5E7EB' },
        colW: [3, 3],
        fontSize: 14,
        fontFace: 'Arial',
        autoPage: false,
      });

      // Persistence curve slide (tabular since we can't render chart SVGs)
      const slide3 = pptx.addSlide();
      slide3.addText('Patient Persistence Over Time', { x: 0.5, y: 0.3, w: 12, h: 0.6, fontSize: 24, bold: true, color: '333333', fontFace: 'Arial' });
      const curveTable = [
        ['Day', 'Active Rate (%)'],
        ...curveData.filter((_, i) => i % Math.max(1, Math.floor(curveData.length / 15)) === 0 || i === curveData.length - 1)
          .map((d) => [String(d.day), d.activeRate.toFixed(1)]),
      ];
      slide3.addTable(curveTable as any, {
        x: 0.5, y: 1.2, w: 8,
        border: { pt: 0.5, color: 'E5E7EB' },
        fontSize: 12,
        fontFace: 'Arial',
        autoPage: false,
      });

      // Payer breakdown slide
      const slide4 = pptx.addSlide();
      slide4.addText('Discontinuation by Payer Type', { x: 0.5, y: 0.3, w: 12, h: 0.6, fontSize: 24, bold: true, color: '333333', fontFace: 'Arial' });
      const payerTable = [
        ['Payer', 'Drop-off Rate', 'Patients'],
        ...Object.entries(segmentSnapshot.byPayer).map(([name, d]) => [
          name, `${(d.dropOffRate * 100).toFixed(1)}%`, d.patients.toLocaleString(),
        ]),
      ];
      slide4.addTable(payerTable as any, {
        x: 0.5, y: 1.2, w: 8,
        border: { pt: 0.5, color: 'E5E7EB' },
        fontSize: 14,
        fontFace: 'Arial',
        autoPage: false,
      });

      // Brand breakdown slide
      const slide5 = pptx.addSlide();
      slide5.addText('Persistence by Brand', { x: 0.5, y: 0.3, w: 12, h: 0.6, fontSize: 24, bold: true, color: '333333', fontFace: 'Arial' });
      const brandTable = [
        ['Brand', 'Active Rate', 'Patients'],
        ...Object.entries(segmentSnapshot.byBrand).map(([name, d]) => [
          name, `${(d.activeRate * 100).toFixed(1)}%`, d.patients.toLocaleString(),
        ]),
      ];
      slide5.addTable(brandTable as any, {
        x: 0.5, y: 1.2, w: 8,
        border: { pt: 0.5, color: 'E5E7EB' },
        fontSize: 14,
        fontFace: 'Arial',
        autoPage: false,
      });

      // Cohort summary slide
      const slide6 = pptx.addSlide();
      slide6.addText('Cohort Summary', { x: 0.5, y: 0.3, w: 12, h: 0.6, fontSize: 24, bold: true, color: '333333', fontFace: 'Arial' });
      slide6.addText(`Total Patients: ${cohort.total.toLocaleString()}`, { x: 0.5, y: 1.2, w: 12, h: 0.5, fontSize: 16, color: '333333', fontFace: 'Arial' });
      slide6.addText(`Payer Types: ${cohort.byPayer.map((s) => s.name).join(', ')}`, { x: 0.5, y: 1.8, w: 12, h: 0.5, fontSize: 14, color: '666666', fontFace: 'Arial' });
      slide6.addText(`Brands: ${cohort.byBrand.map((s) => s.name).join(', ')}`, { x: 0.5, y: 2.3, w: 12, h: 0.5, fontSize: 14, color: '666666', fontFace: 'Arial' });
      slide6.addText(`Regions: ${cohort.byRegion.map((s) => s.name).join(', ')}`, { x: 0.5, y: 2.8, w: 12, h: 0.5, fontSize: 14, color: '666666', fontFace: 'Arial' });
      slide6.addText('Built with synthetic claims data · Not real patient data', { x: 0.5, y: 4, w: 12, h: 0.5, fontSize: 10, color: '999999', fontFace: 'Arial' });

      await pptx.writeFile({ fileName: `glp1-insights-${new Date().toISOString().slice(0, 10)}.pptx` });
    } catch (err) {
      console.error('PPT export failed:', err);
    } finally {
      setExporting(false);
    }
  }, [kpis, segmentSnapshot, cohort, curveData, startDate, endDate]);

  return (
    <button
      onClick={handleExport}
      disabled={exporting}
      className="inline-flex items-center justify-center h-8 w-8 rounded-lg hover:bg-muted transition-colors disabled:opacity-50"
      aria-label="Export as PowerPoint"
      title="Export dashboard as PPTX"
    >
      {exporting ? <Loader2 className="h-5 w-5 text-foreground animate-spin" /> : <FileDown className="h-5 w-5 text-foreground" />}
    </button>
  );
};

export default ExportPPT;
