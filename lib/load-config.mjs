/**
 * Loads local.config.mjs and resolves its paths. Fails loudly with setup
 * instructions if the file is missing, so a fresh clone never silently writes
 * records to the wrong place.
 */
import { existsSync, readFileSync } from 'node:fs';
import { resolve, dirname, join } from 'node:path';
import { pathToFileURL, fileURLToPath } from 'node:url';
import { parsePrivateIds } from './private-ids.mjs';

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
      'Then edit it: set recordsDir, outputXlsx, and patientNamePatterns',
      '(every way your name appears in your medical records).',
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

const required = ['recordsDir', 'outputXlsx', 'patientNamePatterns'];
const missing = required.filter(k => config[k] == null);
if (missing.length) {
  console.error(`local.config.mjs is missing required field(s): ${missing.join(', ')}`);
  process.exit(1);
}

if (!Array.isArray(config.patientNamePatterns) || (!skipped && config.patientNamePatterns.length === 0)) {
  console.error('local.config.mjs: patientNamePatterns must be a non-empty array of RegExp ' +
    '(or set piiPatternsSkipped: true if you chose not to provide your name).');
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

export default {
  ...config,
  root: ROOT,
  recordsDir,
  rawDir: join(recordsDir, 'raw'),
  cleanDir: join(recordsDir, 'clean'),
  outputXlsx: resolve(ROOT, config.outputXlsx),
  patientSsn: ids.ssn ?? null,
  patientDodId: ids.dodId ?? null,
  patientDob: ids.dob ?? config.patientDob ?? null,
  piiPatternsSkipped: skipped,
};
