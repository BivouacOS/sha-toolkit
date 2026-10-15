/**
 * VA whole-person combined rating formula (38 CFR Part 4).
 * Each rating is applied to remaining whole-person efficiency.
 *
 * Bilateral factor (38 CFR 4.26): disabilities affecting BOTH arms, BOTH legs,
 * or paired skeletal muscles are combined together first, then 10% of that
 * combined value is added before combining with everything else. Mark a rating
 * as bilateral by passing `true` at the same index in `bilateralFlags`.
 *
 * @param {(number|null|undefined)[]} percentages
 * @param {boolean[]} [bilateralFlags] aligned with `percentages`; true = paired extremity
 * @returns {{ raw: number, rounded: number }}
 */
export function combinedRating(percentages, bilateralFlags = []) {
  const items = (percentages ?? [])
    .map((p, i) => ({ p, bi: !!bilateralFlags[i] }))
    .filter(x => x.p != null && x.p > 0);

  if (items.length === 0) return { raw: 0, rounded: 0 };

  // Combined ratings table: remaining whole-person efficiency after applying
  // each rating to what's left. Returns the *disability* percent (0–100).
  const combinePct = vals => {
    const remaining = vals
      .slice()
      .sort((a, b) => b - a)
      .reduce((rem, pct) => rem * (1 - pct / 100), 1);
    return (1 - remaining) * 100;
  };

  const biVals = items.filter(x => x.bi).map(x => x.p);
  const values = items.filter(x => !x.bi).map(x => x.p);

  // Apply the bilateral factor to paired-extremity disabilities, then fold the
  // adjusted subtotal back in as a single value.
  if (biVals.length) {
    const biSubtotal = combinePct(biVals);
    values.push(biSubtotal + biSubtotal * 0.10);
  }

  const raw = Math.round(combinePct(values));
  const rounded = Math.round(raw / 10) * 10;

  return { raw, rounded };
}
