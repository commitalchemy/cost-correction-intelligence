import { useFilteredRows } from '../../state/useFilteredRows';
import { useFilterStore } from '../../state/filterStore';
import { CLASSIFICATION_LABEL } from '../../lib/quadrant';
import { pct } from '../../lib/metrics';
import { EXPENSIVE_TO_SERVE_MULTIPLIER } from '../../lib/expensiveToServe';

export default function ExpensiveToServeTable() {
  const rows = useFilteredRows();
  const openDrawer = useFilterStore((s) => s.openDrawer);

  const ranked = rows
    .filter((r) => r.expensiveToServe)
    .sort((a, b) => (b.infraIndex ?? 0) - (a.infraIndex ?? 0));

  const top10 = ranked.slice(0, 10);

  return (
    <section className="panel" style={{ marginTop: 14 }}>
      <h2>Top 10 Expensive to Serve</h2>
      <div className="desc">
        Ranked by Infra Cost Index (Infra Cost % Revenue ÷ vertical median), {EXPENSIVE_TO_SERVE_MULTIPLIER}× threshold. Separate
        lens — does not change Cost/Effort classification or Top 10 Priority ranking.
      </div>
      {top10.length === 0 ? (
        <div className="desc" style={{ padding: '24px 0', textAlign: 'center' }}>
          No institutions match the current filters.
        </div>
      ) : (
        <div className="tablewrap" style={{ maxHeight: 'none' }}>
          <table className="table">
            <thead>
              <tr>
                <th>Institution</th>
                <th>Vertical</th>
                <th>Classification</th>
                <th>Infra % Revenue</th>
                <th
                  title="The vertical's median Infra Cost % Revenue — the peer benchmark this row is compared against."
                  style={{ cursor: 'help', textDecoration: 'underline dotted' }}
                >
                  Vertical Median
                </th>
                <th>Infra Index</th>
              </tr>
            </thead>
            <tbody>
              {top10.map((r) => (
                <tr key={r.id} onClick={() => openDrawer(r)}>
                  <td>{r.name}</td>
                  <td>{r.vertical}</td>
                  <td>{CLASSIFICATION_LABEL[r.classification]}</td>
                  <td>{r.infraPctRevenue == null ? '—' : pct(r.infraPctRevenue)}</td>
                  <td>{r.infraVerticalMedian == null ? '—' : pct(r.infraVerticalMedian)}</td>
                  <td>
                    <b>{r.infraIndex == null ? '—' : `${r.infraIndex.toFixed(1)}×`}</b>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
