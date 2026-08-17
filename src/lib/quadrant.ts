import type { Classification, Row } from '../types';

export const COST_HIGH_THRESHOLD = 0.2; // PUUC Deviation > +20%
export const EFFORT_HIGH_THRESHOLD = -0.2; // ERR Deviation < -20% (direction is intentional)

export const CLASSIFICATION_LABEL: Record<Classification, string> = {
  'cost-only': 'Cost Only',
  'effort-only': 'Effort Only',
  'both-high': 'Both High',
  healthy: 'Healthy',
  'no-utility': 'No Utility',
  undetermined: 'Undetermined',
};

export const CLASSIFICATION_DESC: Record<Classification, string> = {
  'cost-only': 'PUUC deviation above +20% of vertical median; effort is not elevated (or not evaluable)',
  'effort-only': 'ERR deviation below -20% of vertical median; cost is not elevated (or not evaluable)',
  'both-high': 'Both cost and effort deviations breach threshold',
  healthy: 'Neither cost nor effort is elevated, of whichever dimensions could be evaluated',
  'no-utility': 'Utility Count is zero or invalid — no basis for PUUC/ERR',
  undetermined: 'Utility exists but neither Cost nor Effort benchmark data is available',
};

/** Cost is high when PUUC Deviation > +20%. Null (unknown) when deviation can't be computed. */
export function isCostHigh(row: Pick<Row, 'puucDeviation'>): boolean | null {
  if (row.puucDeviation == null) return null;
  return row.puucDeviation > COST_HIGH_THRESHOLD;
}

/**
 * Effort is high when ERR Deviation < -20%. This direction is intentional —
 * do not flip it back to positive. Null (unknown) when deviation can't be computed.
 */
export function isEffortHigh(row: Pick<Row, 'errDeviation'>): boolean | null {
  if (row.errDeviation == null) return null;
  return row.errDeviation < EFFORT_HIGH_THRESHOLD;
}

/**
 * Six-way classification — the single source of truth for cost/effort
 * status across the whole app. Never derived from the pasted spreadsheet
 * status column.
 *
 * Cost and Effort are INDEPENDENT dimensions — each is evaluated whenever
 * its own benchmark data (PUUC / PUUC vertical median, ERR / ERR vertical
 * median) is available, regardless of whether the other dimension's data
 * exists. A missing benchmark on ONE side is never a reason to fall back
 * to Undetermined; the institution is classified from whichever dimension
 * IS available.
 *
 *   No Utility     Utility Count <= 0
 *   Both High      Cost High AND Effort High                 (both evaluable)
 *   Cost Only      Cost High, and (Effort not high OR Effort not evaluable)
 *   Effort Only    Effort High, and (Cost not high OR Cost not evaluable)
 *   Healthy        Neither is high, among whichever dimension(s) are evaluable
 *   Undetermined   Utility exists, but NEITHER Cost NOR Effort is evaluable
 */
export function classify(row: Pick<Row, 'utilityCount' | 'puucDeviation' | 'errDeviation'>): Classification {
  if (row.utilityCount == null || row.utilityCount <= 0) return 'no-utility';

  const cost = isCostHigh(row); // true / false / null (unavailable)
  const effort = isEffortHigh(row); // true / false / null (unavailable)

  if (cost == null && effort == null) return 'undetermined';

  // Whichever side is unavailable is simply treated as "not high" — the
  // classification is driven entirely by the dimension(s) that ARE known.
  const costHigh = cost === true;
  const effortHigh = effort === true;

  if (costHigh && effortHigh) return 'both-high';
  if (costHigh) return 'cost-only';
  if (effortHigh) return 'effort-only';
  return 'healthy';
}

/** Attaches the recalculated six-way classification to every row. */
export function classifyRows(rows: Row[]): Row[] {
  return rows.map((r) => ({ ...r, classification: classify(r) }));
}

export function hasIssue(row: Row): boolean {
  return row.classification === 'cost-only' || row.classification === 'effort-only' || row.classification === 'both-high';
}
