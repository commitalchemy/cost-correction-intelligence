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
  'cost-only': 'PUUC deviation above +20% of vertical median; effort is not elevated',
  'effort-only': 'ERR deviation below -20% of vertical median; cost is not elevated',
  'both-high': 'Both cost and effort deviations breach threshold',
  healthy: 'Neither cost nor effort is elevated',
  'no-utility': 'Utility Count is zero or invalid — no basis for PUUC/ERR',
  undetermined: 'Utility exists but required benchmark data is insufficient',
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
 *   No Utility     Utility Count <= 0
 *   Undetermined   Valid utility exists, but cost/effort deviation is unavailable
 *   Both High      Cost High AND Effort High
 *   Cost Only      Cost High AND NOT Effort High
 *   Effort Only    Effort High AND NOT Cost High
 *   Healthy        Neither Cost High nor Effort High
 */
export function classify(row: Pick<Row, 'utilityCount' | 'puucDeviation' | 'errDeviation'>): Classification {
  if (row.utilityCount == null || row.utilityCount <= 0) return 'no-utility';

  const cost = isCostHigh(row);
  const effort = isEffortHigh(row);
  if (cost == null || effort == null) return 'undetermined';

  if (cost && effort) return 'both-high';
  if (cost) return 'cost-only';
  if (effort) return 'effort-only';
  return 'healthy';
}

/** Attaches the recalculated six-way classification to every row. */
export function classifyRows(rows: Row[]): Row[] {
  return rows.map((r) => ({ ...r, classification: classify(r) }));
}

export function hasIssue(row: Row): boolean {
  return row.classification === 'cost-only' || row.classification === 'effort-only' || row.classification === 'both-high';
}
