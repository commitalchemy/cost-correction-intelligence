import Plot from '../../lib/plotly';
import { useFilteredRows } from '../../state/useFilteredRows';
import { useFilterStore } from '../../state/filterStore';
import { EXPENSIVE_TO_SERVE_MULTIPLIER } from '../../lib/expensiveToServe';

const layout = (extra: Record<string, any> = {}) => ({
  margin: { l: 56, r: 18, t: 44, b: 48 },
  font: { family: 'Inter,system-ui,sans-serif', size: 11, color: '#5c5648' },
  paper_bgcolor: 'rgba(0,0,0,0)',
  plot_bgcolor: 'rgba(0,0,0,0)',
  hoverlabel: { font: { size: 12 } },
  ...extra,
});

export default function ExpensiveToServeChart() {
  const rows = useFilteredRows();
  const openDrawer = useFilterStore((s) => s.openDrawer);
  const usable = rows.filter((r) => r.infraIndex != null && r.puucDeviation != null);
  const flagged = usable.filter((r) => r.expensiveToServe);
  const rest = usable.filter((r) => !r.expensiveToServe);

  const traces = [
    {
      x: rest.map((r) => r.puucDeviation),
      y: rest.map((r) => r.infraIndex),
      text: rest.map((r) => r.name),
      customdata: rest,
      mode: 'markers' as const,
      name: 'Normal',
      marker: { size: 7, color: '#B8B2A2', opacity: 0.55 },
    },
    {
      x: flagged.map((r) => r.puucDeviation),
      y: flagged.map((r) => r.infraIndex),
      text: flagged.map((r) => r.name),
      customdata: flagged,
      mode: 'markers' as const,
      name: 'Expensive to Serve',
      marker: { size: 9, color: '#C1463C', opacity: 0.9, line: { width: 1, color: '#fff' } },
    },
  ];

  return (
    <section className="panel">
      <h2>Expensive to Serve</h2>
      <div className="desc">
        Infra Cost Index (Infra Cost % Revenue ÷ vertical median) vs PUUC deviation. Points above the dotted line cost{' '}
        {EXPENSIVE_TO_SERVE_MULTIPLIER}× their vertical's typical Infra Cost share, independent of Cost/Effort classification.
        Click a point for detail.
      </div>
      <div className="chart">
        {usable.length === 0 ? (
          <div className="chart-empty">No institutions with usable Infra Cost and revenue data in the current view.</div>
        ) : (
          <Plot
            data={traces as any}
            layout={layout({
              xaxis: { title: 'PUUC deviation vs vertical median', tickformat: '.0%', zeroline: true, gridcolor: '#EFE9DC' },
              yaxis: { title: 'Infra Cost Index (× vertical median)', gridcolor: '#EFE9DC' },
              shapes: [
                {
                  type: 'line',
                  x0: 0,
                  x1: 1,
                  xref: 'paper',
                  y0: EXPENSIVE_TO_SERVE_MULTIPLIER,
                  y1: EXPENSIVE_TO_SERVE_MULTIPLIER,
                  line: { color: '#C1463C', width: 1, dash: 'dot' },
                },
              ],
              legend: { orientation: 'h', x: 0.5, xanchor: 'center', y: 1.16, yanchor: 'bottom', font: { size: 10 } },
              showlegend: true,
            })}
            config={{ responsive: true, displaylogo: false }}
            style={{ width: '100%', height: '100%' }}
            onClick={(d: any) => d.points?.[0]?.customdata && openDrawer(d.points[0].customdata)}
            useResizeHandler
          />
        )}
      </div>
    </section>
  );
}
