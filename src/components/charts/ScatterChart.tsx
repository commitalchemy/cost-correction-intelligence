import Plot from '../../lib/plotly';
import { useFilteredRows } from '../../state/useFilteredRows';
import { useFilterStore } from '../../state/filterStore';
import { CLASSIFICATION_LABEL } from '../../lib/quadrant';
import { COLORS } from '../../lib/canonicalize';
import type { Classification } from '../../types';

// Chart shows only the four evaluable classifications — No Utility and
// Undetermined are excluded from the legend/plot by design.
const ORDER: Classification[] = ['both-high', 'cost-only', 'effort-only', 'healthy'];

const layout = (extra: Record<string, any> = {}) => ({
  margin: { l: 56, r: 18, t: 44, b: 48 },
  font: { family: 'Inter,system-ui,sans-serif', size: 11, color: '#5c5648' },
  paper_bgcolor: 'rgba(0,0,0,0)',
  plot_bgcolor: 'rgba(0,0,0,0)',
  hoverlabel: { font: { size: 12 } },
  ...extra,
});

export default function ScatterChart() {
  const rows = useFilteredRows();
  const openDrawer = useFilterStore((s) => s.openDrawer);
  const usable = rows.filter((r) => r.puucDeviation != null && r.puuc != null);
  const present = ORDER.filter((c) => usable.some((r) => r.classification === c));

  const traces = present.map((c, i) => {
    const z = usable.filter((r) => r.classification === c);
    return {
      x: z.map((r) => r.puucDeviation),
      y: z.map((r) => r.puuc),
      text: z.map((r) => r.name),
      customdata: z,
      mode: 'markers' as const,
      name: CLASSIFICATION_LABEL[c],
      marker: { size: 8, color: COLORS[i % COLORS.length], opacity: 0.78, line: { width: 1, color: '#fff' } },
    };
  });

  return (
    <section className="panel">
      <h2>Cost Distribution</h2>
      <div className="desc">PUUC against recalculated PUUC deviation. Click a point for institution detail.</div>
      <div className="chart">
        {usable.length === 0 ? (
          <div className="chart-empty">No institutions with a usable PUUC in the current view.</div>
        ) : (
          <Plot
            data={traces as any}
            layout={layout({
              xaxis: { title: 'PUUC deviation vs vertical median', tickformat: '.0%', zeroline: true, gridcolor: '#EFE9DC' },
              yaxis: { title: 'PUUC (₹)', gridcolor: '#EFE9DC' },
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
