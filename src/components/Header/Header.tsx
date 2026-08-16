import { useRef, useState } from 'react';
import { useFilterStore } from '../../state/filterStore';
import { parseFile } from '../../lib/parse';
import { buildRows } from '../../lib/pipeline';

export default function Header() {
  const fileRef = useRef<HTMLInputElement>(null);
  const setRows = useFilterStore((s) => s.setRows);
  const setLoadError = useFilterStore((s) => s.setLoadError);
  const setLastFile = useFilterStore((s) => s.setLastFile);
  const lastFile = useFilterStore((s) => s.lastFile);
  const [refreshing, setRefreshing] = useState(false);

  async function loadFromFile(file: File) {
    try {
      const raw = await parseFile(file);
      const rows = buildRows(raw);
      setRows(rows);
      setLastFile(file);
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : 'Could not read the dataset.');
    }
  }

  async function handlePick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) await loadFromFile(file);
    e.target.value = '';
  }

  async function handleRefresh() {
    if (!lastFile) return;
    setRefreshing(true);
    await loadFromFile(lastFile);
    setRefreshing(false);
  }

  return (
    <header className="top">
      <div className="top-left">
        <div className="eyebrow">Cost Correction</div>
        <h1>Cost Correction Dashboard</h1>
        <div className="sub">Where cost exposure is concentrated and where action is required</div>
      </div>
      <div className="top-actions">
        <div className="top-actions-row">
          <button className="btn compact primary" onClick={() => fileRef.current?.click()}>
            Load CSV / Excel
          </button>
          <button className="btn compact" onClick={handleRefresh} disabled={!lastFile || refreshing}>
            {refreshing ? 'Refreshing…' : 'Refresh'}
          </button>
        </div>
        <input ref={fileRef} type="file" accept=".csv,.xlsx,.xls" hidden onChange={handlePick} />
      </div>
    </header>
  );
}
