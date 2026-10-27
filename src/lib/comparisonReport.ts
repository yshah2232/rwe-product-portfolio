import { PDFDocument, StandardFonts, degrees, type PDFFont, type PDFPage } from 'pdf-lib';
import { COMPARE_FIELDS, fieldValue, type CompareTrial } from '@/lib/trialCompare';

export const REPORT_ATTRIBUTION = 'Downloaded from Clinical Trial Diversity Studio';

/** Generated locally. Attribution is identical for everyone: no tracking identifier. */
export async function buildComparisonReport(trials: CompareTrial[]): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();
  pdf.setTitle('Trial comparison');
  pdf.setAuthor('Clinical Trial Diversity Studio');
  pdf.setCreator('Clinical Trial Diversity Studio');
  pdf.setProducer('Clinical Trial Diversity Studio');
  pdf.setSubject(REPORT_ATTRIBUTION);
  pdf.setKeywords(['Clinical Trial Diversity Studio', 'ClinicalTrials.gov', 'Trial comparison']);
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  let page: PDFPage;
  let y = 0;
  let pageNumber = 0;
  const newPage = () => {
    page = pdf.addPage([595.28, 841.89]);
    pageNumber += 1;
    page.drawText('Clinical Trial Diversity Studio', { x: 90, y: 300, size: 29, font: bold, rotate: degrees(35), opacity: 0.09 });
    page.drawText(REPORT_ATTRIBUTION, { x: 40, y: 28, size: 9, font });
    page.drawText(String(pageNumber), { x: 535, y: 28, size: 9, font });
    y = 795;
  };
  // Preserve unsupported characters explicitly rather than silently dropping registry text.
  const safe = (text: string) => Array.from(text).map((char) => {
    try { font.encodeText(char); return char; }
    catch { return `[U+${char.codePointAt(0)?.toString(16).toUpperCase()}]`; }
  }).join('');
  const write = (text: string, size = 10, face: PDFFont = font) => {
    for (const paragraph of text.split(/\r?\n/)) {
      let line = '';
      const emit = () => {
        if (y < 65) newPage();
        page.drawText(line, { x: 40, y, size, font: face });
        y -= size + 5;
        line = '';
      };
      for (const char of safe(paragraph)) {
        if (face.widthOfTextAtSize(line + char, size) > 510) emit();
        line += char;
      }
      emit();
    }
    y -= 4;
  };
  newPage();
  write('Trial comparison', 20, bold);
  write(REPORT_ATTRIBUTION);
  write('Source: ClinicalTrials.gov API v2. Values reflect the records loaded for this comparison.');
  write('This report does not rank trials or recommend a winner. It is not medical advice.');
  write(`Trials: ${trials.map((trial) => trial.nctId).join(', ')}`);
  for (const field of COMPARE_FIELDS) {
    if (y < 130) newPage();
    write(field.label, 13, bold);
    write(`Registry field: ${field.source}`, 8);
    for (const trial of trials) {
      write(trial.nctId, 10, bold);
      write(fieldValue(trial, field.key) ?? 'Not reported on record');
    }
  }
  write('ClinicalTrials.gov source records', 13, bold);
  for (const trial of trials) write(`${trial.nctId}: https://clinicaltrials.gov/study/${trial.nctId}`);
  return pdf.save();
}

export function downloadReport(bytes: Uint8Array) {
  const blob = new Blob([Uint8Array.from(bytes)], { type: 'application/pdf' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'clinical-trial-diversity-studio-comparison.pdf';
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 30_000);
}