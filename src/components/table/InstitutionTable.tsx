import { useState } from 'react';
import { useFilteredRows } from '../../state/useFilteredRows';
import { useFilterStore } from '../../state/filterStore';
import { money, pct } from '../../lib/metrics';
import { CLASSIFICATION_LABEL } from '../../lib/quadrant';
import type { ScoredRow, Classification } from '../../types';

type SortKey = 'name' | 'vertical' | 'puuc' | 'puucDeviation' | 'err' | 'classification' | 'score';

function badgeClass(c: Classification) {
  if (c === 'both-high') return 'high';
  if (c === 'cost-only' || c === 'effort-only') return 'med';
  if (c === 'healthy') return 'low';
  return 'neutral';
}

export default function InstitutionTable() {
  const rows = useFilteredRows();
  const search = useFilterStore((s) => s.search);
  const setSearch = useFilterStore((s) => s.setSearch);
  const openDrawer = useFilterStore((s) => s.openDrawer);
  const [sortKey, setSortKey] = useState<SortKey>('score');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [expanded, setExpanded] = useState(false);

  function sortValue(r: ScoredRow, key: SortKey): number | string {
    switch (key) {
      case 'name':
      case 'vertical':
      case 'classification':
        return r[key];
      case 'puuc':
        return r.puuc ?? -Infinity;
      case 'puucDeviation':
        return r.puucDeviation ?? -Infinity;
      case 'err':
        return r.err ?? -Infinity;
      case 'score':
        return r.score;
    }
  }

  function toggleSort(key: SortKey) {
    if (sortKey === key) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else {
      setSortKey(key);
      setSortDir('desc');
    }
  }

  const sorted = [...rows].sort((a, b) => {
    const av = sortValue(a, sortKey);
    const bv = sortValue(b, sortKey);
    const cmp = typeof av === 'string' ? av.localeCompare(bv as string) : (av as number) - (bv as number);
    return sortDir === 'asc' ? cmp : -cmp;
  });

  const visible = sorted.slice(0, 150);

  const cols: { key: SortKey; label: string }[] = [
    { key: 'name', label: 'Institution' },
    { key: 'vertical', label: 'Vertical' },
    { key: 'puuc', label: 'PUUC' },
    { key: 'puucDeviation', label: 'PUUC Deviation' },
    { key: 'err', label: 'ERR' },
    { key: 'classification', label: 'Classification' },
    { key: 'score', label: 'Priority' },
  ];

  return (
    <section className="panel" style={{ marginTop: 14 }}>
      <div className="panel-head">
        <div>
          <h2>Full Institution List</h2>
          <div className="desc">{rows.length.toLocaleString()} filtered institutions.</div>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {expanded && (
            <input
              className="control"
              placeholder="Search institution…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ height: 34, border: '1px solid var(--line)', borderRadius: 8, padding: '0 10px', minWidth: 200 }}
            />
          )}
          <button className="btn compact" onClick={() => setExpanded((v) => !v)}>
            {expanded ? 'Collapse' : `Show full list (${rows.length.toLocaleString()})`}
          </button>
        </div>
      </div>
      {!expanded ? null : rows.length === 0 ? (
        <div className="desc" style={{ padding: '24px 0', textAlign: 'center' }}>
          No institutions match the current filters.
        </div>
      ) : (
        <div className="tablewrap">
          <table className="table">
            <thead>
              <tr>
                {cols.map((c) => (
                  <th key={c.key} onClick={() => toggleSort(c.key)}>
                    {c.label}
                    {sortKey === c.key ? (sortDir === 'asc' ? ' ▲' : ' ▼') : ''}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {visible.map((r) => (
                <tr key={r.id} onClick={() => openDrawer(r)}>
                  <td>{r.name}</td>
                  <td>{r.vertical}</td>
                  <td>{money(r.puuc)}</td>
                  <td>{r.puucDeviation == null ? '—' : <b>{pct(r.puucDeviation)}</b>}</td>
                  <td>{r.err == null ? '—' : r.err.toFixed(3)}</td>
                  <td>
                    <span className={`badge ${badgeClass(r.classification)}`}>{CLASSIFICATION_LABEL[r.classification]}</span>
                  </td>
                  <td>
                    <b>{Math.round(r.score * 100)}</b>
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
