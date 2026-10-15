import ExcelJS from 'exceljs';
import { conditions } from './data/conditions.mjs';
import { potentialConditions } from './data/potential-conditions.mjs';
import { shaAnswers } from './data/sha-answers.mjs';
import { shaSections, shaQuestions } from './data/sha-questions.mjs';
import { addShaAnswersSheet } from './lib/sha-sheet.mjs';
import { combinedRating } from './lib/rating-calculator.mjs';
import { STATUS, STATUS_TIERS, orderConditions } from './lib/status.mjs';
import config from './lib/load-config.mjs';

const OUTPUT = config.outputXlsx;
const ECFR_URL = 'https://www.ecfr.gov/current/title-38/chapter-I/part-4#page-top';
const PDF_BASE = config.cfrPdfUrl;

// Maps DC code → exact page number in local 38 CFR Part 4 PDF
// PDF has 1 unnumbered cover page, so "page N of 249" in text = PDF page N+1
const DC_TO_PAGE = {
  '5201': 42,
  '5237': 49,
  '5260': 54,
  '5271': 55,
  '5284': 58,
  '6006': 74,
  '6260': 102,
  '6840': 102,
  '6847': 103,
  '7122': 110,
  '7319': 118,
  '7346': 123,
  '7525': 130,
  '7542': 131,
  '7804': 143,
  '7806': 144,
  '7819': 145,
  '8045': 155,
  '8100': 162,
  '9411': 176,
  '9413': 176,
  '9434': 177,
};

// Column layout: what a reader needs first sits on the left.
// The running-total chain lives in C (estimate), M, N, and hidden O/P.
const COLUMNS = [
  { header: 'Condition', width: 30, field: 'name' },
  { header: 'Status', width: 13 },
  { header: 'Est. %', width: 8 },
  { header: 'DC', width: 8 },
  { header: 'Evidence Needed', width: 38, field: 'evidenceNeeded' },
  { header: 'Evidence in Records', width: 70, field: 'evidence' },
  { header: 'Notes / Against', width: 50, field: 'notes' },
  { header: 'Service Connection Basis', width: 45, field: 'reason' },
  { header: 'Onset', width: 18, field: 'onsetDate' },
  { header: 'Symptoms', width: 45, field: 'symptoms' },
  { header: 'Effect on Life / Work', width: 32, field: 'lifeEffects' },
  { header: 'Rating Criteria (38 CFR Part 4)', width: 50, field: 'ratingCriteria' },
  { header: 'VA Running %', width: 10 },
  { header: 'Bilateral (4.26)', width: 9 },
  { header: '_biRemain', width: 10 },
  { header: '_singleRemain', width: 10 },
];
const COL = { STATUS: 2, EST: 3, DC: 4, RUNNING: 13, BILATERAL: 14, BI_REMAIN: 15, SINGLE_REMAIN: 16 };
const LETTER = { EST: 'C', BILATERAL: 'N', BI_REMAIN: 'O', SINGLE_REMAIN: 'P', RUNNING: 'M' };
const LAST_VISIBLE = 'N';

const solid = argb => ({ type: 'pattern', pattern: 'solid', fgColor: { argb } });
const THIN = { style: 'thin', color: { argb: 'FFBFBFBF' } };
const BORDER = { top: THIN, bottom: THIN, left: THIN, right: THIN };

function estimateRowHeight(texts) {
  const LINE_HEIGHT = 15;
  let maxLines = 1;
  texts.forEach((text, i) => {
    if (!text) return;
    const charsPerLine = COLUMNS[i].width * 1.15;
    const lines = String(text).split('\n')
      .reduce((n, line) => n + Math.max(1, Math.ceil(line.length / charsPerLine)), 0);
    maxLines = Math.max(maxLines, lines);
  });
  return Math.max(30, Math.min(maxLines * LINE_HEIGHT + 4, 400));
}

function dcCellValue(dcCode) {
  if (!/^\d{4}$/.test(dcCode ?? '')) return dcCode ?? ''; // N/A, TBD — nothing to link
  const page = DC_TO_PAGE[dcCode];
  if (page && PDF_BASE) {
    return { text: dcCode, hyperlink: `${PDF_BASE}#page=${page}`, tooltip: `38 CFR Part 4, page ${page}` };
  }
  return {
    text: dcCode,
    hyperlink: `https://www.ecfr.gov/current/title-38/chapter-I/part-4/appendix-AppendixA#p-App_A_to_Pt_4(DC_${dcCode})`,
    tooltip: `38 CFR Part 4, DC ${dcCode} (eCFR)`,
  };
}

async function build() {
  const wb = new ExcelJS.Workbook();
  // Belt and braces with the cached results below: Excel recomputes everything on open.
  wb.calcProperties.fullCalcOnLoad = true;
  const ws = wb.addWorksheet('Medical', {
    views: [{ state: 'frozen', xSplit: 2, ySplit: 2 }],
  });
  COLUMNS.forEach((c, i) => { ws.getColumn(i + 1).width = c.width; });
  // Printing: landscape, one page wide, header rows repeat on every page.
  ws.pageSetup = {
    orientation: 'landscape', paperSize: 1, fitToPage: true, fitToWidth: 1, fitToHeight: 0,
    margins: { left: 0.3, right: 0.3, top: 0.4, bottom: 0.4, header: 0.2, footer: 0.2 },
  };
  ws.pageSetup.printTitlesRow = '1:2';

  // Row 1: title + eCFR link
  const r1 = ws.getRow(1);
  r1.getCell(1).value = { text: '38 CFR Part 4 — VA Rating Schedule (eCFR)', hyperlink: ECFR_URL };
  r1.getCell(1).font = { color: { argb: 'FF0563C1' }, underline: true };
  r1.height = 20;

  // Row 2: headers. (Each section band states its tier rule, so no separate legend.)
  const r2 = ws.getRow(2);
  r2.values = COLUMNS.map(c => c.header);
  r2.height = 32;
  r2.eachCell(cell => {
    cell.fill = solid('FF1F3864');
    cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    cell.alignment = { wrapText: true, vertical: 'middle', horizontal: 'center' };
    cell.border = BORDER;
  });

  // Rows grouped by status (ready first). Each group gets a colored band; the
  // running-total chain skips bands and links data row to data row.
  const ordered = orderConditions(conditions);
  // Mirror of the O/P/M formulas, so every formula cell carries an exact cached
  // result. Viewers that don't recalculate (cloud-drive/mobile/mail previews) show
  // cached values only — without these they show blanks.
  let biRemain = 1;
  let singleRemain = 1;
  let prevDataRow = null;
  let rowNum = 3;
  const lastRowOfTier = {};
  const runningAtTier = {};

  for (const tier of STATUS_TIERS) {
    const group = ordered.filter(c => c.evidenceStatus === tier.key);
    if (!group.length) continue;

    // Section band
    ws.mergeCells(`A${rowNum}:${LAST_VISIBLE}${rowNum}`);
    const band = ws.getRow(rowNum).getCell(1);
    band.value = `${tier.key.toUpperCase()} — ${group.length} condition${group.length > 1 ? 's' : ''}.  ${tier.rule}`;
    band.fill = solid(tier.fill);
    band.font = { bold: true, size: 12, color: { argb: tier.font } };
    band.alignment = { vertical: 'middle' };
    ws.getRow(rowNum).height = 22;
    rowNum++;

    for (const cond of group) {
      const row = ws.getRow(rowNum);
      COLUMNS.forEach((c, i) => {
        if (c.field) row.getCell(i + 1).value = cond[c.field] ?? '';
      });
      row.getCell(COL.STATUS).value = cond.evidenceStatus;
      row.getCell(COL.EST).value = cond.yourEstPct ?? 0;
      row.getCell(COL.DC).value = dcCellValue(cond.dcCode);
      row.getCell(COL.BILATERAL).value = cond.bilateral ? 1 : 0;

      // Base style: wrapped text, light tier tint across the readable columns
      for (let c = 1; c <= COL.BILATERAL; c++) {
        const cell = row.getCell(c);
        cell.alignment = { wrapText: true, vertical: 'top' };
        cell.border = BORDER;
        cell.fill = solid(tier.tint);
      }
      // Condition + Status carry the solid tier color
      for (const c of [1, COL.STATUS]) {
        row.getCell(c).fill = solid(tier.fill);
        row.getCell(c).font = { bold: true, color: { argb: tier.font } };
      }
      row.getCell(COL.STATUS).alignment = { wrapText: true, vertical: 'top', horizontal: 'center' };
      for (const c of [COL.EST, COL.DC, COL.RUNNING, COL.BILATERAL]) {
        row.getCell(c).alignment = { vertical: 'top', horizontal: 'center' };
      }
      row.getCell(COL.EST).font = { bold: true, size: 12 };
      if (typeof row.getCell(COL.DC).value === 'object') {
        row.getCell(COL.DC).font = { color: { argb: 'FF0563C1' }, underline: true };
      }

      // Running-total chain (38 CFR 4.25/4.26): paired extremities combine
      // first and take +10%, then fold into everything else.
      const pct = (cond.yourEstPct ?? 0) / 100;
      if (cond.bilateral) biRemain *= 1 - pct;
      else singleRemain *= 1 - pct;
      const est = `${LETTER.EST}${rowNum}`;
      const bi = `${LETTER.BILATERAL}${rowNum}`;
      const prevO = prevDataRow ? `${LETTER.BI_REMAIN}${prevDataRow}` : '1';
      const prevP = prevDataRow ? `${LETTER.SINGLE_REMAIN}${prevDataRow}` : '1';
      row.getCell(COL.BI_REMAIN).value = { formula: `${prevO}*IF(${bi}=1,1-${est}/100,1)`, result: biRemain };
      row.getCell(COL.SINGLE_REMAIN).value = { formula: `${prevP}*IF(${bi}=1,1,1-${est}/100)`, result: singleRemain };
      const running = 100 - (100 - (1 - biRemain) * 110) * singleRemain;
      row.getCell(COL.RUNNING).value = {
        formula: `100-(100-(1-${LETTER.BI_REMAIN}${rowNum})*110)*${LETTER.SINGLE_REMAIN}${rowNum}`,
        result: running,
      };
      row.getCell(COL.RUNNING).numFmt = '0.0';

      row.height = estimateRowHeight(COLUMNS.map(c => (c.field ? cond[c.field] : '')));
      prevDataRow = rowNum;
      lastRowOfTier[tier.key] = rowNum;
      runningAtTier[tier.key] = running;
      rowNum++;
    }
  }
  const FIRST_DATA_ROW = 4; // row 3 is the first section band
  const LAST_DATA_ROW = prevDataRow;
  ws.getColumn(COL.BI_REMAIN).hidden = true;
  ws.getColumn(COL.SINGLE_REMAIN).hidden = true;

  if (!LAST_DATA_ROW) {
    ws.mergeCells(`A3:${LAST_VISIBLE}3`);
    ws.getCell('A3').value = 'No conditions yet — they are added as you go through the SHA questions with Claude.';
    ws.getCell('A3').font = { italic: true, color: { argb: 'FF595959' } };
    // Empty tracker: show every tier band as a color legend.
    STATUS_TIERS.forEach((tier, i) => {
      const r = 4 + i;
      ws.mergeCells(`A${r}:${LAST_VISIBLE}${r}`);
      const band = ws.getCell(`A${r}`);
      band.value = `${tier.key.toUpperCase()} — 0 conditions.  ${tier.rule}`;
      band.fill = solid(tier.fill);
      band.font = { bold: true, size: 12, color: { argb: tier.font } };
      band.alignment = { vertical: 'middle' };
      ws.getRow(r).height = 22;
    });
  } else {
    ws.dataValidations.add(`B${FIRST_DATA_ROW}:B${LAST_DATA_ROW}`, {
      type: 'list',
      allowBlank: true,
      formulae: [`"${STATUS_TIERS.map(t => t.key).join(',')}"`],
      showErrorMessage: true,
      errorTitle: 'Invalid',
      error: `Choose: ${STATUS_TIERS.map(t => t.key).join(', ')}`,
    });
    ws.dataValidations.add(`N${FIRST_DATA_ROW}:N${LAST_DATA_ROW}`, {
      type: 'list',
      allowBlank: true,
      formulae: ['"1,0"'],
      showErrorMessage: true,
      errorTitle: 'Invalid',
      error: '1 = both-sides paired extremity (38 CFR 4.26), 0 = not bilateral',
    });

    // Summary block
    const exactRaw = 100 - (100 - (1 - biRemain) * 110) * singleRemain;
    let s = LAST_DATA_ROW + 2;
    ws.mergeCells(`A${s}:${LAST_VISIBLE}${s}`);
    const title = ws.getRow(s).getCell(1);
    title.value = 'COMBINED RATING (VA whole-person method, 38 CFR 4.25; bilateral factor 4.26)';
    title.font = { bold: true, size: 12, color: { argb: 'FFFFFFFF' } };
    title.fill = solid('FF1F3864');
    ws.getRow(s).height = 22;

    const summaryRow = (label, formula, result, opts = {}) => {
      s++;
      const row = ws.getRow(s);
      row.getCell(1).value = label;
      row.getCell(1).font = { bold: true };
      row.getCell(1).alignment = { wrapText: true, vertical: 'middle' };
      ws.mergeCells(`A${s}:B${s}`);
      const v = row.getCell(3);
      v.value = { formula, result };
      v.numFmt = opts.numFmt ?? '0.0';
      v.font = { bold: true, size: opts.size ?? 11 };
      v.alignment = { horizontal: 'center', vertical: 'middle' };
      if (opts.fill) for (const c of [1, 3]) row.getCell(c).fill = solid(opts.fill);
      row.height = 30;
    };
    const ready = STATUS['Ready to File'];
    if (lastRowOfTier[ready.key]) {
      summaryRow('Ready to File only (raw %)', `M${lastRowOfTier[ready.key]}`, runningAtTier[ready.key], { fill: ready.tint });
    }
    summaryRow('All conditions (raw %)', `M${LAST_DATA_ROW}`, exactRaw);
    summaryRow('VA rating estimate (rounded to nearest 10%)', `ROUND(C${s}/10,0)*10`, Math.round(exactRaw / 10) * 10,
      { numFmt: '0"%"', size: 14, fill: 'FFE2EFDA' });

    s += 2;
    ws.mergeCells(`A${s}:${LAST_VISIBLE}${s}`);
    const note = ws.getRow(s).getCell(1);
    note.value = 'Edit "Est. %" (col C), "Status" (col B) or "Bilateral" (col N) — the running % recalculates in Excel.';
    note.font = { italic: true, color: { argb: 'FF595959' } };

    // Status counts
    s++;
    ws.mergeCells(`A${s}:${LAST_VISIBLE}${s}`);
    ws.getRow(s).getCell(1).value = STATUS_TIERS
      .map(t => `${t.key}: ${ordered.filter(c => c.evidenceStatus === t.key).length}`).join('   ·   ');
    ws.getRow(s).getCell(1).font = { bold: true };
  }

  // Sheet 2: Potential Conditions — own compact layout
  const ws2 = wb.addWorksheet('Potential Conditions', { views: [{ state: 'frozen', ySplit: 2 }] });
  const POT_COLS = [
    { header: 'Condition', width: 30, field: 'name' },
    { header: 'DC', width: 10, field: 'dcCode' },
    { header: 'Basis in Records', width: 50, field: 'reason' },
    { header: 'Symptoms', width: 50, field: 'symptoms' },
    { header: 'Notes', width: 60, field: 'notes' },
  ];
  POT_COLS.forEach((c, i) => { ws2.getColumn(i + 1).width = c.width; });
  ws2.mergeCells('A1:E1');
  const potTitle = ws2.getRow(1).getCell(1);
  potTitle.value = 'POTENTIAL CONDITIONS — some basis in the records; not yet claimed';
  potTitle.font = { bold: true, size: 12 };
  potTitle.fill = solid('FFFFF2CC');
  ws2.getRow(1).height = 22;
  const potHeader = ws2.getRow(2);
  potHeader.values = POT_COLS.map(c => c.header);
  potHeader.height = 24;
  potHeader.eachCell(cell => {
    cell.fill = solid('FF1F3864');
    cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    cell.alignment = { vertical: 'middle', horizontal: 'center' };
    cell.border = BORDER;
  });
  potentialConditions.forEach((pc, i) => {
    const row = ws2.getRow(3 + i);
    POT_COLS.forEach((c, j) => {
      const cell = row.getCell(j + 1);
      cell.value = pc[c.field] ?? '';
      cell.alignment = { wrapText: true, vertical: 'top' };
      cell.border = BORDER;
    });
    row.getCell(1).font = { bold: true };
    const lines = Math.max(...POT_COLS.map(c => Math.ceil(String(pc[c.field] ?? '').length / (c.width * 1.15))));
    row.height = Math.max(30, lines * 15 + 4);
  });

  // Sheet 3: SHA answers (only once there are some)
  const shaWs = addShaAnswersSheet(wb, shaQuestions, shaSections, shaAnswers);
  if (shaWs) console.log(`SHA Answers: ${shaAnswers.length} question(s)`);

  const { raw, rounded } = combinedRating(ordered.map(c => c.yourEstPct), ordered.map(c => c.bilateral));
  console.log(`Raw combined: ${raw}% → VA estimate: ${rounded}%`);
  console.log(STATUS_TIERS.map(t => `${t.key}: ${ordered.filter(c => c.evidenceStatus === t.key).length}`).join(' · '));
  await wb.xlsx.writeFile(OUTPUT);
  console.log('Written to', OUTPUT);
}

build().catch(err => { console.error(err); process.exit(1); });
