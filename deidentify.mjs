/**
 * De-identification pipeline for medical records.
 *
 * Usage:
 *   node deidentify.mjs              — process all unprocessed PDFs in raw/
 *   node deidentify.mjs --all        — reprocess all PDFs (overwrite existing clean/)
 *   node deidentify.mjs --file NAME  — process one specific file from raw/
 *
 * Input:  <recordsDir>/raw/   (contains PII — never read by Claude)
 * Output: <recordsDir>/clean/ (de-identified .md files — safe to ingest)
 * recordsDir comes from local.config.mjs (the kit uses "Medical Records").
 */

import fs from 'fs';
import path from 'path';
import { createRequire } from 'module';
import config from './lib/load-config.mjs';
import { piiValuePatterns } from './lib/pii-patterns.mjs';

const require = createRequire(import.meta.url);
const pdfParse = require('pdf-parse');

const RAW_DIR = config.rawDir;
const CLEAN_DIR = config.cleanDir;

// ---------------------------------------------------------------------------
// PII replacement rules — applied in order
// ---------------------------------------------------------------------------

// Patient name variants come from local.config.mjs (gitignored).
const PATIENT_NAME_PATTERNS = config.patientNamePatterns;
const VALUE = piiValuePatterns(config);

const RULES = [
  // Patient name — must run before generic word patterns
  ...PATIENT_NAME_PATTERNS.map(pattern => ({ pattern, replacement: '[PATIENT NAME]', label: 'name' })),
  // Leftover name tokens the word-bounded patterns miss (digit-glued, truncated)
  ...VALUE.names.map(pattern => ({ pattern, replacement: '[PATIENT NAME]', label: 'name' })),

  // DOB by value, any format, labeled or not
  ...VALUE.dob.map(pattern => ({ pattern, replacement: '[DOB REDACTED]', label: 'dob' })),

  // SSN and DoD ID by value, any grouping, labeled or not (from private-ids.txt)
  ...VALUE.ssn.map(pattern => ({ pattern, replacement: '[SSN]', label: 'ssn' })),
  ...VALUE.dodId.map(pattern => ({ pattern, replacement: '[DOD ID]', label: 'id' })),

  // Unlabeled 9-digit SSN printed directly against the name (DD 2215/2216 header row).
  // Other bare 9-digit runs are encounter (FIN) numbers and are kept.
  { pattern: /(?<!\d)\d{9}(?=\s*\[PATIENT NAME\])/g, replacement: '[SSN]', label: 'ssn' },

  // SSN — full and partial (xxx-xx-1234 style)
  { pattern: /\b\d{3}-\d{2}-\d{4}\b/g, replacement: '[SSN]', label: 'ssn' },
  { pattern: /\bxxx-xx-\d{4}\b/gi, replacement: '[SSN]', label: 'ssn' },
  { pattern: /\b\d{3}\s\d{2}\s\d{4}\b/g, replacement: '[SSN]', label: 'ssn' },

  // DOB — only when labeled (keep all other dates for medical timeline)
  // Standard: "DOB: MM/DD/YYYY" or "Date of Birth: MM/DD/YYYY"
  {
    pattern: /((?:DOB|D\.O\.B\.?|Date\s+of\s+Birth|Birth\s+Date|Birthdate|Birth\s+Dt)[:\s]*)\d{1,2}[\/\-.]\d{1,2}[\/\-.]\d{2,4}/gi,
    replacement: '$1[DOB REDACTED]',
    label: 'dob',
  },
  // DOB embedded in slash-separated field: "Sex/DOB/Age:MaleM/DD/YYYY"
  {
    pattern: /(\bDOB[\/][A-Za-z]+:[^\d]{0,20})\d{1,2}[\/\-.]\d{1,2}[\/\-.]\d{2,4}/gi,
    replacement: '$1[DOB REDACTED]',
    label: 'dob',
  },
  // DOB field followed by non-digit text then date: handles "Sex/DOB/Age:Male1/31/1990"
  {
    pattern: /([A-Za-z\/]*DOB[A-Za-z\/]*:[^\d]{0,15})\d{1,2}\/\d{1,2}\/(19|20)\d{2}/gi,
    replacement: '$1[DOB REDACTED]',
    label: 'dob',
  },
  // DOB in table format: "19XX-XX-XX" or "20XX-XX-XX" preceded by label
  {
    pattern: /((?:DOB|D\.O\.B\.?|Date\s+of\s+Birth)[:\s]*)(19|20)\d{2}-\d{2}-\d{2}/gi,
    replacement: '$1[DOB REDACTED]',
    label: 'dob',
  },

  // MRN / Patient ID — labeled numbers
  {
    pattern: /\b(MRN|Medical\s+Record(?:\s+Number)?|Medical\s+Record\s+#|Patient\s+ID|Acct\s*#|Account\s*#|Pat\s+ID)[:\s#]*\d[\d\s-]*/gi,
    replacement: '[MRN]',
    label: 'mrn',
  },

  // Sponsor SSN (common in military records)
  { pattern: /\bSponsor\s+SSN[:\s]*[\dX*-]+/gi, replacement: 'Sponsor SSN: [SSN]', label: 'ssn' },

  // Veterans ID (ICN) and DOD ID (EDIPI) — 10-digit identifiers
  { pattern: /\b(Veterans\s+ID[^:]*:|ICN[:\s]*)\d{10}\b/gi, replacement: '$1[VETERAN ID]', label: 'id' },
  { pattern: /\b(DOD\s+ID[^:]*:|EDIPI[:\s]*)\d{10}\b/gi, replacement: '$1[DOD ID]', label: 'id' },
  // ICN/EDIPI number appearing immediately before its label (PDF column extraction artifact)
  { pattern: /\b(\d{10})(Veterans\s+ID|DOD\s+ID)/g, replacement: '[VETERAN ID]$2', label: 'id' },

  // Phone numbers
  { pattern: /\b(\+1[\s.-]?)?\(?\d{3}\)?[\s.-]\d{3}[\s.-]\d{4}\b/g, replacement: '[PHONE]', label: 'phone' },

  // Email addresses
  { pattern: /\b[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}\b/g, replacement: '[EMAIL]', label: 'email' },

  // Street address — labeled or with street suffix
  {
    pattern: /\b\d{1,5}\s+[A-Z][a-zA-Z\s]{2,30}(?:Street|St|Avenue|Ave|Boulevard|Blvd|Road|Rd|Drive|Dr|Lane|Ln|Court|Ct|Way|Circle|Cir|Place|Pl)\.?\b/g,
    replacement: '[ADDRESS]',
    label: 'address',
  },

  // ZIP code — only in address context (5-digit or ZIP+4)
  {
    pattern: /\b(Address|City|State|Zip|Zipcode)[:\s,]+[^\n]{0,50}\b\d{5}(?:-\d{4})?\b/gi,
    replacement: '[ADDRESS]',
    label: 'address',
  },

  // Spouse/family names in social history fields — "Lives with Spouse. [Name]- Wife/Husband/Partner"
  {
    pattern: /\b([A-Z][a-z]+-?\s*(?:Wife|Husband|Spouse|Partner|Significant Other)[^\n.]{0,30}(?:Name|\.)?\.?)/g,
    replacement: '[SPOUSE NAME REDACTED]',
    label: 'family',
  },
];

// ---------------------------------------------------------------------------

function deidentify(text) {
  const counts = {};
  let result = text;

  for (const rule of RULES) {
    const before = result;
    result = result.replace(rule.pattern, rule.replacement);
    const changed = (before.match(rule.pattern) || []).length;
    if (changed > 0) {
      counts[rule.label] = (counts[rule.label] || 0) + changed;
    }
  }

  return { text: result, counts };
}

async function processFile(filename, force = false) {
  const inputPath = path.join(RAW_DIR, filename);
  const ext = path.extname(filename).toLowerCase();
  // File names can carry the patient's name too (portal exports, user renames).
  // Redact them like the text: they become the clean file name, its header, and
  // the console output that Claude reads.
  const baseName = deidentify(path.basename(filename, path.extname(filename))).text;
  const shownName = baseName + ext;
  const outputPath = path.join(CLEAN_DIR, baseName + '.md');

  if (!force && fs.existsSync(outputPath)) {
    console.log(`  SKIP  ${shownName} (clean file exists — use --all to reprocess)`);
    return;
  }

  let rawText = '';

  if (ext === '.pdf') {
    const buffer = fs.readFileSync(inputPath);
    const parsed = await pdfParse(buffer);
    rawText = parsed.text;
  } else if (ext === '.txt' || ext === '.md') {
    rawText = fs.readFileSync(inputPath, 'utf8');
  } else {
    console.log(`  SKIP  ${shownName} (unsupported type: ${ext})`);
    return;
  }

  const { text: cleanText, counts } = deidentify(rawText);
  const totalRedacted = Object.values(counts).reduce((a, b) => a + b, 0);

  const header = [
    `# ${baseName}`,
    ``,
    `> Source: \`raw/${shownName}\``,
    `> De-identified: ${new Date().toISOString().slice(0, 10)}`,
    `> Redactions: ${JSON.stringify(counts)} (${totalRedacted} total)`,
    ``,
    `---`,
    ``,
  ].join('\n');

  fs.writeFileSync(outputPath, header + cleanText, 'utf8');
  console.log(`  OK    ${shownName} → ${baseName}.md  [${totalRedacted} redactions: ${JSON.stringify(counts)}]`);
}

async function main() {
  const args = process.argv.slice(2);
  const force = args.includes('--all');
  const fileArg = args.includes('--file') ? args[args.indexOf('--file') + 1] : null;

  fs.mkdirSync(CLEAN_DIR, { recursive: true });

  if (fileArg) {
    console.log(`Processing: ${deidentify(fileArg).text}`);
    await processFile(fileArg, force);
  } else {
    const files = fs.readdirSync(RAW_DIR).filter(f => !f.startsWith('.'));
    if (files.length === 0) {
      console.log('No files in raw/ — drop PDFs there first.');
      return;
    }
    console.log(`Processing ${files.length} file(s) from raw/...\n`);
    for (const f of files) {
      await processFile(f, force);
    }
  }

  console.log('\nDone. Clean files in:');
  console.log(`  ${CLEAN_DIR}`);
}

main().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
