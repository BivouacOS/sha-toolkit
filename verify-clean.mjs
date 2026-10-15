/**
 * Audits the clean/ folder for PII that the de-identifier should have removed.
 *
 *   node verify-clean.mjs
 *
 * Run this after adding a name pattern, and before reading a new batch of
 * records. It catches the failure the de-identifier structurally cannot: clean
 * files written by an EARLIER, weaker pattern set still sitting on disk, which
 * no amount of re-running on new files will fix. The answer when it reports
 * anything is always `node deidentify.mjs --all`.
 *
 * Exits non-zero if anything is found, so it can gate a workflow.
 */
import fs from 'fs';
import path from 'path';
import config from './lib/load-config.mjs';
import { piiValuePatterns } from './lib/pii-patterns.mjs';

const VALUE = piiValuePatterns(config);
const SKIPPED = config.piiPatternsSkipped;
if (!SKIPPED && !VALUE.names.length) {
  console.error('local.config.mjs: set patientNameTokens — without them this audit cannot catch\n' +
    'digit-glued or truncated names. (If you chose not to provide your name, set piiPatternsSkipped: true.)');
  process.exit(1);
}
// Birth date is optional on its own: labeled DOBs are still caught by format.
const NO_DOB = !SKIPPED && !VALUE.dob.length;

const CHECKS = [
  ...config.patientNamePatterns.map(p => ({
    pattern: new RegExp(p.source, p.flags.includes('i') ? 'gi' : 'g'),
    label: 'patient name',
  })),
  ...VALUE.names.map(pattern => ({ pattern, label: 'patient name (token)' })),
  ...VALUE.dob.map(pattern => ({ pattern, label: 'DOB (by value)' })),
  ...VALUE.ssn.map(pattern => ({ pattern, label: 'SSN (by value)' })),
  ...VALUE.dodId.map(pattern => ({ pattern, label: 'DoD ID (by value)' })),
  { pattern: /(?<!\d)\d{9}(?=\s*\[PATIENT NAME\])/g, label: 'SSN beside name' },
  { pattern: /\b\d{3}-\d{2}-\d{4}\b/g, label: 'SSN' },
  { pattern: /\bxxx-xx-\d{4}\b/gi, label: 'masked SSN' },
  { pattern: /\b[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}\b/g, label: 'email' },
  { pattern: /\b(?:DOB|Date\s+of\s+Birth)[:\s]*\d{1,2}[\/\-.]\d{1,2}[\/\-.]\d{2,4}/gi, label: 'DOB' },
];

if (!fs.existsSync(config.cleanDir)) {
  console.error(`No clean folder at ${config.cleanDir}`);
  process.exit(1);
}

const files = fs.readdirSync(config.cleanDir).filter(f => f.toLowerCase().endsWith('.md'));
const findings = [];

for (const file of files) {
  const text = fs.readFileSync(path.join(config.cleanDir, file), 'utf8');
  const labels = new Set();
  for (const { pattern, label } of CHECKS) {
    pattern.lastIndex = 0;
    if (pattern.test(text)) labels.add(label);
  }
  if (labels.size) findings.push({ file, labels: [...labels] });
}

// Only the categories are printed, never the matched text — the whole point is
// to avoid putting PII in front of whatever is reading this output.
console.log(`Scanned ${files.length} clean file(s) against ${CHECKS.length} pattern(s).`);

if (files.length === 0) {
  console.log('No clean files yet — nothing to check. Put PDFs in raw/ and run deidentify.mjs.');
  process.exit(0);
}

if (findings.length === 0) {
  if (SKIPPED) {
    console.log('No SSN-, phone-, or email-shaped data found.');
    console.log('WARNING: name / DoD ID audit not possible — you chose not to provide them.');
    console.log('Your name and unlabeled ID numbers may still be in the clean files.');
  } else {
    console.log('No PII found. Safe to read.');
    if (NO_DOB) {
      console.log('Note: no birth date provided — only birth dates labeled "DOB" / "Date of Birth" were checked.');
    }
  }
  process.exit(0);
}

console.error(`\n${findings.length} file(s) still contain PII:\n`);
for (const { file, labels } of findings) {
  console.error(`  ${labels.join(', ').padEnd(24)} ${file}`);
}
console.error('\nThese were written before the current pattern set. Fix with:\n');
console.error('  node deidentify.mjs --all\n');
console.error('Do not read these files until the scan comes back clean.');
process.exit(1);
