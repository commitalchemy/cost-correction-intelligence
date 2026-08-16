import type { DeviationBand, Row, ScoredRow } from '../types';
import { COST_HIGH_THRESHOLD, EFFORT_HIGH_THRESHOLD } from './quadrant';

export { median } from './benchmark';

export function average(arr: (number | null | undefined)[]): number | null {
  const a = arr.filter((v): v is number => Number.isFinite(v as number));
  return a.length ? a.reduce((x, y) => x + y, 0) / a.length : null;
}

export function percentileRank(value: number | null, arr: (number | null | undefined)[]): number {
  const a = arr.filter((v): v is number => Number.isFinite(v as number)).sort((x, y) => x - y);
  if (!a.length || value == null) return 0;
  let count = 0;
  for (const x of a) if (x <= value) count++;
  return count / a.length;
}

export function money(x: number | null | undefined): string {
  return x == null ? '—' : '₹' + Math.round(x).toLocaleString('en-IN');
}

/** Compact Indian-style currency for leadership KPIs: ₹1.2 Cr / ₹45.6 L / ₹8.4 K */
export function moneyCompact(x: number | null | undefined): string {
  if (x == null) return '—';
  const abs = Math.abs(x);
  const sign = x < 0 ? '-' : '';
  if (abs >= 1e7) return `${sign}₹${(abs / 1e7).toFixed(abs / 1e7 >= 100 ? 0 : 1)} Cr`;
  if (abs >= 1e5) return `${sign}₹${(abs / 1e5).toFixed(abs / 1e5 >= 100 ? 0 : 1)} L`;
  if (abs >= 1e3) return `${sign}₹${(abs / 1e3).toFixed(abs / 1e3 >= 100 ? 0 : 1)} K`;
  return `${sign}₹${Math.round(abs).toLocaleString('en-IN')}`;
}

export function pct(x: number | null | undefined): string {
  return x == null ? '—' : (x >= 0 ? '+' : '') + (x * 100).toFixed(Math.abs(x) < 0.1 ? 1 : 0) + '%';
}

/** Buckets PUUC deviation for the distribution chart / toolbar band filter. */
export function bucket(x: number | null): DeviationBand {
  if (x == null) return 'invalid';
  if (x < -0.5) return 'below-50';
  if (x < 0) return '-50-0';
  if (x < COST_HIGH_THRESHOLD) return '0-20';
  if (x < 0.5) return '20-50';
  if (x < 1) return '50-100';
  return 'above-100';
}

/**
 * Priority score blends:
 *  - Cost overrun severity (puucDeviation above the +20% cost-high threshold)
 *  - Effort severity (errDeviation below the -20% effort-high threshold —
 *    note the direction: more negative = worse)
 *  - The recalculated six-way classification, which alone can only
 *    contribute a small share of the score — it needs corroboration from a
 *    real deviation to push a row over the high-priority threshold.
 * No-utility rows always score 0: there's no valid cost/effort signal to prioritize on.
 */
export function priorityScore(row: Row): number {
  if (row.classification === 'no-utility') return 0;

  const costComponent =
    row.puucDeviation == null || row.puucDeviation <= COST_HIGH_THRESHOLD
      ? 0
      : Math.min((row.puucDeviation - COST_HIGH_THRESHOLD) / 1.0, 1);

  const effortComponent =
    row.errDeviation == null || row.errDeviation >= EFFORT_HIGH_THRESHOLD
      ? 0
      : Math.min((EFFORT_HIGH_THRESHOLD - row.errDeviation) / 1.0, 1);

  const classificationComponent =
    row.classification === 'both-high'
      ? 1
      : row.classification === 'cost-only' || row.classification === 'effort-only'
      ? 0.6
      : row.classification === 'undetermined'
      ? 0.25
      : 0.1; // healthy

  return 0.4 * costComponent + 0.4 * effortComponent + 0.2 * classificationComponent;
}

export const HIGH_PRIORITY_THRESHOLD = 0.55;

export function isHighPriority(row: ScoredRow): boolean {
  return row.score >= HIGH_PRIORITY_THRESHOLD;
}

export function scoreRows(rows: Row[]): ScoredRow[] {
  return rows.map((r) => ({ ...r, score: priorityScore(r) }));
}

/** Cost per unit of ticket volume = PUUC / ticket count. Null when either input is unusable. */
export function costPerTicket(row: Row): number | null {
  if (row.puuc == null || !row.ticketCount || row.ticketCount <= 0) return null;
  return row.puuc / row.ticketCount;
}

/**
 * Financial exposure for one institution = PUUC minus its recalculated
 * vertical median PUUC, i.e. the rupee amount its per-unit utility cost
 * sits above the in-app benchmark. Both are recalculated fields (never the
 * pasted PUUC/median columns). Null when PUUC/median are unusable, or the
 * institution is at/below benchmark (no overrun to report) — a No Utility
 * row's puuc is always null, so it can never contribute here.
 */
export function financialExposure(row: Row): number | null {
  if (row.puuc == null || row.puucMedian == null) return null;
  const excess = row.puuc - row.puucMedian;
  return excess > 0 ? excess : null;
}

export interface ExposureSummary {
  total: number;
  affectedCount: number;
  missingCostDataCount: number;
  computable: boolean;
}

/**
 * Aggregates financial exposure across a set of rows. Institutions without a
 * usable recalculated PUUC and/or vertical median cannot be included and are
 * counted separately as missingCostDataCount, so the total is never silently padded.
 */
export function computeExposureSummary(rows: Row[]): ExposureSummary {
  let total = 0;
  let affectedCount = 0;
  let missingCostDataCount = 0;
  for (const r of rows) {
    const exposure = financialExposure(r);
    if (exposure != null) {
      total += exposure;
      affectedCount++;
    } else if (r.puuc == null || r.puucMedian == null) {
      missingCostDataCount++;
    }
  }
  return { total, affectedCount, missingCostDataCount, computable: rows.some((r) => r.puuc != null && r.puucMedian != null) };
}
