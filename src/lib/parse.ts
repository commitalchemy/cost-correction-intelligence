import * as XLSX from 'xlsx';
import type { RawRecord } from './canonicalize';

export async function parseFile(file: File): Promise<RawRecord[]> {
  const buf = await file.arrayBuffer();
  const wb = XLSX.read(buf, { type: 'array', cellDates: false });
  const first = wb.SheetNames[0];
  return XLSX.utils.sheet_to_json<RawRecord>(wb.Sheets[first], { defval: '' });
}
