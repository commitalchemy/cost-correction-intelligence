export default function DefinitionPanel() {
  return (
    <section className="panel journey">
      <span className="eyebrow">Benchmark Journey</span>
      <h2>How is &lsquo;above benchmark&rsquo; determined?</h2>
      <div className="journey-caption">
        Every institution's cost position is recalculated from raw usage data through this chain, then compared to its
        vertical's own benchmark.
      </div>
      <div className="def-chain">
        <span className="def-step">Utility Count</span>
        <span className="def-arrow">→</span>
        <span className="def-step">Net FY Core Collections</span>
        <span className="def-arrow">→</span>
        <span className="def-step def-highlight">Cost per Utility Unit (PUUC)</span>
        <span className="def-arrow">→</span>
        <span className="def-step">Vertical Benchmark</span>
        <span className="def-arrow">→</span>
        <span className="def-step">Cost Classification</span>
      </div>
    </section>
  );
}
