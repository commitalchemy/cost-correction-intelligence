import { useFilterStore } from '../../state/filterStore';
import { useCorrectionMap } from '../../state/useCorrectionMap';
import { money, pct, costPerTicket, financialExposure } from '../../lib/metrics';
import { computeCorrection, CORRECTION_UTILITY_FLOOR } from '../../lib/correction';
import { CLASSIFICATION_DESC, CLASSIFICATION_LABEL } from '../../lib/quadrant';

export default function DrawerPanel() {
  const row = useFilterStore((s) => s.selectedRow);
  const close = useFilterStore((s) => s.closeDrawer);
  const stableMedianByVertical = useCorrectionMap();

  if (!row) return null;

  const correction = computeCorrection(row, stableMedianByVertical);

  const cpt = costPerTicket(row);
  const comp = row.composition;
  const scale = row.scale;

  let interpretation = CLASSIFICATION_DESC[row.classification];
  if (row.puucDeviation != null) {
    interpretation += ` PUUC sits at ${pct(row.puucDeviation)} vs its vertical median.`;
  }
  if (row.errDeviation != null) {
    interpretation += ` ERR sits at ${pct(row.errDeviation)} vs its vertical median.`;
  }

  return (
    <div className="drawer open" onClick={(e) => e.target === e.currentTarget && close()}>
      <div className="drawer-card">
        <button className="close" onClick={close}>
          ×
        </button>
        <div className="eyebrow">Institution drilldown</div>
        <h2>{row.name}</h2>
        <div className="meta">{row.vertical}</div>

        <div className="subhead">Cost metrics (recalculated)</div>
        {[
          ['Utility Count', row.utilityCount == null ? '—' : row.utilityCount.toLocaleString(undefined, { maximumFractionDigits: 1 })],
          ['Core Invoicing FY26', money(row.coreInvoicingFY26)],
          ['PUUC', money(row.puuc)],
          ['Vertical PUUC median', money(row.puucMedian)],
          ['PUUC deviation', row.puucDeviation == null ? '—' : pct(row.puucDeviation)],
          ['₹ exposure above benchmark', money(financialExposure(row))],
          ['Cost per ticket', cpt == null ? '—' : money(cpt)],
        ].map(([label, value]) => (
          <div className="metric" key={label as string}>
            <span>{label}</span>
            <b>{String(value)}</b>
          </div>
        ))}

        <div className="subhead">Effort metrics (recalculated)</div>
        {[
          ['Ticket Count', row.ticketCount == null ? '—' : row.ticketCount.toLocaleString()],
          ['Avg Resolution Time (hrs)', row.avgResolutionTimeHours == null ? '—' : row.avgResolutionTimeHours.toLocaleString()],
          ['Annual Ticket Efforts', row.annualTicketEfforts == null ? '—' : row.annualTicketEfforts.toLocaleString()],
          ['ERR', row.err == null ? '—' : row.err.toFixed(4)],
          ['Vertical ERR median', row.errMedian == null ? '—' : row.errMedian.toFixed(4)],
          ['ERR deviation', row.errDeviation == null ? '—' : pct(row.errDeviation)],
        ].map(([label, value]) => (
          <div className="metric" key={label as string}>
            <span>{label}</span>
            <b>{String(value)}</b>
          </div>
        ))}

        <div className="subhead">Total Correction Opportunity (vs. benchmark)</div>
        {[
          ['Eligible for benchmark', row.utilityCount != null && row.utilityCount >= CORRECTION_UTILITY_FLOOR ? 'Yes' : `No — Utility Count below ${CORRECTION_UTILITY_FLOOR}`, undefined],
          ['Vertical benchmark', correction.hasBenchmark ? 'Valid (3+ comparable peers)' : 'Insufficient Peer Benchmark', undefined],
          ['Ideal Commercial Value', money(correction.ideal), undefined],
          ['Actual Collections (Core Invoicing)', money(row.coreInvoicingFY26), undefined],
          ['Revenue Gap (₹)', money(correction.gap), undefined],
          [
            'Correction Opportunity %',
            correction.pctOfIdeal == null ? '—' : `${correction.pctOfIdeal.toFixed(1)}%`,
            "Share of this institution's ideal commercial value (Utility Count × vertical benchmark PUUC) that is currently uncollected. Higher % = larger gap between actual and benchmark-implied collections.",
          ],
        ].map(([label, value, tip]) => (
          <div className="metric" key={label as string}>
            <span title={tip as string | undefined} style={tip ? { cursor: 'help', textDecoration: 'underline dotted' } : undefined}>
              {label}
            </span>
            <b>{String(value)}</b>
          </div>
        ))}

        <div className="subhead">Classification &amp; priority</div>
        {[
          ['Classification', CLASSIFICATION_LABEL[row.classification]],
          ['Priority score', Math.round(row.score * 100) + '/100'],
        ].map(([label, value]) => (
          <div className="metric" key={label as string}>
            <span>{label}</span>
            <b>{String(value)}</b>
          </div>
        ))}

        <div className="subhead">Utility Count composition</div>
        <div className="comp-grid">
          {[
            ['Users', comp.users],
            ['Forms', comp.forms],
            ['Widgets', comp.widgets],
            ['LP', comp.lp],
            ['Automations', comp.automations],
            ['NIAA', comp.niaa],
            ['WABA', comp.waba],
            ['Leads', comp.leads],
            ['Applications', comp.applications],
            ['Evaluators', comp.evaluators],
            ['AI Guide', comp.aiGuide],
            ['AI Voice', comp.aiVoice],
          ].map(([label, value]) => (
            <div className="comp-row" key={label as string}>
              <span>{label}</span>
              <b>{(value as number).toLocaleString(undefined, { maximumFractionDigits: 2 })}</b>
            </div>
          ))}
        </div>

        <div className="subhead">Operational scale</div>
        <div className="comp-grid">
          {[
            ['MySQL (GB)', scale.mysqlGB],
            ['Mongo (GB)', scale.mongoGB],
            ['S3 (GB)', scale.s3GB],
            ['Total Storage (GB)', scale.totalStorageGB],
          ].map(([label, value]) => (
            <div className="comp-row" key={label as string}>
              <span>{label}</span>
              <b>{value == null ? '—' : (value as number).toLocaleString()}</b>
            </div>
          ))}
        </div>

        <div className="interpretation">
          <b>Interpretation</b>
          <p>{interpretation}</p>
        </div>
      </div>
    </div>
  );
}
