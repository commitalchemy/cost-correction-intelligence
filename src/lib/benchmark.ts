import type { RawRow, Row, UtilityComposition } from '../types';

/** Utility Count is considered meaningfully zero/invalid below this floor. */
const UTILITY_EPSILON = 1e-6;

function finiteOrNull(n: number): number | null {
  return Number.isFinite(n) ? n : null;
}

/**
 * Utility Count = Total User + Total Forms + Widgets/3 + Landing Pages*2/3
 *   + Automations/6 + NIAA*3 + WABA*6 + Leads/15000 + Applications/3
 *   + Evaluators/6 + AI Guide*3 + AI Voice*10
 *
 * AI Guide is x3 (NOT x10) — do not swap the two multipliers.
 * Inputs are already defaulted to 0 for missing/non-numeric values by
 * canonicalize.ts, so this never produces NaN/Infinity on its own.
 */
export function computeUtilityCount(c: UtilityComposition): number {
  const value =
    c.users +
    c.forms +
    c.widgets / 3 +
    c.lp * (2 / 3) +
    c.automations / 6 +
    c.niaa * 3 +
    c.waba * 6 +
    c.leads / 15000 +
    c.applications / 3 +
    c.evaluators / 6 +
    c.aiGuide * 3 +
    c.aiVoice * 10;
  return finiteOrNull(value) ?? 0;
}

/**
 * PUUC = Core Invoicing FY'26 / Utility Count.
 * Only computed when Utility Count is meaningfully greater than zero;
 * otherwise null (never divide by zero/near-zero).
 */
export function computePUUC(coreInvoicingFY26: number | null, utilityCount: number | null): number | null {
  if (coreInvoicingFY26 == null || !Number.isFinite(coreInvoicingFY26)) return null;
  if (utilityCount == null || !Number.isFinite(utilityCount) || utilityCount <= UTILITY_EPSILON) return null;
  return finiteOrNull(coreInvoicingFY26 / utilityCount);
}

/**
 * ERR = PUUC * Avg Resolution Time (Business Hours) / Annual Ticket Efforts.
 * Guards against missing resolution time, missing/zero annual ticket
 * efforts, and invalid PUUC. Never produces Infinity/NaN — invalid inputs
 * become null.
 */
export function computeERR(
  puuc: number | null,
  avgResolutionTimeHours: number | null,
  annualTicketEfforts: number | null
): number | null {
  if (puuc == null || !Number.isFinite(puuc)) return null;
  if (avgResolutionTimeHours == null || !Number.isFinite(avgResolutionTimeHours) || avgResolutionTimeHours < 0) return null;
  if (annualTicketEfforts == null || !Number.isFinite(annualTicketEfforts) || annualTicketEfforts <= UTILITY_EPSILON) return null;
  return finiteOrNull((puuc * avgResolutionTimeHours) / annualTicketEfforts);
}

/** Median of the valid (finite) values only. Null when there are none. */
export function median(values: (number | null | undefined)[]): number | null {
  const a = values.filter((v): v is number => typeof v === 'number' && Number.isFinite(v)).sort((x, y) => x - y);
  if (!a.length) return null;
  const mid = Math.floor(a.length / 2);
  return a.length % 2 ? a[mid] : (a[mid - 1] + a[mid]) / 2;
}

/**
 * Deviation = (value - median) / median. Null if either input is
 * invalid/missing or the median is (near) zero, to avoid divide-by-zero.
 */
export function computeDeviation(value: number | null, verticalMedian: number | null): number | null {
  if (value == null || !Number.isFinite(value)) return null;
  if (verticalMedian == null || !Number.isFinite(verticalMedian) || Math.abs(verticalMedian) <= UTILITY_EPSILON) return null;
  return finiteOrNull((value - verticalMedian) / verticalMedian);
}

/**
 * Single source of truth for the full recalculation pipeline:
 *
 *   Raw fields → Utility Count → PUUC → Vertical PUUC Median → PUUC Deviation
 *              → ERR → Vertical ERR Median → ERR Deviation
 *
 * All medians are computed in-app, per vertical, from the CURRENT dataset —
 * never read from a pasted spreadsheet column.
 */
export function applyBenchmarks(rawRows: RawRow[]): Row[] {
  // Pass 1: utility count, PUUC, ERR (row-local — no cross-row dependency yet)
  const stage1 = rawRows.map((r) => {
    const utilityCount = computeUtilityCount(r.composition);
    const puuc = computePUUC(r.coreInvoicingFY26, utilityCount);
    const err = computeERR(puuc, r.avgResolutionTimeHours, r.annualTicketEfforts);
    return { ...r, utilityCount, puuc, err };
  });

  // Pass 2: vertical medians, computed in-app from this dataset's valid PUUC/ERR values only
  const puucByVertical = new Map<string, number[]>();
  const errByVertical = new Map<string, number[]>();
  for (const r of stage1) {
    if (r.puuc != null) (puucByVertical.get(r.verticalKey) ?? puucByVertical.set(r.verticalKey, []).get(r.verticalKey)!).push(r.puuc);
    if (r.err != null) (errByVertical.get(r.verticalKey) ?? errByVertical.set(r.verticalKey, []).get(r.verticalKey)!).push(r.err);
  }
  const puucMedianByVertical = new Map<string, number | null>();
  const errMedianByVertical = new Map<string, number | null>();
  for (const [vk, values] of puucByVertical) puucMedianByVertical.set(vk, median(values));
  for (const [vk, values] of errByVertical) errMedianByVertical.set(vk, median(values));

  // Pass 3: deviations
  return stage1.map((r) => {
    const puucMedian = puucMedianByVertical.get(r.verticalKey) ?? null;
    const errMedian = errMedianByVertical.get(r.verticalKey) ?? null;
    const puucDeviation = computeDeviation(r.puuc, puucMedian);
    const errDeviation = computeDeviation(r.err, errMedian);
    return {
      ...r,
      puucMedian,
      errMedian,
      puucDeviation,
      errDeviation,
      classification: 'undetermined', // filled in by classify() in quadrant.ts
    };
  });
}
