import Plot from '../../lib/plotly';
import { useFilteredRows } from '../../state/useFilteredRows';
import { useFilterStore } from '../../state/filterStore';
import { median, average } from '../../lib/metrics';

const layout = (extra: Record<string, any> = {}) => ({
  margin: { l: 52, r: 18, t: 16, b: 52 },
  font: { family: 'Inter,system-ui,sans-serif', size: 11, color: '#5c5648' },
  paper_bgcolor: 'rgba(0,0,0,0)',
  plot_bgcolor: 'rgba(0,0,0,0)',
  hoverlabel: { font: { size: 12 } },
  ...extra,
});

export default function VerticalChart() {
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
      list,
      med: median(list.map((r) => r.puuc)),
      avgDev: average(list.map((r) => r.puucDeviation)),
    }))
    .filter((x) => x.med != null)
    .sort((a, b) => (b.avgDev ?? -Infinity) - (a.avgDev ?? -Infinity))
    .slice(0, 20);

  return (
    <section className="panel">
      <h2>Vertical Benchmark</h2>
      <div className="desc">Recalculated median PUUC by vertical. Click a bar to filter.</div>
      <div className="chart small">
        <Plot
          data={[
            {
              x: verticals.map((x) => x.v),
              y: verticals.map((x) => x.med),
              type: 'bar',
              marker: { color: verticals.map((x) => (vertical === 'All' || vertical === x.v ? '#22304D' : '#DCE1EC')) },
              customdata: verticals.map((x) => x.avgDev),
              hovertemplate: '%{x}<br>Median PUUC: ₹%{y:.0f}<br>Avg deviation: %{customdata:.1%}<extra></extra>',
            } as any,
          ]}
          layout={layout({ showlegend: false, xaxis: { tickangle: -25 }, yaxis: { title: 'Median PUUC', gridcolor: '#EFE9DC' } })}
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
      </div>
    </section>
  );
}
