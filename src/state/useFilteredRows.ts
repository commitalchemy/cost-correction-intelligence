import { useMemo } from 'react';
import { useFilterStore } from './filterStore';
import { bucket, scoreRows } from '../lib/metrics';
import type { ScoredRow } from '../types';

export function useFilteredRows(): ScoredRow[] {
  const rows = useFilterStore((s) => s.rows);
  const vertical = useFilterStore((s) => s.vertical);
  const classification = useFilterStore((s) => s.classification);
  const band = useFilterStore((s) => s.band);
  const minPriority = useFilterStore((s) => s.minPriority);
  const search = useFilterStore((s) => s.search);

  return useMemo(() => {
    const source = rows.filter(
      (r) =>
        (vertical === 'All' || r.vertical === vertical) &&
        (classification === 'All' || r.classification === classification) &&
        (band === 'All' || bucket(r.puucDeviation) === band) &&
        (search.trim() === '' || r.name.toLowerCase().includes(search.trim().toLowerCase()))
    );
    return scoreRows(source)
      .filter((r) => r.score >= minPriority / 100)
      .sort((a, b) => b.score - a.score);
  }, [rows, vertical, classification, band, minPriority, search]);
}
