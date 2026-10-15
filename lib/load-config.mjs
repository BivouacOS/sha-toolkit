/**
 * Loads local.config.mjs and resolves its paths. Fails loudly with setup
 * instructions if the file is missing, so a fresh clone never silently writes
 * records to the wrong place.
 */
import { existsSync, readFileSync } from 'node:fs';
import { resolve, dirname, join } from 'node:path';
import { pathToFileURL, fileURLToPath } from 'node:url';
import { parsePrivateIds } from './private-ids.mjs';
import { namePatternsFromParts } from './pii-patterns.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const CONFIG_PATH = join(ROOT, 'local.config.mjs');

if (!existsSync(CONFIG_PATH)) {
  console.error(
    [
      '',
      'Missing local.config.mjs — this holds your paths and name variants.',
      '',
      '  cp local.config.example.mjs local.config.mjs',
      '',
      'Your name and ID numbers go in private-ids.txt (copy private-ids.example.txt),',
      'not in local.config.mjs.',
      '',
    ].join('\n')
  );
  process.exit(1);
}

const { default: config } = await import(pathToFileURL(CONFIG_PATH).href);

// SSN, DoD ID, birth date: typed by the user into private-ids.txt, which Claude
// never reads. Optional — absent file means none provided.
const IDS_PATH = join(ROOT, 'private-ids.txt');
let ids = {};
try {
  ids = existsSync(IDS_PATH) ? parsePrivateIds(readFileSync(IDS_PATH, 'utf8')) : {};
} catch (err) {
  console.error(err.message);
  process.exit(1);
}
const skipped = config.piiPatternsSkipped === true;

const required = ['recordsDir', 'outputXlsx'];
const missing = required.filter(k => config[k] == null);
if (missing.length) {
  console.error(`local.config.mjs is missing required field(s): ${missing.join(', ')}`);
  process.exit(1);
}

// Name patterns: any in the config (owner's hand-tuned ones), plus those built
// from the name typed in private-ids.txt. Built full-name forms go first and
// standalone names last, so "First Last" collapses to one [PATIENT NAME].
const built = namePatternsFromParts(ids);
const builtFull = built.patterns.slice(0, built.patterns.length - built.tokens.length);
const builtSingle = built.patterns.slice(builtFull.length);
const patientNamePatterns = [...builtFull, ...(config.patientNamePatterns ?? []), ...builtSingle];
const patientNameTokens = [...new Set([...(config.patientNameTokens ?? []), ...built.tokens])];

if (!skipped && patientNamePatterns.length === 0) {
  console.error('No name to remove. Type your name on the First name / Last name lines of private-ids.txt ' +
    '(or set piiPatternsSkipped: true in local.config.mjs if you chose not to provide it).');
  process.exit(1);
}

// Unredacted names would defeat the whole pipeline, so refuse the example values.
// A marker, not a name check: matching "smith" locked out every real Smith,
// Goldsmith, or Smithers.
if (config.exampleConfig === true) {
  console.error(
    'local.config.mjs is still the example (exampleConfig: true).\n' +
      'Replace the example names with your own, then delete the exampleConfig line.'
  );
  process.exit(1);
}

const recordsDir = resolve(ROOT, config.recordsDir);

// cfrPdfUrl may be a plain path (the kit ships './38 CFR Part 4.pdf'); turn it
// into a file:// URL, or fall back to eCFR links if the file isn't there.
let cfrPdfUrl = config.cfrPdfUrl ?? null;
if (cfrPdfUrl && !/^[a-z][a-z0-9+.-]*:\/\//i.test(cfrPdfUrl)) {
  const pdfPath = resolve(ROOT, cfrPdfUrl);
  cfrPdfUrl = existsSync(pdfPath) ? pathToFileURL(pdfPath).href : null;
}

export default {
  ...config,
  root: ROOT,
  recordsDir,
  rawDir: join(recordsDir, 'raw'),
  cleanDir: join(recordsDir, 'clean'),
  outputXlsx: resolve(ROOT, config.outputXlsx),
  cfrPdfUrl,
  patientNamePatterns,
  patientNameTokens,
  patientSsn: ids.ssn ?? null,
  patientDodId: ids.dodId ?? null,
  patientDob: ids.dob ?? config.patientDob ?? null,
  piiPatternsSkipped: skipped,
};
