import type { RawRow } from '../types';

export const COLORS = ['#22304D', '#C15F3C', '#8A8578', '#5C7290', '#B4863F', '#6B7A8F', '#9B6A3F', '#4A5568'];

export const CLASSIFICATION_ORDER = ['both-high', 'cost-only', 'effort-only', 'healthy', 'undetermined', 'no-utility'];

/**
 * Parses a raw cell value defensively into a finite number, or null.
 * Handles currency symbols, thousands separators, percent signs and blanks.
 * Never allows NaN/Infinity to leak out — those collapse to null.
 */
export function numberValue(value: unknown): number | null {
  if (value === null || value === undefined || value === '') return null;
  if (typeof value === 'number') return Number.isFinite(value) ? value : null;
  const s = String(value).trim().replace(/₹/g, '').replace(/,/g, '').replace(/\s/g, '');
  if (!s || s === '-') return null;
  const n = Number(s.replace(/%$/, ''));
  return Number.isFinite(n) ? n : null;
}

/** Same as numberValue but defaults missing/invalid values to 0 — used only for
 * the raw components that feed the Utility Count sum, per spec §1 ("handle
 * missing/non-numeric raw values defensively as zero where appropriate"). */
export function numberOrZero(value: unknown): number {
  const n = numberValue(value);
  return n == null ? 0 : n;
}

export function normalizeVertical(value: unknown): string {
  if (value === null || value === undefined || String(value).trim() === '') return 'Unclassified';
  return String(value).trim().replace(/\s+/g, ' ');
}

export function findColumn(headers: string[], aliases: string[]): string | null {
  const clean = (s: string) => String(s).trim().toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
  const normalized = new Map(headers.map((h) => [clean(h), h]));
  for (const alias of aliases) {
    const key = clean(alias);
    if (normalized.has(key)) return normalized.get(key)!;
  }
  for (const h of headers) {
    const key = clean(h);
    for (const alias of aliases) {
      const a = clean(alias);
      if (key.includes(a) || a.includes(key)) return h;
    }
  }
  return null;
}

export type RawRecord = Record<string, unknown>;

/**
 * Canonicalizes the uploaded spreadsheet into RawRow[] — RAW normalized
 * source fields only. This function intentionally does NOT read any
 * pre-calculated column (Utility Count, PUUC, Median, Deviation, Status,
 * ERR, etc.) from the sheet. All derived business metrics are computed
 * downstream in src/lib/benchmark.ts and src/lib/quadrant.ts, which is the
 * single source of truth for those calculations.
 */
export function canonicalize(rows: RawRecord[]): RawRow[] {
  if (!rows.length) throw new Error('The uploaded file contains no data rows.');
  const headers = Object.keys(rows[0] || {});

  const k = {
    name: findColumn(headers, ['Name', 'Institution', 'INSTITUTION', 'Institution Name']),
    vertical: findColumn(headers, ['VERTICAL', 'Vertical', 'Institution Vertical']),

    // Utility Count raw inputs
    users: findColumn(headers, ['Total User', 'Total Users', 'Users']),
    forms: findColumn(headers, ['Total Forms', 'Forms']),
    widgets: findColumn(headers, ['Total Widgets', 'Active Widgets', 'Widgets']),
    lp: findColumn(headers, ['Total LP', 'LP', 'Landing Pages']),
    automations: findColumn(headers, ['Active Automations', 'Automations']),
    niaa: findColumn(headers, ['NIAA Status', 'NIAA']),
    waba: findColumn(headers, ['WABA Status', 'WABA']),
    leads: findColumn(headers, ['Total Leads', 'Leads']),
    applications: findColumn(headers, ['Total Applications', 'Applications']),
    evaluators: findColumn(headers, ['Total Evaluators', 'Evaluators']),
    aiGuide: findColumn(headers, ['Mio AI Guide', 'AI Guide']),
    aiVoice: findColumn(headers, ['Mio AI Voice', 'AI Voice']),

    // PUUC numerator — Core Invoicing FY'26, NOT Core Collections
    coreInvoicing: findColumn(headers, ["Core Invoicing FY'26", 'Core Invoicing FY26', 'Core Invoicing']),

    // ERR raw inputs
    tickets: findColumn(headers, ['Ticket Count', 'Tickets']),
    avgResTime: findColumn(headers, ['Avg Resolution Time in Business Hours', 'Avg Resolution Time (Business Hours)', 'Average Resolution Time Business Hours']),
    annualTicketEfforts: findColumn(headers, ['Annual Ticket Efforts']),

    // Operational scale, for the drilldown only — not used in any calculation
    mysqlGB: findColumn(headers, ['MySQL (GB)', 'MySQL']),
    mongoGB: findColumn(headers, ['MongoDB (GB)', 'Mongo (GB)', 'Mongo']),
    s3GB: findColumn(headers, ['Amazon S3 (GB)', 'S3 (GB)', 'S3']),
    totalStorageGB: findColumn(headers, ['Total Size (GB)', 'Total Storage (GB)', 'Total Size']),
  };

  if (!k.vertical) {
    throw new Error('Required column not found: VERTICAL.\n\nFound columns:\n' + headers.join('\n'));
  }
  if (!k.coreInvoicing) {
    throw new Error("Required column not found: Core Invoicing FY'26.\n\nFound columns:\n" + headers.join('\n'));
  }

  const firstVerticalByKey = new Map<string, string>();
  const out: RawRow[] = rows.map((r, i) => {
    const vertical = normalizeVertical(r[k.vertical!]);
    const vk = vertical.toLowerCase();
    if (!firstVerticalByKey.has(vk)) firstVerticalByKey.set(vk, vertical);

    return {
      id: i,
      name: String(r[k.name!] ?? r.ID ?? `Institution ${i + 1}`).trim() || `Institution ${i + 1}`,
      verticalKey: vk,
      vertical,
      composition: {
        users: numberOrZero(k.users ? r[k.users] : null),
        forms: numberOrZero(k.forms ? r[k.forms] : null),
        widgets: numberOrZero(k.widgets ? r[k.widgets] : null),
        lp: numberOrZero(k.lp ? r[k.lp] : null),
        automations: numberOrZero(k.automations ? r[k.automations] : null),
        niaa: numberOrZero(k.niaa ? r[k.niaa] : null),
        waba: numberOrZero(k.waba ? r[k.waba] : null),
        leads: numberOrZero(k.leads ? r[k.leads] : null),
        applications: numberOrZero(k.applications ? r[k.applications] : null),
        evaluators: numberOrZero(k.evaluators ? r[k.evaluators] : null),
        aiGuide: numberOrZero(k.aiGuide ? r[k.aiGuide] : null),
        aiVoice: numberOrZero(k.aiVoice ? r[k.aiVoice] : null),
      },
      coreInvoicingFY26: numberValue(k.coreInvoicing ? r[k.coreInvoicing] : null),
      ticketCount: numberValue(k.tickets ? r[k.tickets] : null),
      avgResolutionTimeHours: numberValue(k.avgResTime ? r[k.avgResTime] : null),
      annualTicketEfforts: numberValue(k.annualTicketEfforts ? r[k.annualTicketEfforts] : null),
      scale: {
        mysqlGB: numberValue(k.mysqlGB ? r[k.mysqlGB] : null),
        mongoGB: numberValue(k.mongoGB ? r[k.mongoGB] : null),
        s3GB: numberValue(k.s3GB ? r[k.s3GB] : null),
        totalStorageGB: numberValue(k.totalStorageGB ? r[k.totalStorageGB] : null),
      },
    };
  });

  out.forEach((r) => (r.vertical = firstVerticalByKey.get(r.verticalKey) || r.vertical));
  return out;
}
