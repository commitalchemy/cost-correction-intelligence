/**
 * Six-way cost/effort classification. Computed ONLY in src/lib/quadrant.ts
 * from puucDeviation / errDeviation — never read off a pasted spreadsheet column.
 */
export type Classification =
  | 'cost-only'
  | 'effort-only'
  | 'both-high'
  | 'healthy'
  | 'no-utility'
  | 'undetermined';

/** Raw utility-count composition inputs, straight from the source columns. */
export interface UtilityComposition {
  users: number;
  forms: number;
  widgets: number;
  lp: number;
  automations: number;
  niaa: number;
  waba: number;
  leads: number;
  applications: number;
  evaluators: number;
  aiGuide: number;
  aiVoice: number;
}

export interface ScaleMetrics {
  mysqlGB: number | null;
  mongoGB: number | null;
  s3GB: number | null;
  totalStorageGB: number | null;
}

/**
 * A single canonicalized institution row, holding only RAW normalized source
 * fields. All derived business metrics (utilityCount, puuc, deviations, ERR,
 * classification) are attached afterward by src/lib/benchmark.ts and
 * src/lib/quadrant.ts — never computed inline in components.
 */
export interface RawRow {
  id: number;
  name: string;
  verticalKey: string;
  vertical: string;

  composition: UtilityComposition;
  coreInvoicingFY26: number | null;

  ticketCount: number | null;
  avgResolutionTimeHours: number | null;
  annualTicketEfforts: number | null;

  scale: ScaleMetrics;
}

/** A row after benchmark.ts has attached derived cost/effort metrics. */
export interface Row extends RawRow {
  utilityCount: number | null;
  puuc: number | null;
  puucMedian: number | null;
  puucDeviation: number | null;

  err: number | null;
  errMedian: number | null;
  errDeviation: number | null;

  classification: Classification;
}

export interface ScoredRow extends Row {
  score: number;
}

export type DeviationBand =
  | 'All'
  | 'below-50'
  | '-50-0'
  | '0-20'
  | '20-50'
  | '50-100'
  | 'above-100'
  | 'invalid';

export interface FilterState {
  vertical: string;
  classification: 'All' | Classification;
  band: DeviationBand;
  minPriority: number;
  search: string;
}
