import { useFilterStore } from '../../state/filterStore';
import { CLASSIFICATION_LABEL } from '../../lib/quadrant';
import type { Classification } from '../../types';

const BAND_LABEL: Record<string, string> = {
  'below-50': 'PUUC deviation < -50%',
  '-50-0': 'PUUC deviation -50% to 0%',
  '0-20': 'PUUC deviation 0% to 20%',
  '20-50': 'PUUC deviation 20% to 50%',
  '50-100': 'PUUC deviation 50% to 100%',
  'above-100': 'PUUC deviation > 100%',
  invalid: 'Unusable / invalid PUUC deviation',
};

export default function FilterChips() {
  const vertical = useFilterStore((s) => s.vertical);
  const classification = useFilterStore((s) => s.classification);
  const band = useFilterStore((s) => s.band);
  const minPriority = useFilterStore((s) => s.minPriority);
  const search = useFilterStore((s) => s.search);
  const setVertical = useFilterStore((s) => s.setVertical);
  const setClassification = useFilterStore((s) => s.setClassification);
  const setBand = useFilterStore((s) => s.setBand);
  const setMinPriority = useFilterStore((s) => s.setMinPriority);
  const setSearch = useFilterStore((s) => s.setSearch);
  const clearAll = useFilterStore((s) => s.clearAll);

  const chips: { key: string; label: string; onClear: () => void }[] = [];
  if (vertical !== 'All') chips.push({ key: 'v', label: `Vertical: ${vertical}`, onClear: () => setVertical('All') });
  if (classification !== 'All')
    chips.push({
      key: 'c',
      label: `Classification: ${CLASSIFICATION_LABEL[classification as Classification]}`,
      onClear: () => setClassification('All'),
    });
  if (band !== 'All') chips.push({ key: 'b', label: BAND_LABEL[band] || band, onClear: () => setBand('All') });
  if (minPriority > 0) chips.push({ key: 'p', label: `Priority ≥ ${minPriority}`, onClear: () => setMinPriority(0) });
  if (search.trim() !== '') chips.push({ key: 's', label: `Search: "${search}"`, onClear: () => setSearch('') });

  if (!chips.length) return null;

  return (
    <div className="chips">
      {chips.map((c) => (
        <span className="chip" key={c.key}>
          {c.label}
          <button onClick={c.onClear} aria-label={`Clear ${c.label}`}>
            ×
          </button>
        </span>
      ))}
      <button className="clear-all" onClick={clearAll}>
        Clear all
      </button>
    </div>
  );
}
