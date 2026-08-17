b/src/lib/symlog.ts
@@ -0,0 +1,60 @@
/**
 * Manual symlog transform for use on Plotly axes.
 *
 * Plotly has no native "symlog" axis type (only linear/log/date/category), so
 * values are pre-transformed here and plotted on a `linear` axis, with
 * tickvals/ticktext supplying real percentages at the correct transformed
 * positions. Linear near zero (|v| <= linthresh), logarithmic beyond it,
 * continuous at the boundary.
 */

/** Transforms a fraction (e.g. 0.2 = +20%) into symlog plotting space. */
export function symlog(value: number, linthresh = 1): number {
  const abs = Math.abs(value);
  if (abs <= linthresh) return value / linthresh;
  return Math.sign(value) * (1 + Math.log10(abs / linthresh));
}

export function symlogArray(values: number[], linthresh = 1): number[] {
  return values.map((v) => symlog(v, linthresh));
}

/** Compact tick label for a fraction, e.g. 0.2 -> "20%", 10 -> "1K%", 10000 -> "1M%". */
export function compactPercentLabel(fraction: number): string {
  const pct = fraction * 100;
 const abs = Math.abs(pct);
  const sign = pct < 0 ? '-' : '';
  if (abs >= 1_000_000) return `${sign}${Math.round(abs / 1_000_000)}M%`;
  if (abs >= 1_000) return `${sign}${Math.round(abs / 1_000)}K%`;
  return `${sign}${Math.round(abs)}%`;
}

export interface SymlogTicks {
  tickvals: number[];
  ticktext: string[];
}

/**
 * Builds tickvals/ticktext (in transformed space) for a symlog axis covering
 * the given fractional range. Always includes 0, and the given threshold if
 * provided, plus round-number ticks at each order of magnitude on both sides.
 */
export function symlogTicks(minFraction: number, maxFraction: number, linthresh = 1, threshold?: number): SymlogTicks {
  const candidates = new Set<number>([0, -1, -0.2, 0.2, 1]);
  if (threshold != null) candidates.add(threshold);

  let mag = linthresh * 10;
  while (mag <= maxFraction * 1.001) {
    candidates.add(mag);
    mag *= 10;
  }
  mag = -linthresh * 10;
  while (mag >= minFraction * 1.001) {
    candidates.add(mag);
    mag *= 10;
  }

  const values = Array.from(candidates)
    .filter((v) => v >= minFraction && v <= maxFraction)
    .sort((a, b) => a - b);

  return {
    tickvals: values.map((v) => symlog(v, linthresh)),
    ticktext: values.map((v) => (v === 0 ? '0%' : compactPercentLabel(v))),
  };
}
