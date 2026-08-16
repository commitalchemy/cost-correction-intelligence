import { canonicalize, type RawRecord } from './canonicalize';
import { applyBenchmarks } from './benchmark';
import { classifyRows } from './quadrant';
import type { Row } from '../types';

/**
 * Raw spreadsheet data → canonicalize.ts → raw normalized fields →
 * benchmark.ts → (Utility Count, PUUC, medians, deviations, ERR) →
 * quadrant.ts → six-category classification → Row[] ready for
 * metrics/filters/charts.
 *
 * This is the ONLY place these three stages are wired together — components
 * and state should never call canonicalize/applyBenchmarks/classifyRows
 * individually.
 */
export function buildRows(raw: RawRecord[]): Row[] {
  const canon = canonicalize(raw);
  const benchmarked = applyBenchmarks(canon);
  return classifyRows(benchmarked);
}
