import { useFilteredRows } from '../../state/useFilteredRows';
import { useFilterStore } from '../../state/filterStore';
import { useCorrectionMap } from '../../state/useCorrectionMap';
import { computeCorrection, CORRECTION_UTILITY_FLOOR } from '../../lib/correction';

export default function ActionTable() {
  const rows = useFilteredRows();
  const openDrawer = useFilterStore((s) => s.openDrawer);
  const stableMedianByVertical = useCorrectionMap();

  // Rank by actual ₹ Revenue Gap (Section 9) — never by %. Only institutions
  // with Utility Count >= floor and a valid (>=3 peer) vertical benchmark
  // are eligible; institutions below the floor or in benchmark-sparse
  // verticals are excluded rather than shown with a distorted figure.
  const ranked = [...rows]
    .map((r) => ({ row: r, correction: computeCorrection(r, stableMedianByVertical) }))
    .filter((x) => x.correction.gap != null && x.correction.gap > 0)
    .sort((a, b) => b.correction.gap! - a.correction.gap!);

  const top10 = ranked.slice(0, 10);

  return (
    <section className="panel" style={{ marginTop: 14 }}>
      <h2>Top 10 Institutions</h2>
      <div className="desc">
        Ranked by ₹ Revenue Gap vs. vertical benchmark (Utility Count ≥ {CORRECTION_UTILITY_FLOOR}, benchmark requires 3+ comparable peers).
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
                <th>Utility Count</th>
                <th>Correction Opportunity %</th>
              </tr>
            </thead>
            <tbody>
              {top10.map(({ row: r, correction }) => (
                <tr key={r.id} onClick={() => openDrawer(r)}>
                  <td>{r.name}</td>
                  <td>{r.vertical}</td>
                  <td>{r.utilityCount!.toLocaleString(undefined, { maximumFractionDigits: 0 })}</td>
                  <td>
                    <b>{correction.pctOfIdeal == null ? '—' : `${correction.pctOfIdeal.toFixed(0)}%`}</b>
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
