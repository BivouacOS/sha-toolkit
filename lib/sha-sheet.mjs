/**
 * Sheet 3: the user's SHA 2025 Part A answers, grouped by section, each with
 * the record that supports it — what they copy from when filling the real form.
 */
const solid = argb => ({ type: 'pattern', pattern: 'solid', fgColor: { argb } });
const THIN = { style: 'thin', color: { argb: 'FFBFBFBF' } };
const BORDER = { top: THIN, bottom: THIN, left: THIN, right: THIN };
const COLS = [
  { header: 'Section', width: 26 },
  { header: '#', width: 6 },
  { header: 'Question', width: 60 },
  { header: 'Answer', width: 14 },
  { header: 'Your Explanation', width: 60 },
  { header: 'Supporting Record', width: 60 },
  { header: 'Linked Condition', width: 26 },
];

function validate(answers, byId) {
  for (const a of answers) {
    const q = byId.get(a.id);
    if (!q) throw new Error(`sha-answers.mjs: unknown SHA question ${a.id}`);
    const free = q.options.includes('(free text)');
    if (a.answer === 'Explain') {
      if (!a.explanation) throw new Error(`sha-answers.mjs: ${a.id} is "Explain" but has no explanation`);
    } else if (!free && !q.options.includes(a.answer)) {
      throw new Error(`sha-answers.mjs: ${a.id} answer "${a.answer}" is not one of ${q.options.join(', ')}, Explain`);
    }
  }
}

export function addShaAnswersSheet(wb, questions, sections, answers) {
  if (!answers?.length) return null;
  const byId = new Map(questions.map(q => [q.id, q]));
  validate(answers, byId);
  const answerById = new Map(answers.map(a => [a.id, a]));

  const ws = wb.addWorksheet('SHA Answers', { views: [{ state: 'frozen', ySplit: 2 }] });
  COLS.forEach((c, i) => { ws.getColumn(i + 1).width = c.width; });
  ws.pageSetup = { orientation: 'landscape', fitToPage: true, fitToWidth: 1, fitToHeight: 0 };
  ws.pageSetup.printTitlesRow = '1:2';

  ws.mergeCells('A1:G1');
  const title = ws.getCell('A1');
  title.value = 'SHA 2025 PART A — your answers. Fill Section I (name, SSN, DoD ID, contact) yourself on the real form.';
  title.font = { bold: true, size: 12 };
  ws.getRow(1).height = 22;

  const header = ws.getRow(2);
  header.values = COLS.map(c => c.header);
  header.height = 24;
  header.eachCell(cell => {
    cell.fill = solid('FF1F3864');
    cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    cell.alignment = { vertical: 'middle', horizontal: 'center' };
    cell.border = BORDER;
  });

  let r = 3;
  for (const s of sections) {
    const qs = questions.filter(q => q.section === s.id && answerById.has(q.id));
    if (!qs.length) continue;
    ws.mergeCells(`A${r}:G${r}`);
    const band = ws.getCell(`A${r}`);
    band.value = `${s.id} ${s.title}`;
    band.font = { bold: true };
    band.fill = solid('FFD9E1F2');
    r++;
    for (const q of qs) {
      const a = answerById.get(q.id);
      const row = ws.getRow(r);
      row.values = [s.title, q.num, q.text, a.answer, a.explanation ?? '', a.record ?? '', a.condition ?? ''];
      for (let c = 1; c <= COLS.length; c++) {
        const cell = row.getCell(c);
        cell.alignment = { wrapText: true, vertical: 'top' };
        cell.border = BORDER;
      }
      row.getCell(4).font = { bold: true };
      const lines = Math.max(...[3, 5, 6].map(c =>
        String(row.getCell(c).value ?? '').split('\n')
          .reduce((n, l) => n + Math.max(1, Math.ceil(l.length / (COLS[c - 1].width * 1.15))), 0)));
      row.height = Math.max(20, Math.min(lines * 15 + 4, 300));
      r++;
    }
  }
  return ws;
}
