import { describe, it, expect } from 'vitest';
import { PDFDocument } from 'pdf-lib';
import { buildComparisonReport, REPORT_ATTRIBUTION } from '@/lib/comparisonReport';

describe('comparison report attribution', () => {
  it('embeds platform attribution without a visitor identifier', async () => {
    const bytes = await buildComparisonReport([]);
    const pdf = await PDFDocument.load(bytes);
    expect(pdf.getAuthor()).toBe('Clinical Trial Diversity Studio');
    expect(pdf.getSubject()).toBe(REPORT_ATTRIBUTION);
    expect(pdf.getCreator()).toBe('Clinical Trial Diversity Studio');
    expect(pdf.getPageCount()).toBe(1);
  });
});