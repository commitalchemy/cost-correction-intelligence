import Plot from '../../lib/plotly';
import { useFilteredRows } from '../../state/useFilteredRows';
import { useFilterStore } from '../../state/filterStore';
import { median } from '../../lib/metrics';

const layout = (extra: Record<string, any> = {}) => ({
  margin: { l: 56, r: 18, t: 16, b: 52 },
  font: { family: 'Inter,system-ui,sans-serif', size: 11, color: '#5c5648' },
  paper_bgcolor: 'rgba(0,0,0,0)',
  plot_bgcolor: 'rgba(0,0,0,0)',
  hoverlabel: { font: { size: 12 } },
  ...extra,
});

/** ERR (effort proxy) actual vs vertical benchmark, per vertical. */
export default function ErrComparisonChart() {
  const rows = useFilteredRows();
  const vertical = useFilterStore((s) => s.vertical);
  const setVertical = useFilterStore((s) => s.setVertical);

  const byVertical: Record<string, typeof rows> = {};
  rows.forEach((r) => {
    (byVertical[r.vertical] ??= []).push(r);
  });
  const verticals = Object.entries(byVertical)
    .map(([v, list]) => ({
      v,
      actual: median(list.map((r) => r.err)),
      benchmark: median(list.map((r) => r.errMedian)),
    }))
    .filter((x) => x.actual != null)
    .sort((a, b) => (b.actual ?? 0) - (a.actual ?? 0))
    .slice(0, 12);

  return (
    <section className="panel">
      <h2>ERR vs Vertical Benchmark</h2>
      <div className="desc">Median ERR (effort proxy) against its vertical benchmark. Click a bar to filter.</div>
      <div className="chart small">
        {verticals.length === 0 ? (
          <div className="chart-empty">No institutions with a usable ERR in the current view.</div>
        ) : (
          <Plot
            data={[
              {
                x: verticals.map((v) => v.v),
                y: verticals.map((v) => v.actual),
                name: 'Median ERR',
                type: 'bar',
                marker: { color: verticals.map((v) => (vertical === 'All' || vertical === v.v ? '#C15F3C' : '#EBD9CD')) },
                hovertemplate: '%{x}<br>Median ERR: %{y:.3f}<extra></extra>',
              } as any,
              {
                x: verticals.map((v) => v.v),
                y: verticals.map((v) => v.benchmark),
                name: 'Vertical Benchmark',
                type: 'scatter',
                mode: 'markers',
                marker: { symbol: 'diamond', size: 9, color: '#22304D' },
                hovertemplate: '%{x}<br>Benchmark ERR: %{y:.3f}<extra></extra>',
              } as any,
            ]}
            layout={layout({
              xaxis: { tickangle: -25 },
              yaxis: { title: 'ERR', gridcolor: '#EFE9DC' },
              legend: { orientation: 'h', y: 1.2, font: { size: 10 } },
            })}
            config={{ responsive: true, displaylogo: false }}
            style={{ width: '100%', height: '100%' }}
            onClick={(d: any) => {
              const idx = d.points?.[0]?.pointIndex;
              if (idx == null) return;
              const v = verticals[idx].v;
              setVertical(vertical === v ? 'All' : v);
            }}
            useResizeHandler
          />
        )}
      </div>
    </section>
  );
}
