import type { Row } from '../types';
import { median } from './benchmark';

/**
 * "Expensive to Serve" — a separate lens on top of Infra Cost, additive to
 * the existing Cost/Effort classification (quadrant.ts) and Top 10 ranking
 * (correction.ts). Neither of those is read or modified here.
 *
 *   Infra % Revenue = Infra Cost / Core Invoicing FY'26
 *   Infra Index     = Infra % Revenue / vertical median Infra % Revenue
 *   Expensive to Serve = Infra Index > EXPENSIVE_TO_SERVE_MULTIPLIER
 *
 * Vertical median only trusted with >= EXPENSIVE_TO_SERVE_MIN_PEERS valid
 * peers, mirroring the same reliability guard correction.ts already uses
 * for the Correction Opportunity benchmark.
 */
export const EXPENSIVE_TO_SERVE_MULTIPLIER = 2;
export const EXPENSIVE_TO_SERVE_MIN_PEERS = 3;

export function computeInfraVerticalMedians(rows: { verticalKey: string; infraPctRevenue: number | null }[]): Map<string, number | null> {
  const byVertical = new Map<string, number[]>();
  for (const r of rows) {
    if (r.infraPctRevenue != null) {
      (byVertical.get(r.verticalKey) ?? byVertical.set(r.verticalKey, []).get(r.verticalKey)!).push(r.infraPctRevenue);
    }
  }
  const out = new Map<string, number | null>();
  for (const [vk, values] of byVertical) {
    out.set(vk, values.length >= EXPENSIVE_TO_SERVE_MIN_PEERS ? median(values) : null);
  }
  return out;
}

/** Attaches infraPctRevenue / infraVerticalMedian / infraIndex / expensiveToServe to every row. */
export function attachExpensiveToServe(rows: Row[]): Row[] {
  const stage1 = rows.map((r) => {
    const infraPctRevenue =
      r.infraCost != null && r.coreInvoicingFY26 != null && r.coreInvoicingFY26 > 0
        ? r.infraCost / r.coreInvoicingFY26
        : null;
    return { ...r, infraPctRevenue };
  });

  const medianByVertical = computeInfraVerticalMedians(stage1);

  return stage1.map((r) => {
    const infraVerticalMedian = medianByVertical.get(r.verticalKey) ?? null;
    const infraIndex =
      r.infraPctRevenue != null && infraVerticalMedian != null && infraVerticalMedian > 0
        ? r.infraPctRevenue / infraVerticalMedian
        : null;
    const expensiveToServe = infraIndex != null && infraIndex > EXPENSIVE_TO_SERVE_MULTIPLIER;
    return { ...r, infraVerticalMedian, infraIndex, expensiveToServe };
  });
}
