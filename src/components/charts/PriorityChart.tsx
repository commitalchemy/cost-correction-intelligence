import Plot from '../../lib/plotly';
import { useFilteredRows } from '../../state/useFilteredRows';
import { useFilterStore } from '../../state/filterStore';

const BANDS = [
  { lo: 0, hi: 20, label: '0–20' },
  { lo: 20, hi: 40, label: '20–40' },
  { lo: 40, hi: 60, label: '40–60' },
  { lo: 60, hi: 80, label: '60–80' },
  { lo: 80, hi: 101, label: '80–100' },
];

const layout = (extra: Record<string, any> = {}) => ({
  margin: { l: 48, r: 18, t: 16, b: 44 },
  font: { family: 'Inter,system-ui,sans-serif', size: 11, color: '#5c5648' },
  paper_bgcolor: 'rgba(0,0,0,0)',
  plot_bgcolor: 'rgba(0,0,0,0)',
  hoverlabel: { font: { size: 12 } },
  ...extra,
});

export default function PriorityChart() {
  const rows = useFilteredRows();
  const minPriority = useFilterStore((s) => s.minPriority);
  const setMinPriority = useFilterStore((s) => s.setMinPriority);

  const values = BANDS.map((b) => rows.filter((r) => r.score * 100 >= b.lo && r.score * 100 < b.hi).length);

  return (
    <section className="panel">
      <h2>Priority Score Distribution</h2>
      <div className="desc">Click a band to set the minimum priority filter.</div>
      <div className="chart small">
        <Plot
          data={[
            {
              x: BANDS.map((b) => b.label),
              y: values,
              type: 'bar',
              marker: {
                color: BANDS.map((b) => (minPriority <= b.lo ? '#A8402A' : '#F0D9D0')),
              },
              text: values.map(String),
              textposition: 'auto',
              hovertemplate: '%{x}<br>%{y} institutions<extra></extra>',
            } as any,
          ]}
          layout={layout({ showlegend: false, yaxis: { title: 'Institutions', gridcolor: '#EFE9DC' } })}
          config={{ responsive: true, displaylogo: false }}
          style={{ width: '100%', height: '100%' }}
          onClick={(d: any) => {
            const idx = d.points?.[0]?.pointIndex;
            if (idx == null) return;
            const band = BANDS[idx];
            setMinPriority(minPriority === band.lo ? 0 : band.lo);
          }}
          useResizeHandler
        />
      </div>
    </section>
  );
}
