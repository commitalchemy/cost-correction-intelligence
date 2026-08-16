import { useFilteredRows } from '../../state/useFilteredRows';
import { useFilterStore } from '../../state/filterStore';
import { moneyCompact, pct, financialExposure } from '../../lib/metrics';
import type { Classification } from '../../types';

const RECOMMENDED_ACTION: Record<Classification, string> = {
  'both-high': 'Investigate now: cost and effort are both elevated',
  'cost-only': 'Review cost overrun; effort is not the driver',
  'effort-only': 'Review effort load; cost is within range',
  healthy: 'No action needed',
  'no-utility': 'No usage signal — verify account status',
  undetermined: 'Classification missing; cannot determine',
};

export default function ActionTable() {
  const rows = useFilteredRows();
  const openDrawer = useFilterStore((s) => s.openDrawer);

  const ranked = [...rows].sort((a, b) => {
    const ea = financialExposure(a) ?? -1;
    const eb = financialExposure(b) ?? -1;
    if (eb !== ea) return eb - ea;
    return b.score - a.score;
  });

  const top10 = ranked.slice(0, 10);

  return (
    <section className="panel" style={{ marginTop: 14 }}>
      <h2>Top 10 Institutions</h2>
      <div className="desc">Ranked by ₹ exposure above the recalculated benchmark, then priority score.</div>
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
                <th>₹ Exposure</th>
                <th>PUUC Deviation</th>
                <th>Priority</th>
                <th>Recommended action</th>
              </tr>
            </thead>
            <tbody>
              {top10.map((r) => {
                const exposure = financialExposure(r);
                return (
                  <tr key={r.id} onClick={() => openDrawer(r)}>
                    <td>{r.name}</td>
                    <td>{r.vertical}</td>
                    <td>{exposure == null ? '—' : <b>{moneyCompact(exposure)}</b>}</td>
                    <td>{r.puucDeviation == null ? '—' : pct(r.puucDeviation)}</td>
                    <td>
                      <b>{Math.round(r.score * 100)}</b>
                    </td>
                    <td className="rec-action">{RECOMMENDED_ACTION[r.classification]}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
