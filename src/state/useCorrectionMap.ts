import { useMemo } from 'react';
import { useFilterStore } from './filterStore';
import { computeStableVerticalMedians } from '../lib/correction';

/**
 * The stable vertical PUUC median (used for Total Correction Opportunity)
 * is deliberately computed from the FULL dataset, not the filtered view —
 * so the benchmark stays stable and doesn't shift when leadership filters
 * down to a single vertical or classification.
 */
export function useCorrectionMap(): Map<string, number | null> {
  const rows = useFilterStore((s) => s.rows);
  return useMemo(() => computeStableVerticalMedians(rows), [rows]);
}
