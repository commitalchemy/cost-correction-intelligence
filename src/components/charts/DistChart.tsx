import Plot from '../../lib/plotly';
import { useFilteredRows } from '../../state/useFilteredRows';
import { useFilterStore } from '../../state/filterStore';
import { bucket } from '../../lib/metrics';
import type { DeviationBand } from '../../types';

const BUCKET_KEYS: DeviationBand[] = ['below-50', '-50-0', '0-20', '20-50', '50-100', 'above-100'];
const LABELS = ['< -50%', '-50% to 0%', '0% to 20%', '20% to 50%', '50% to 100%', '> 100%'];

const layout = (extra: Record<string, any> = {}) => ({
  margin: { l: 48, r: 18, t: 16, b: 46 },
  font: { family: 'Inter,system-ui,sans-serif', size: 11, color: '#5c5648' },
  paper_bgcolor: 'rgba(0,0,0,0)',
  plot_bgcolor: 'rgba(0,0,0,0)',
  hoverlabel: { font: { size: 12 } },
  ...extra,
});

export default function DistChart() {
  const rows = useFilteredRows();
  const band = useFilterStore((s) => s.band);
  const setBand = useFilterStore((s) => s.setBand);
  const values = BUCKET_KEYS.map((k) => rows.filter((r) => bucket(r.puucDeviation) === k).length);

  return (
    <section className="panel">
      <h2>PUUC Deviation Distribution</h2>
      <div className="desc">Click a bar to filter by deviation band. The 20% line marks the cost-high threshold.</div>
      <div className="chart">
        <Plot
          data={[
            {
              x: LABELS,
              y: values,
              type: 'bar',
              marker: { color: BUCKET_KEYS.map((k) => (band === 'All' || band === k ? '#C15F3C' : '#EBD9CD')) },
              text: values.map(String),
              textposition: 'auto',
              hovertemplate: '%{x}<br>%{y} institutions<extra></extra>',
            } as any,
          ]}
          layout={layout({ showlegend: false, xaxis: { tickangle: -18 }, yaxis: { title: 'Institutions', gridcolor: '#EFE9DC' } })}
          config={{ responsive: true, displaylogo: false }}
          style={{ width: '100%', height: '100%' }}
          onClick={(d: any) => {
            const idx = d.points?.[0]?.pointIndex;
            if (idx == null) return;
            const key = BUCKET_KEYS[idx];
            setBand(band === key ? 'All' : key);
          }}
          useResizeHandler
        />
      </div>
    </section>
  );
}
