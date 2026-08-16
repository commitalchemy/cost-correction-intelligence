import { useFilteredRows } from '../../state/useFilteredRows';
import { useFilterStore } from '../../state/filterStore';
import { CLASSIFICATION_LABEL } from '../../lib/quadrant';
import type { AccountPanelCategory } from '../../state/filterStore';
import type { Classification } from '../../types';

export default function KpiRow() {
  const rows = useFilteredRows();
  const openAccountPanel = useFilterStore((s) => s.openAccountPanel);

  const counts: Record<Classification, number> = {
    'both-high': 0,
    'cost-only': 0,
    'effort-only': 0,
    healthy: 0,
    'no-utility': 0,
    undetermined: 0,
  };
  rows.forEach((r) => counts[r.classification]++);

  const cards: { key: AccountPanelCategory; cls: string; label: string; value: number; sub: string }[] = [
    { key: 'both-high', cls: 'both', label: CLASSIFICATION_LABEL['both-high'], value: counts['both-high'], sub: 'Cost and effort' },
    { key: 'cost-only', cls: 'cost', label: CLASSIFICATION_LABEL['cost-only'], value: counts['cost-only'], sub: 'Above benchmark' },
    { key: 'effort-only', cls: 'effort', label: CLASSIFICATION_LABEL['effort-only'], value: counts['effort-only'], sub: 'Elevated effort' },
    { key: 'healthy', cls: 'healthy', label: CLASSIFICATION_LABEL.healthy, value: counts.healthy, sub: 'Within benchmark' },
    { key: 'no-utility', cls: 'undetermined', label: CLASSIFICATION_LABEL['no-utility'], value: counts['no-utility'], sub: 'No usage signal' },
    { key: 'undetermined', cls: 'undetermined', label: CLASSIFICATION_LABEL.undetermined, value: counts.undetermined, sub: 'Missing benchmark data' },
    { key: 'total', cls: 'total', label: 'Total', value: rows.length, sub: 'In current view' },
  ];

  return (
    <section className="kpis">
      {cards.map((c) => (
        <div
          key={c.key}
          className={`kpi ${c.cls}`}
          onClick={() => openAccountPanel({ category: c.key, title: c.label })}
          role="button"
          tabIndex={0}
        >
          <div className="label">{c.label}</div>
          <div className="value">{c.value.toLocaleString()}</div>
          <div className="kpi-sub">{c.sub}</div>
        </div>
      ))}
    </section>
  );
}
