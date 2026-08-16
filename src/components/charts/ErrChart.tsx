import Plot from '../../lib/plotly';
import { useFilteredRows } from '../../state/useFilteredRows';
import { useFilterStore } from '../../state/filterStore';
import { COLORS } from '../../lib/canonicalize';
import { CLASSIFICATION_LABEL } from '../../lib/quadrant';
import type { Classification } from '../../types';

const ORDER: Classification[] = ['both-high', 'cost-only', 'effort-only', 'healthy', 'undetermined', 'no-utility'];

const layout = (extra: Record<string, any> = {}) => ({
  margin: { l: 48, r: 18, t: 16, b: 52 },
  font: { family: 'Inter,system-ui,sans-serif', size: 11, color: '#5c5648' },
  paper_bgcolor: 'rgba(0,0,0,0)',
  plot_bgcolor: 'rgba(0,0,0,0)',
  hoverlabel: { font: { size: 12 } },
  ...extra,
});

export default function ErrChart() {
  const rows = useFilteredRows();
  const classification = useFilterStore((s) => s.classification);
  const setClassification = useFilterStore((s) => s.setClassification);

  const byVertical: Record<string, typeof rows> = {};
  rows.forEach((r) => {
    (byVertical[r.vertical] ??= []).push(r);
  });
  const verticals = Object.entries(byVertical)
    .map(([v, list]) => ({ v, list }))
    .sort((a, b) => b.list.length - a.list.length)
    .slice(0, 20);

  const present = ORDER.filter((c) => rows.some((r) => r.classification === c));

  const traces = present.map((c, i) => ({
    x: verticals.map((x) => x.v),
    y: verticals.map((x) => x.list.filter((r) => r.classification === c).length),
    name: CLASSIFICATION_LABEL[c],
    type: 'bar' as const,
    marker: { color: COLORS[i % COLORS.length], opacity: classification === 'All' || classification === c ? 1 : 0.25 },
  }));

  return (
    <section className="panel">
      <h2>Classification by Vertical</h2>
      <div className="desc">Click a legend entry to filter by classification.</div>
      <div className="chart small">
        <Plot
          data={traces as any}
          layout={layout({
            barmode: 'stack',
            xaxis: { tickangle: -25 },
            yaxis: { title: 'Institutions', gridcolor: '#EFE9DC' },
            legend: { orientation: 'h', y: 1.22, font: { size: 10 } },
          })}
          config={{ responsive: true, displaylogo: false }}
          style={{ width: '100%', height: '100%' }}
          onClick={(d: any) => {
            const name = d.points?.[0]?.data?.name;
            if (!name) return;
            const match = present.find((c) => CLASSIFICATION_LABEL[c] === name);
            if (!match) return;
            setClassification(classification === match ? 'All' : match);
          }}
          useResizeHandler
        />
      </div>
    </section>
  );
}
