/**
 * PII patterns built from config VALUES (name tokens, date of birth) rather than
 * from labels or word boundaries. Shared by deidentify.mjs (to redact) and
 * verify-clean.mjs (to audit), so the two can never disagree about what counts.
 *
 * Why value-based: PDF text extraction glues fields together. Real misses found
 * on 2026-10-05 that the labeled/\b patterns could not catch:
 *   - surname glued to a preceding ID number ("600…780SURNAME"): no \b between digit and letter
 *   - first name truncated by one letter in a goal line
 *   - birth date with no "DOB" label, or glued to an encounter number
 *   - birth date printed as "31 Jan 1990" on a DD 2216
 */

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July',
  'August', 'September', 'October', 'November', 'December'];

const esc = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/** Name tokens anywhere a letter does not continue the word — digits on either side are fine. */
export function nameTokenPatterns(tokens = []) {
  const out = [];
  for (const t of tokens) {
    out.push(new RegExp(`(?<![A-Za-z])${esc(t)}(?:'?s)?(?![A-Za-z])`, 'gi'));
    // Truncated by one letter (seen in the wild). Only for tokens long enough that
    // the stem is not a common word.
    if (t.length >= 5) out.push(new RegExp(`(?<![A-Za-z])${esc(t.slice(0, -1))}(?![A-Za-z])`, 'gi'));
  }
  return out;
}

/** Every common rendering of the birth date. `dob` is 'YYYY-MM-DD'. */
export function dobPatterns(dob) {
  if (!dob) return [];
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dob);
  if (!m) throw new Error(`patientDob must be 'YYYY-MM-DD', got '${dob}'`);
  const [, y, mm, dd] = m;
  const M = String(+mm), D = String(+dd), yy = y.slice(2);
  const mon = MONTHS[+mm - 1], mon3 = mon.slice(0, 3);
  const md = `(?:0?${M})`, dd_ = `(?:0?${D})`;
  const sep = '[\\/\\-.]';
  const variants = [
    `${md}${sep}${dd_}${sep}(?:${y}|${yy})`,           // 1/31/1990, 01-31-90
    `${y}${sep}${mm}${sep}${dd}`,                       // 1990-01-31
    `${y}${mm}${dd}`,                                   // 19900131
    `${dd_}\\s*-?\\s*(?:${mon}|${mon3})\\.?\\s*-?\\s*,?\\s*${y}`, // 31 Jan 1990, 31-JAN-1990, 31JAN1990
    `(?:${mon}|${mon3})\\.?\\s+${dd_},?\\s+${y}`,       // Jan 31, 1990
  ];
  // Leading guard: no digit immediately before (so 11/31/1990 is not a hit).
  // No trailing guard: extraction often glues the next field's digits on.
  return variants.map(v => new RegExp(`(?<!\\d)${v}`, 'gi'));
}

/**
 * A fixed-length ID number by VALUE, in any grouping: bare, dashed, spaced,
 * dotted, en/em-dashed. No digit guard on either side: extraction glues other
 * fields' digits onto both ends, and an exact 9- or 10-digit run that matches
 * the user's own number is worth redacting wherever it sits — over-redaction
 * costs a few digits of an unrelated number, a miss leaks the ID.
 */
function digitValuePatterns(value, length, label, groups) {
  if (!value) return [];
  const d = String(value).replace(/\D/g, '');
  if (d.length !== length) throw new Error(`${label} must be ${length} digits`);
  const sep = '[\\s.\\-\\u2013\\u2014]{0,3}';
  let i = 0;
  const grouped = groups.map(n => { const g = d.slice(i, i + n); i += n; return g; }).join(sep);
  return [new RegExp(grouped, 'g')];
}

export const ssnPatterns = ssn => digitValuePatterns(ssn, 9, 'patientSsn', [3, 2, 4]);

// DoD IDs are printed grouped both 3-3-4 and 4-3-3.
export const dodIdPatterns = id => id
  ? [...digitValuePatterns(id, 10, 'patientDodId', [3, 3, 4]), ...digitValuePatterns(id, 10, 'patientDodId', [4, 3, 3])]
  : [];

export function piiValuePatterns(config) {
  return {
    names: nameTokenPatterns(config.patientNameTokens),
    dob: dobPatterns(config.patientDob),
    ssn: ssnPatterns(config.patientSsn),
    dodId: dodIdPatterns(config.patientDodId),
  };
}
