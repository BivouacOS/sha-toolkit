/**
 * LOCAL CONFIG — copy this file to `local.config.mjs` and fill in your own values.
 *
 *   cp local.config.example.mjs local.config.mjs
 *
 * `local.config.mjs` is gitignored because it contains your name and local paths.
 * Nothing else in this project holds personal information, which is what makes the
 * scripts safe to share.
 */

export default {
  /** Delete this line once the values below are yours. Scripts refuse to run while it is here. */
  exampleConfig: true,

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
   * Local copy of the 38 CFR Part 4 PDF, as a file:// URL. DC codes in the
   * tracker become page-anchored hyperlinks into it. Set to null to link to
   * eCFR online instead.
   */
  cfrPdfUrl: null,

  /**
   * Your name parts, matched by VALUE in every format. Required by
   * verify-clean.mjs. PDF extraction glues fields together ("600123456SMITH"),
   * and truncates words, so word-boundary and label-based patterns alone miss
   * real occurrences.
   */
  patientNameTokens: ['John', 'Smith', 'Albert'],

  // Birth date, SSN and DoD ID go in private-ids.txt (typed in Notepad, never read by Claude).

  /**
   * true only if you chose NOT to provide your name and numbers. Records will
   * still be scrubbed of SSN-shaped numbers, phones, emails and labeled IDs,
   * but your name and unlabeled ID numbers will NOT be removed.
   */
  piiPatternsSkipped: false,

  /**
   * Every way your name appears in your medical records. Order matters —
   * longest/most specific first. These become `[PATIENT NAME]` in clean files.
   *
   * Check a raw PDF for the exact formats your facility uses: portals commonly
   * emit "LAST, FIRST M", "First M Last", and "F. Last" in different sections.
   *
   * KEEP THE STANDALONE PATTERNS AT THE BOTTOM. Therapy and behavioral-health
   * notes narrate in first name alone ("John reports sleeping 4 hours"), often
   * hundreds of times per record set, and paired first+last patterns never
   * match those. A standalone pattern may also redact a provider who shares
   * your name — harmless, and far better than a missed patient reference.
   */
  /**
   * Toolkit maintainers only (build-toolkit.mjs). Leave out otherwise.
   *   toolkitCfrPdf:   path to the 38 CFR Part 4 PDF shipped in the zip
   *   toolkitShareDir: folder the --release flag copies the zip into
   */
  // toolkitCfrPdf: './38 CFR Part 4.pdf',
  // toolkitShareDir: null,

  patientNamePatterns: [
    // Full-name forms first, so they collapse to a single [PATIENT NAME]
    /\bJohn\s+A(?:lbert)?\s+Smith\b/gi,
    /\bSmith,?\s+John\s+A(?:lbert)?\b/gi,
    /\bSMITH,?\s+JOHN\s+A?\b/g,
    /\bJohn\s+Smith\b/gi,
    /\bSmith,?\s+John\b/gi,
    /\bJ\.?\s*A\.?\s*Smith\b/gi,
    /\bJ\.\s*Smith\b/gi,
    // Rank- or title-prefixed
    /\b(?:Mr|Mrs|Ms|SSG|SFC|MSG|SGT|CPT|MAJ|LT|PFC|SPC)\.?\s+Smith\b/gi,
    // Standalone first and last name, including possessives
    /\bJohn'?s?\b/gi,
    /\bSmith'?s?\b/gi,
  ],
};
