import { create } from 'zustand';
import type { Row, ScoredRow, FilterState, DeviationBand, Classification } from '../types';

export type AccountPanelCategory = Classification | 'total' | 'expensive-to-serve';

interface AccountPanelState {
  category: AccountPanelCategory;
  title: string;
}

interface FilterStore extends FilterState {
  rows: Row[];
  loaded: boolean;
  loadError: string | null;
  selectedRow: ScoredRow | null;
  accountPanel: AccountPanelState | null;
  lastFile: File | null;
  setRows: (rows: Row[]) => void;
  setLoadError: (msg: string | null) => void;
  setVertical: (v: string) => void;
  setClassification: (v: 'All' | Classification) => void;
  setBand: (v: DeviationBand) => void;
  setMinPriority: (v: number) => void;
  setSearch: (v: string) => void;
  clearAll: () => void;
  openDrawer: (row: ScoredRow) => void;
  closeDrawer: () => void;
  openAccountPanel: (panel: AccountPanelState) => void;
  closeAccountPanel: () => void;
  setLastFile: (file: File | null) => void;
}

const DEFAULTS: FilterState = {
  vertical: 'All',
  classification: 'All',
  band: 'All',
  minPriority: 0,
  search: '',
};

export const useFilterStore = create<FilterStore>((set) => ({
  ...DEFAULTS,
  rows: [],
  loaded: false,
  loadError: null,
  selectedRow: null,
  accountPanel: null,
  lastFile: null,
  setRows: (rows) => set({ rows, loaded: true, loadError: null, ...DEFAULTS }),
  setLoadError: (loadError) => set({ loadError }),
  setVertical: (vertical) => set({ vertical }),
  setClassification: (classification) => set({ classification }),
  setBand: (band) => set({ band }),
  setMinPriority: (minPriority) => set({ minPriority }),
  setSearch: (search) => set({ search }),
  clearAll: () => set({ ...DEFAULTS }),
  openDrawer: (selectedRow) => set({ selectedRow }),
  closeDrawer: () => set({ selectedRow: null }),
  openAccountPanel: (accountPanel) => set({ accountPanel }),
  closeAccountPanel: () => set({ accountPanel: null }),
  setLastFile: (lastFile) => set({ lastFile }),
}));
