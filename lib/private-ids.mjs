/**
 * Reads private-ids.txt — name, SSN, DoD ID, birth date — typed by the user in
 * Notepad. This file is never read by Claude, only by the scripts, so none of
 * it reaches the AI. The name lines become redaction patterns (see
 * namePatternsFromParts in pii-patterns.mjs).
 *
 * Errors name the field, never the value.
 */
const FIELDS = [
  // Name labels must match exactly: a name typed before the colon would
  // otherwise be read as label text and never redacted.
  { key: 'firstName', label: /^first\s+name$/i, name: 'First name' },
  { key: 'middleName', label: /^middle\s+name$/i, name: 'Middle name' },
  { key: 'lastName', label: /^last\s+name$/i, name: 'Last name' },
  { key: 'otherNames', label: /^other\s+names(?:\s*\(nicknames, maiden or prior names; separate with commas\))?$/i,
    name: 'Other names', list: true },
  // Labels may carry a format hint: "SSN (XXX-XX-XXXX)", "DoD ID (XXXXXXXXXX)"
  { key: 'ssn', label: /^ssn\b/i, digits: 9, name: 'SSN' },
  { key: 'dodId', label: /^dod\s*id\b/i, digits: 10, name: 'DoD ID' },
  { key: 'dob', label: /^date\s+of\s+birth/i, name: 'Date of birth' },
];

const NAME_VALUE = /^[\p{L}][\p{L}\p{M}'’.\- ]*$/u;

export function parsePrivateIds(text) {
  const out = { firstName: null, middleName: null, lastName: null, otherNames: [], ssn: null, dodId: null, dob: null };
  const lines = String(text).split(/\r?\n/);
  for (const [n, line] of lines.entries()) {
    if (/^\s*(#|$)/.test(line)) continue;
    const idx = line.indexOf(':');
    const f = idx < 0 ? null : FIELDS.find(x => x.label.test(line.slice(0, idx).trim()));
    if (!f) {
      // A value typed on its own line, or a renamed label, would otherwise be
      // silently ignored — and that value would never be redacted.
      throw new Error(`private-ids.txt line ${n + 1} isn't recognized. Each entry goes on the same line as its label, ` +
        'after the colon (for example "SSN (XXX-XX-XXXX): 123-45-6789"). Please fix it in Notepad.');
    }
    // A number typed over the X's in the format hint sits before the colon, where
    // it would be read as label text and never redacted.
    if (/\d/.test(line.slice(0, idx).replace(/YYYY-MM-DD/i, ''))) {
      throw new Error(`private-ids.txt line ${n + 1}: type the number after the colon, not inside the ( ). ` +
        'Please fix it in Notepad.');
    }
    const value = line.slice(idx + 1).trim();
    if (!value) continue;
    if (f.digits) {
      const d = value.replace(/\D/g, '');
      if (d.length !== f.digits) {
        throw new Error(`private-ids.txt: ${f.name} should be ${f.digits} digits — please re-check it in Notepad.`);
      }
      out[f.key] = d;
    } else if (f.key === 'dob') {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
        throw new Error('private-ids.txt: Date of birth must be written YYYY-MM-DD (for example 1991-03-14).');
      }
      out[f.key] = value;
    } else {
      const names = f.list ? value.split(',').map(s => s.trim()).filter(Boolean) : [value];
      if (!names.every(s => NAME_VALUE.test(s))) {
        throw new Error(`private-ids.txt: ${f.name} should be letters only (spaces, hyphens and apostrophes are fine) — ` +
          'please re-check it in Notepad.');
      }
      out[f.key] = f.list ? names : value;
    }
  }
  return out;
}
