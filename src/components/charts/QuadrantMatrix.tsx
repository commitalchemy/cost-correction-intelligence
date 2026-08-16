import { useFilteredRows } from '../../state/useFilteredRows';
import { useFilterStore } from '../../state/filterStore';
import { CLASSIFICATION_DESC, CLASSIFICATION_LABEL } from '../../lib/quadrant';
import type { Classification } from '../../types';

const CELLS: { q: Classification; cls: string }[] = [
  { q: 'cost-only', cls: 'q-cost-only' },
  { q: 'both-high', cls: 'q-both' },
  { q: 'healthy', cls: 'q-healthy' },
  { q: 'effort-only', cls: 'q-effort-only' },
];

export default function QuadrantMatrix() {
  const rows = useFilteredRows();
  const classification = useFilterStore((s) => s.classification);
  const setClassification = useFilterStore((s) => s.setClassification);

  const counts: Record<Classification, number> = {
    'cost-only': 0,
    'effort-only': 0,
    'both-high': 0,
    healthy: 0,
    'no-utility': 0,
    undetermined: 0,
  };
  rows.forEach((r) => counts[r.classification]++);

  return (
    <section className="panel">
      <h2>Priority Quadrant Matrix</h2>
      <div className="desc">Cost vs effort classification. Click a quadrant to filter the dashboard.</div>
      <div className="quadrant-wrap">
        <div className="quadrant" style={{ height: 240 }}>
          <div />
          <div className="q-axis-label">Effort: Low</div>
          <div className="q-axis-label">Effort: High</div>

          <div className="q-axis-label">Cost: Above</div>
          {[CELLS[0], CELLS[1]].map((c) => (
            <div
              key={c.q}
              className={`q-cell ${c.cls}${classification === c.q ? ' active' : ''}`}
              onClick={() => setClassification(classification === c.q ? 'All' : c.q)}
              title={CLASSIFICATION_DESC[c.q]}
            >
              <div className="q-count">{counts[c.q]}</div>
              <div className="q-name">{CLASSIFICATION_LABEL[c.q]}</div>
            </div>
          ))}

          <div className="q-axis-label">Cost: At/Below</div>
          {[CELLS[2], CELLS[3]].map((c) => (
            <div
              key={c.q}
              className={`q-cell ${c.cls}${classification === c.q ? ' active' : ''}`}
              onClick={() => setClassification(classification === c.q ? 'All' : c.q)}
              title={CLASSIFICATION_DESC[c.q]}
            >
              <div className="q-count">{counts[c.q]}</div>
              <div className="q-name">{CLASSIFICATION_LABEL[c.q]}</div>
            </div>
          ))}
        </div>
      </div>
      <div className="quadrant-footer">
        <span>
          {counts['no-utility'].toLocaleString()} no utility, {counts.undetermined.toLocaleString()} undetermined — excluded from the matrix
        </span>
        {classification !== 'All' && <button onClick={() => setClassification('All')}>Clear</button>}
      </div>
    </section>
  );
}
