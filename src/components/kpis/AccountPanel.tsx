import { useFilterStore } from '../../state/filterStore';
import { useFilteredRows } from '../../state/useFilteredRows';
import { moneyCompact, pct } from '../../lib/metrics';

const VISIBLE_LIMIT = 200;

export default function AccountPanel() {
  const panel = useFilterStore((s) => s.accountPanel);
  const close = useFilterStore((s) => s.closeAccountPanel);
  const openDrawer = useFilterStore((s) => s.openDrawer);
  const rows = useFilteredRows();

  if (!panel) return null;

  const list =
    panel.category === 'total'
      ? rows
      : panel.category === 'expensive-to-serve'
        ? rows.filter((r) => r.expensiveToServe)
        : rows.filter((r) => r.classification === panel.category);
  const visible = list.slice(0, VISIBLE_LIMIT);

  return (
    <div className="account-drawer open" onClick={(e) => e.target === e.currentTarget && close()}>
      <div className="account-card">
        <div className="account-head">
          <div>
            <div className="eyebrow">Institutions</div>
            <h2>{panel.title}</h2>
          </div>
          <button className="close" onClick={close} aria-label="Close">
            ×
          </button>
        </div>
        <div className="account-count">
          {list.length.toLocaleString()} institution{list.length === 1 ? '' : 's'}
        </div>
        {list.length === 0 ? (
          <div className="account-empty">No institutions in this category.</div>
        ) : (
          <div className="account-list">
            {visible.map((r) => (
              <div className="account-row" key={r.id} onClick={() => openDrawer(r)}>
                <span className="name">{r.name}</span>
                <span className="meta-val">{r.puucDeviation == null ? moneyCompact(r.puuc) : pct(r.puucDeviation)}</span>
              </div>
            ))}
            {list.length > VISIBLE_LIMIT && (
              <div className="account-more">Showing {VISIBLE_LIMIT} of {list.length.toLocaleString()}</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
