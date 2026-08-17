import Plot from '../../lib/plotly';
import { useFilteredRows } from '../../state/useFilteredRows';
import { useFilterStore } from '../../state/filterStore';
import { CLASSIFICATION_LABEL, COST_HIGH_THRESHOLD, EFFORT_HIGH_THRESHOLD } from '../../lib/quadrant';
import { COLORS } from '../../lib/canonicalize';
import { symlog, symlogArray, symlogTicks } from '../../lib/symlog';
import type { Classification } from '../../types';

// Chart shows only the four evaluable classifications — No Utility and
// Undetermined are excluded from the legend/plot by design.
const ORDER: Classification[] = ['both-high', 'cost-only', 'effort-only', 'healthy'];

const LINTHRESH = 1; // linear out to ±100% deviation, log beyond it, on both axes

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
// Both axes are recalculated deviations now (cost = puucDeviation, effort =
  // errDeviation). A row needs both to be plottable — one side being
  // unavailable no longer hides the row from classification (see
  // quadrant.ts), but it does mean there's no y (or x) coordinate to plot.
  const usable = rows.filter((r) => r.puucDeviation != null && r.errDeviation != null);
  const present = ORDER.filter((c) => usable.some((r) => r.classification === c));

  const allX = usable.map((r) => r.puucDeviation!);
  const allY = usable.map((r) => r.errDeviation!);
  const xMin = allX.length ? Math.min(...allX) : -1;
  const xMax = allX.length ? Math.max(...allX) : 1;
  const yMin = allY.length ? Math.min(...allY) : -1;
  const yMax = allY.length ? Math.max(...allY) : 1;

  // Full range, zero clipping — every plottable row is shown.
  const xRange: [number, number] = [symlog(xMin - 0.05, LINTHRESH), symlog(xMax * 1.15, LINTHRESH)];
  const yRange: [number, number] = [symlog(yMin - 0.05, LINTHRESH), symlog(yMax * 1.15, LINTHRESH)];

  const xTicks = symlogTicks(xMin - 0.05, xMax * 1.15, LINTHRESH, COST_HIGH_THRESHOLD);
  const yTicks = symlogTicks(yMin - 0.05, yMax * 1.15, LINTHRESH, EFFORT_HIGH_THRESHOLD);

  const costThreshT = symlog(COST_HIGH_THRESHOLD, LINTHRESH);
  const effortThreshT = symlog(EFFORT_HIGH_THRESHOLD, LINTHRESH);
  const zeroT = symlog(0, LINTHRESH);

  const traces = present.map((c, i) => {
   const z = usable.filter((r) => r.classification === c);
    return {
      x: symlogArray(z.map((r) => r.puucDeviation!), LINTHRESH),
      y: symlogArray(z.map((r) => r.errDeviation!), LINTHRESH),
      text: z.map((r) => r.name),
      customdata: z,
      mode: 'markers' as const,
      name: CLASSIFICATION_LABEL[c],
      marker: { size: 6, color: COLORS[i % COLORS.length], opacity: 0.55, line: { width: 0.5, color: '#fff' } },
      // customdata carries the raw row; hover reads the untransformed
      // deviation values off it, never the symlog-transformed plot coords.
      hovertemplate:
        '<b>%{text}</b><br>Cost deviation: %{customdata.puucDeviation:.0%}<br>Effort deviation: %{customdata.errDeviation:.0%}<extra></extra>',
    };
  });

  return (
    <section className="panel">
      <h2>Cost vs. Effort Distribution</h2>
      <div className="desc">
        Cost deviation vs effort deviation. Click a point for institution detail.
      </div>
      <div className="chart">
        {usable.length === 0 ? (
          <div className="chart-empty">No institutions with a usable Cost/Effort deviation in the current view.</div>
        ) : (
          <Plot
            data={traces as any}
            layout={layout({
              xaxis: {
                title: 'Cost Deviation vs Vertical Median',
                type: 'linear',
                tickmode: 'array',
                tickvals: xTicks.tickvals,
                ticktext: xTicks.ticktext,
                gridcolor: '#EFE9DC',
                range: xRange,
                autorange: false,
              },
              yaxis: {
                title: 'Effort Deviation vs Vertical Median (lower = worse)',
                type: 'linear',
                tickmode: 'array',
                tickvals: yTicks.tickvals,
                ticktext: yTicks.ticktext,
                gridcolor: '#EFE9DC',
                range: yRange,
                autorange: false,
              },
               shapes: [
                { type: 'line', x0: zeroT, x1: zeroT, y0: yRange[0], y1: yRange[1], line: { color: '#ddd', width: 0.75 } },
                { type: 'line', x0: xRange[0], x1: xRange[1], y0: zeroT, y1: zeroT, line: { color: '#ddd', width: 0.75 } },
                { type: 'line', x0: costThreshT, x1: costThreshT, y0: yRange[0], y1: yRange[1], line: { color: '#C15F3C', width: 1.5, dash: 'dash' } },
                { type: 'line', x0: xRange[0], x1: xRange[1], y0: effortThreshT, y1: effortThreshT, line: { color: '#5c5648', width: 1.5, dash: 'dash' } },
              ],
              annotations: [
                { x: costThreshT, y: yRange[1], text: 'Cost High +20%', showarrow: false, font: { size: 10, color: '#C15F3C' }, yshift: 12 },
                { x: xRange[1], y: effortThreshT, text: 'Effort High −20%', showarrow: false, font: { size: 10, color: '#5c5648' }, xanchor: 'right', yshift: 10 },
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
