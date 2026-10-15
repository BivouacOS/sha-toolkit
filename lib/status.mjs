/**
 * Evidence-status tiers: how much work is left before a rater can use a row.
 * Order here = row order in the workbook (ready first, not-started last), so
 * the VA Running % at the end of the green block reads "what can be filed today".
 */
export const STATUS_TIERS = [
  {
    key: 'Ready to File',
    fill: 'FF00B050', font: 'FFFFFFFF', tint: 'FFE2F0D9',
    rule: 'Diagnosis or exam finding AND a service link in the records.',
  },
  {
    key: 'Building',
    fill: 'FFFFC000', font: 'FF000000', tint: 'FFFFF2CC',
    rule: 'Diagnosis or exam finding exists; specific items still missing (see Evidence Needed).',
  },
  {
    key: 'Needs Work',
    fill: 'FFED7D31', font: 'FFFFFFFF', tint: 'FFFBE5D6',
    rule: 'Examined or diagnosed, but the record does not support a rating yet (old visit or negative exam).',
  },
  {
    key: 'Not Started',
    fill: 'FFC00000', font: 'FFFFFFFF', tint: 'FFF8D7DA',
    rule: 'No diagnosis and no exam finding in any record. Symptom mentions alone do not count.',
  },
];

export const STATUS = Object.fromEntries(STATUS_TIERS.map((t, i) => [t.key, { ...t, rank: i }]));

/** Workbook row order: by status tier, then highest estimate first. */
export function orderConditions(conditions) {
  for (const c of conditions) {
    if (!STATUS[c.evidenceStatus]) {
      throw new Error(`Unknown evidenceStatus "${c.evidenceStatus}" on ${c.name}. ` +
        `Use one of: ${STATUS_TIERS.map(t => t.key).join(', ')}`);
    }
  }
  return [...conditions].sort((a, b) =>
    STATUS[a.evidenceStatus].rank - STATUS[b.evidenceStatus].rank ||
    (b.yourEstPct ?? 0) - (a.yourEstPct ?? 0));
}
