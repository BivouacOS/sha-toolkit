/**
 * Reads private-ids.txt — SSN, DoD ID, birth date — typed by the user in Notepad.
 * Kept out of local.config.mjs on purpose: Claude edits local.config.mjs (to add
 * missed name variants) and so must read it; this file is never read by Claude,
 * only by the scripts, so these numbers never reach the AI.
 *
 * Errors name the field, never the value.
 */
const FIELDS = [
  { key: 'ssn', label: /^ssn$/i, digits: 9, name: 'SSN' },
  { key: 'dodId', label: /^dod\s*id$/i, digits: 10, name: 'DoD ID' },
  { key: 'dob', label: /^date\s+of\s+birth/i, name: 'Date of birth' },
];

export function parsePrivateIds(text) {
  const out = { ssn: null, dodId: null, dob: null };
  const lines = String(text).split(/\r?\n/);
  for (const [n, line] of lines.entries()) {
    if (/^\s*(#|$)/.test(line)) continue;
    const idx = line.indexOf(':');
    const f = idx < 0 ? null : FIELDS.find(x => x.label.test(line.slice(0, idx).trim()));
    if (!f) {
      // A value typed on its own line, or a renamed label, would otherwise be
      // silently ignored — and that number would never be redacted.
      throw new Error(`private-ids.txt line ${n + 1} isn't recognized. Each number goes on the same line as its label, ` +
        'after the colon (for example "SSN: 123-45-6789"). Please fix it in Notepad.');
    }
    const value = line.slice(idx + 1).trim();
    if (!value) continue;
    if (f.digits) {
      const d = value.replace(/\D/g, '');
      if (d.length !== f.digits) {
        throw new Error(`private-ids.txt: ${f.name} should be ${f.digits} digits — please re-check it in Notepad.`);
      }
      out[f.key] = d;
    } else {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
        throw new Error('private-ids.txt: Date of birth must be written YYYY-MM-DD (for example 1991-03-14).');
      }
      out[f.key] = value;
    }
  }
  return out;
}
