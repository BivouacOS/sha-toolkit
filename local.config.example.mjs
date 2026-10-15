/**
 * LOCAL CONFIG — copy this file to `local.config.mjs`.
 *
 *   cp local.config.example.mjs local.config.mjs
 *
 * Your name, SSN, DoD ID and birth date do NOT go here: type them into
 * private-ids.txt (in Notepad). The scripts read that file and build the
 * redaction patterns from it, so your name is never typed in chat.
 */

export default {
  /**
   * Folder holding your medical records. Must contain two subfolders:
   *   raw/    — original PDFs straight from the patient portal (PII — never read by AI)
   *   clean/  — de-identified .md output (safe to read)
   * Relative paths resolve from the project root.
   */
  recordsDir: './Medical Records',

  /** Where `build-tracker.mjs` writes the Excel tracker. */
  outputXlsx: './SHA Tracker.xlsx',

  /**
   * Local copy of the 38 CFR Part 4 PDF: a path (relative to this folder) or a
   * file:// URL. DC codes in the tracker become page-anchored hyperlinks into
   * it. Set to null, or leave the file out, to link to eCFR online instead.
   */
  cfrPdfUrl: './38 CFR Part 4.pdf',

  /**
   * true only if you chose NOT to provide your name. Records will still be
   * scrubbed of SSN-shaped numbers, phones, emails and labeled IDs, but your
   * name and unlabeled ID numbers will NOT be removed.
   */
  piiPatternsSkipped: false,

  /**
   * Optional, advanced: extra name patterns (RegExp) and tokens on top of the
   * ones built from private-ids.txt. Anything here is in plain text in this
   * file — leave both empty unless you are setting this up for yourself.
   */
  patientNamePatterns: [],
  patientNameTokens: [],

  /**
   * Toolkit maintainers only (build-toolkit.mjs). Leave out otherwise.
   *   toolkitCfrPdf:   path to the 38 CFR Part 4 PDF shipped in the zip
   *   toolkitShareDir: folder the --release flag copies the zip into
   */
  // toolkitCfrPdf: './38 CFR Part 4.pdf',
  // toolkitShareDir: null,
};
