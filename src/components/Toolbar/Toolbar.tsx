import { useFilterStore } from '../../state/filterStore';
import { CLASSIFICATION_LABEL } from '../../lib/quadrant';
import type { Classification } from '../../types';

const BANDS: { value: string; label: string }[] = [
  { value: 'All', label: 'All' },
  { value: 'below-50', label: '< -50%' },
  { value: '-50-0', label: '-50% to 0%' },
  { value: '0-20', label: '0% to 20%' },
  { value: '20-50', label: '20% to 50%' },
  { value: '50-100', label: '50% to 100%' },
  { value: 'above-100', label: '> 100%' },
  { value: 'invalid', label: 'Unusable / invalid' },
];

const CLASSIFICATIONS: (Classification | 'All')[] = [
  'All',
  'both-high',
  'cost-only',
  'effort-only',
  'healthy',
  'no-utility',
  'undetermined',
];

export default function Toolbar() {
  const rows = useFilterStore((s) => s.rows);
  const vertical = useFilterStore((s) => s.vertical);
  const classification = useFilterStore((s) => s.classification);
  const band = useFilterStore((s) => s.band);
  const minPriority = useFilterStore((s) => s.minPriority);
  const setVertical = useFilterStore((s) => s.setVertical);
  const setClassification = useFilterStore((s) => s.setClassification);
  const setBand = useFilterStore((s) => s.setBand);
  const setMinPriority = useFilterStore((s) => s.setMinPriority);
  const clearAll = useFilterStore((s) => s.clearAll);

  const verticals = ['All', ...Array.from(new Set(rows.map((r) => r.vertical))).sort((a, b) => a.localeCompare(b))];

  return (
    <section className="toolbar">
      <div className="control">
        <label>Vertical</label>
        <select value={vertical} onChange={(e) => setVertical(e.target.value)}>
          {verticals.map((v) => (
            <option key={v} value={v}>
              {v}
            </option>
          ))}
        </select>
      </div>
      <div className="control">
        <label>Classification</label>
        <select value={classification} onChange={(e) => setClassification(e.target.value as Classification | 'All')}>
          {CLASSIFICATIONS.map((c) => (
            <option key={c} value={c}>
              {c === 'All' ? 'All' : CLASSIFICATION_LABEL[c]}
            </option>
          ))}
        </select>
      </div>
      <div className="control">
        <label>PUUC deviation band</label>
        <select value={band} onChange={(e) => setBand(e.target.value as any)}>
          {BANDS.map((b) => (
            <option key={b.value} value={b.value}>
              {b.label}
            </option>
          ))}
        </select>
      </div>
      <div className="control">
        <label>Min priority</label>
        <input
          type="number"
          min={0}
          max={100}
          step={5}
          value={minPriority}
          onChange={(e) => setMinPriority(+e.target.value || 0)}
          style={{ width: 100 }}
        />
      </div>
      <div className="spacer" />
      <button className="btn compact" onClick={clearAll}>
        Reset
      </button>
    </section>
  );
}
