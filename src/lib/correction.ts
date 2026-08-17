import type { Row } from '../types';
import { median } from './benchmark';

/**
 * Total Correction Opportunity / Revenue Gap — implements Section 9 of the
 * Cost Correction Dashboard Framework exactly:
 *
 *   Ideal Commercial Value = Utility Count x Vertical (Benchmark) PUUC
 *   Revenue Gap            = Ideal Commercial Value - Actual Collections
 *
 * This is entirely additive to the existing benchmark pipeline —
 * puuc/puucMedian/puucDeviation/classification in benchmark.ts and
 * quadrant.ts are untouched and continue to drive the rest of the
 * dashboard exactly as before.
 *
 * The vertical benchmark used HERE is a separate, more conservative
 * median than puucMedian, guarded against the tiny-utility distortion
 * that was found to make raw Revenue Gap unusable:
 *
 *   - Only institutions with Utility Count >= CORRECTION_UTILITY_FLOOR
 *     contribute to (or are eligible for) this benchmark/opportunity.
 *   - A vertical needs at least CORRECTION_MIN_PEERS such institutions to
 *     have a valid benchmark at all. Below that, no institution in that
 *     vertical is benchmarked (this also prevents a single institution —
 *     e.g. HCLTech in "Companies" — from ever benchmarking itself).
 */
export const CORRECTION_UTILITY_FLOOR = 50;
export const CORRECTION_MIN_PEERS = 3;

/** Stable vertical PUUC median, computed only from Utility Count >= floor peers. */
export function computeStableVerticalMedians(rows: Row[]): Map<string, number | null> {
  const byVertical = new Map<string, number[]>();
  for (const r of rows) {
    if (r.utilityCount != null && r.utilityCount >= CORRECTION_UTILITY_FLOOR && r.puuc != null) {
      (byVertical.get(r.verticalKey) ?? byVertical.set(r.verticalKey, []).get(r.verticalKey)!).push(r.puuc);
    }
  }
  const out = new Map<string, number | null>();
  for (const [vk, values] of byVertical) {
    out.set(vk, values.length >= CORRECTION_MIN_PEERS ? median(values) : null);
  }
  return out;
}

export interface CorrectionResult {
  /** False when the row's vertical has fewer than CORRECTION_MIN_PEERS eligible peers. */
  hasBenchmark: boolean;
  /** Ideal Commercial Value = Utility Count x stable vertical median PUUC. */
  ideal: number | null;
  /** Revenue Gap (₹) = Ideal - Actual Collections. Positive = underpriced/opportunity. */
  gap: number | null;
  /** Gap as a % of Ideal Commercial Value — bounded, safe for display. */
  pctOfIdeal: number | null;
}

export function computeCorrection(row: Row, stableMedianByVertical: Map<string, number | null>): CorrectionResult {
  const stableMedian = stableMedianByVertical.get(row.verticalKey) ?? null;

  if (row.utilityCount == null || row.utilityCount < CORRECTION_UTILITY_FLOOR || stableMedian == null) {
    return { hasBenchmark: false, ideal: null, gap: null, pctOfIdeal: null };
  }
  if (row.coreInvoicingFY26 == null) {
    return { hasBenchmark: true, ideal: null, gap: null, pctOfIdeal: null };
  }

  const ideal = row.utilityCount * stableMedian;
  const gap = ideal - row.coreInvoicingFY26;
  const pctOfIdeal = ideal > 0 ? (gap / ideal) * 100 : null;
  return { hasBenchmark: true, ideal, gap, pctOfIdeal };
}
