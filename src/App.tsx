import { useFilterStore } from './state/filterStore';
import Header from './components/Header/Header';
import Toolbar from './components/Toolbar/Toolbar';
import DefinitionPanel from './components/DefinitionPanel/DefinitionPanel';
import FilterChips from './components/filters/FilterChips';
import KpiRow from './components/kpis/KpiRow';
import AccountPanel from './components/kpis/AccountPanel';
import ScatterChart from './components/charts/ScatterChart';
import DistChart from './components/charts/DistChart';
import VerticalChart from './components/charts/VerticalChart';
import ErrChart from './components/charts/ErrChart';
import ErrComparisonChart from './components/charts/ErrComparisonChart';
import QuadrantMatrix from './components/charts/QuadrantMatrix';
import PriorityChart from './components/charts/PriorityChart';
import ActionTable from './components/table/ActionTable';
import InstitutionTable from './components/table/InstitutionTable';
import DrawerPanel from './components/drilldown/DrawerPanel';

export default function App() {
  const loaded = useFilterStore((s) => s.loaded);
  const loadError = useFilterStore((s) => s.loadError);
  const rows = useFilterStore((s) => s.rows);

  return (
    <main className="app">
      <Header />
      <DefinitionPanel />
      {loaded && <Toolbar />}
      {loaded && <FilterChips />}

      {loadError && <div className="error">{loadError}</div>}

      {!loaded ? (
        <section className="panel empty">
          <b>Load the working dataset to begin</b>
          <p className="meta">Upload the Google Sheet export as CSV/XLSX. Common column-name variants are mapped automatically.</p>
        </section>
      ) : (
        <div>
          <KpiRow />
          <ActionTable />

          <div className="grid2">
            <ScatterChart />
            <DistChart />
          </div>

          <div className="grid3">
            <VerticalChart />
            <ErrChart />
            <PriorityChart />
          </div>

          <div className="grid2">
            <ErrComparisonChart />
            <QuadrantMatrix />
          </div>

          <InstitutionTable />
        </div>
      )}

      {loaded && rows.length === 0 && (
        <section className="panel empty">
          <b>Dataset loaded but no rows were usable</b>
        </section>
      )}

      <DrawerPanel />
      <AccountPanel />
    </main>
  );
}
