import { PDFDocument, StandardFonts, degrees, rgb, type PDFFont, type PDFPage } from 'pdf-lib';
import { COMPARE_FIELDS, fieldValue, fieldDiffers, type CompareTrial } from '@/lib/trialCompare';
import { populationPercent, reportInsights, type ReportPopulation } from '@/lib/reportContext';
import { summarizeGeography } from '@/lib/trialGeography';

export const REPORT_ATTRIBUTION = 'Downloaded from Clinical Trial Diversity Studio';

/** Local, deterministic report. No recipient tracking, AI request or invented findings. */
export async function buildComparisonReport(trials: CompareTrial[], population?: ReportPopulation): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();
  pdf.setTitle('Trial comparison briefing');
  pdf.setAuthor('Clinical Trial Diversity Studio');
  pdf.setCreator('Clinical Trial Diversity Studio');
  pdf.setProducer('Clinical Trial Diversity Studio');
  pdf.setSubject(REPORT_ATTRIBUTION);
  pdf.setKeywords(['Clinical Trial Diversity Studio', 'ClinicalTrials.gov', 'Trial comparison']);
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  // Resolve the application's semantic theme for PDF drawing, with matching server/test defaults.
  const token = (name: string, fallback: [number, number, number]) => {
    const raw = typeof document === 'undefined' ? '' : getComputedStyle(document.documentElement).getPropertyValue(name).trim();
    const parts = raw.match(/[\d.]+/g)?.map(Number);
    const [h, s, l] = parts?.length === 3 ? [parts[0] / 360, parts[1] / 100, parts[2] / 100] : fallback;
    const a = s * Math.min(l, 1 - l);
    const channel = (n: number) => { const k = (n + h * 12) % 12; return l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1)); };
    return rgb(channel(0), channel(8), channel(4));
  };
  const ink = token('--foreground', [210 / 360, .4, .12]);
  const blue = token('--primary', [210 / 360, .65, .3]);
  const muted = token('--muted-foreground', [210 / 360, .15, .38]);
  const light = token('--accent', [210 / 360, .6, .96]);
  const border = token('--border', [210 / 360, .2, .86]);
  let page: PDFPage;
  let y = 0;
  const width = 751.89; // A4 landscape with 45 pt margins
  const safe = (text: string) => Array.from(text).map((char) => {
    try { font.encodeText(char); return char; }
    catch { return `[U+${char.codePointAt(0)?.toString(16).toUpperCase()}]`; }
  }).join('');
  const lines = (text: string, max: number, size = 10, face = font) => {
    const result: string[] = [];
    for (const para of safe(text).split(/\r?\n/)) {
      let line = '';
      for (const word of para.split(/\s+/)) {
        if (face.widthOfTextAtSize(`${line} ${word}`.trim(), size) > max && line) { result.push(line); line = ''; }
        for (const char of word) {
          if (face.widthOfTextAtSize(line + char, size) > max) { result.push(line); line = ''; }
          line += char;
        }
        line += ' ';
      }
      result.push(line.trim());
    }
    return result;
  };
  const text = (value: string, x: number, top: number, size = 10, face: PDFFont = font, color = ink) => {
    page.drawText(safe(value), { x, y: top - size, size, font: face, color });
  };
  const newPage = (section: string) => {
    page = pdf.addPage([841.89, 595.28]);
    page.drawText('Clinical Trial Diversity Studio', { x: 145, y: 190, size: 34, font: bold, color: blue, rotate: degrees(24), opacity: .035 });
    text('CLINICAL TRIAL DIVERSITY STUDIO', 45, 561, 9, bold, blue);
    text(section, 570, 561, 9, font, muted);
    page.drawLine({ start: { x: 45, y: 538 }, end: { x: 797, y: 538 }, thickness: 1, color: border });
    y = 521;
  };
  const write = (value: string, size = 11, face = font, color = ink) => {
    for (const line of lines(value, width, size, face)) {
      if (y < 66) newPage('Continued');
      text(line, 45, y, size, face, color); y -= size + 5;
    }
    y -= 6;
  };
  const heading = (title: string, subtitle: string) => { write(title, 25, bold, blue); write(subtitle, 10, font, muted); y -= 8; };
  const table = (headers: string[], rows: string[][], widths: number[], highlights: boolean[] = []) => {
    const row = (cells: string[], head = false, highlight = false, offset = 0, count?: number) => {
      const wrapped = cells.map((c, i) => lines(c, widths[i] - 16, head ? 9 : 10, head || i === 0 ? bold : font));
      const maxLines = Math.max(...wrapped.map((c) => c.length));
      const end = count == null ? maxLines : Math.min(maxLines, offset + count);
      const height = (end - offset) * 14 + 16;
      if (head || highlight) page.drawRectangle({ x: 45, y: y - height, width, height, color: light });
      let x = 45;
      wrapped.forEach((cell, i) => {
        cell.slice(offset, end).forEach((line, j) => text(line, x + 8, y - 8 - j * 14, head ? 9 : 10, head || i === 0 ? bold : font, head ? blue : ink));
        x += widths[i];
      });
      page.drawLine({ start: { x: 45, y: y - height }, end: { x: 797, y: y - height }, thickness: .5, color: border });
      y -= height;
    };
    row(headers, true);
    rows.forEach((cells, i) => {
      const required = Math.max(...cells.map((c, j) => lines(c, widths[j] - 16, 10, j === 0 ? bold : font).length));
      if (y - (required * 14 + 16) < 65 && required * 14 + 16 < 360) { newPage('Comparison continued'); row(headers, true); }
      let offset = 0;
      while (offset < required) {
        const available = Math.floor((y - 65 - 16) / 14);
        if (available < 1) { newPage('Comparison continued'); row(headers, true); continue; }
        const count = Math.min(required - offset, available);
        row(cells, false, highlights[i], offset, count); offset += count;
        if (offset < required) { newPage('Comparison continued'); row(headers, true); }
      }
    });
  };
  const insights = reportInsights(trials);
  newPage('01 / Executive briefing');
  heading('Trial comparison briefing', `Registry snapshot prepared ${new Date().toISOString().slice(0, 10)}. ${trials.length} selected trials. No ranking or eligibility verdict.`);
  const metrics = [[String(insights.trialCount), 'TRIALS REVIEWED'], [String(insights.differenceCount), 'CONCISE FIELDS DIFFER'], [String(insights.stateCount), 'US STATES / TERRITORIES']];
  metrics.forEach(([value, label], i) => { const x = 45 + i * 254; text(value, x, y, 27, bold, blue); text(label, x, y - 35, 9, bold, muted); });
  y -= 75;
  write('Key insights', 16, bold, blue);
  write('Computed from loaded registry fields, not an AI opinion or a change over time analysis.', 9, font, muted);
  for (const item of insights.items) { write(item.title, 12, bold); write(item.text, 11); }
  write('Decision boundary', 12, bold, blue);
  write('This report is not medical advice. It cannot confirm eligibility, predict enrollment or identify a better trial. Verify the original records and speak with the study team or a qualified healthcare professional.', 10);
  if (!trials.length) return pdf.save();

  newPage('02 / Side by side');
  heading('Compare the essentials', 'Tinted rows differ, including missing values. Verify full criteria using the source links below.');
  for (const trial of trials) {
    if (y < 170) newPage('Selected records continued');
    write(`${trial.nctId}: ${trial.briefTitle ?? 'Title not reported'}`, 10, bold);
    write(`https://clinicaltrials.gov/study/${trial.nctId}`, 9, font, blue);
  }
  y -= 4;
  const fields = COMPARE_FIELDS.filter((f) => !['eligibility', 'locations'].includes(f.key));
  const col = (width - 130) / trials.length;
  table(['Registry field', ...trials.map((t) => t.nctId)], fields.map((f) => [f.label, ...trials.map((t) => fieldValue(t, f.key) ?? 'Not reported')]), [130, ...trials.map(() => col)], fields.map((f) => fieldDiffers(trials, f.key)));

  const geo = summarizeGeography(trials);
  newPage('03 / Sites and population');
  heading('Where the listed sites are', 'ClinicalTrials.gov facility listings. Shared facilities may appear once per trial; counts are not unique sites or enrollment.');
  table(['Trial', 'Listed facilities', 'US facilities', 'US state gaps'], geo.trials.map((t) => [t.nctId, t.coverage === 'none_listed' ? 'Not reported' : String(t.totalSites), t.coverage === 'none_listed' ? 'Not reported' : String(t.usSites), t.coverage === 'none_listed' ? 'Not reported' : String(t.usSitesWithoutState)]), [190, 190, 190, width - 570]);
  y -= 20;
  if (geo.regions.length) table(['Census region group', 'Site listings', 'Trials represented'], geo.regions.map((r) => [r.region, String(r.siteCount), r.trials.join(', ')]), [210, 150, width - 360]);
  else write('No US facility with a recognized state is reported. No regional footprint can be shown.');

  if (y < 260) newPage('Population context');
  else y -= 20;
  write('Statewide residents, not trial participants', 18, bold, blue);
  write('US Census American Community Survey (ACS) 5 year estimates. No participant demographic data is inferred.', 10, font, muted);
  write('Each state appears once. Figures describe entire states with listed trial sites, not catchment areas, eligible patients, disease prevalence or enrollment. No combined median income or site weighted population is calculated.', 11);
  const rows = population?.rows ?? [];
  const valid = rows.filter((r) => r.data && !r.error);
  write(valid.length ? `${valid.length} of ${geo.states.length} site states or territories have Census data in this report. Source vintage: ${population?.year ?? 'not reported'}. Up to 30 site states are requested.` : 'Census data was unavailable for this report. No values are estimated in its place.', 11, bold);
  if (rows.length) table(['State', 'Residents', 'Hispanic / Latino', 'Black, non Hispanic', 'Asian, non Hispanic', 'Age 65+', 'Median income'], rows.map((r) => {
    const d = r.error ? undefined : r.data;
    return [r.state, d?.total_population?.toLocaleString('en-US') ?? 'Not available', populationPercent(d?.pop_hispanic, d?.total_population), populationPercent(d?.pop_black_nh, d?.total_population), populationPercent(d?.pop_asian_nh, d?.total_population), populationPercent(d?.pop_age_65plus, d?.total_population), d?.median_household_income == null ? 'Not reported' : `$${d.median_household_income.toLocaleString('en-US')}`];
  }), [130, 110, 110, 110, 110, 80, width - 650]);

  newPage('04 / Sources and limits');
  heading('Evidence you can verify', 'Values reflect the records loaded for this comparison. This is a snapshot, not monitoring of trial changes.');
  write('ClinicalTrials.gov API v2', 14, bold, blue);
  for (const t of trials) write(`${t.nctId}: https://clinicaltrials.gov/study/${t.nctId}`, 10, font, blue);
  write('Field traceability', 13, bold);
  for (const f of COMPARE_FIELDS.filter((f) => f.key !== 'eligibility')) write(`${f.label}: ${f.source}`, 9, font, muted);
  if (valid.length) {
    write('US Census ACS source queries', 13, bold, blue);
    for (const r of valid) {
      const source = r.data?.source_url;
      let url: URL | undefined;
      try { if (source) url = new URL(source); } catch { /* invalid source stays missing */ }
      if (url) url.searchParams.delete('key');
      write(`${r.state} (${r.data?.acs_year ?? population?.year ?? 'year not reported'}): ${url?.toString() ?? 'Source URL not reported'}`, 9, font, muted);
    }
  }
  write('Full eligibility wording remains in the original registry record, rather than being condensed into a verdict. Missing values remain missing. Recruitment and dates can change after the records were loaded.', 10);
  for (const [i, p] of pdf.getPages().entries()) {
    p.drawLine({ start: { x: 45, y: 43 }, end: { x: 797, y: 43 }, thickness: .5, color: border });
    p.drawText(REPORT_ATTRIBUTION, { x: 45, y: 27, size: 8, font, color: muted });
    p.drawText(`${i + 1} / ${pdf.getPageCount()}`, { x: 760, y: 27, size: 8, font, color: muted });
  }
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
