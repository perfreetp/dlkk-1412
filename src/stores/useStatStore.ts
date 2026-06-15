import { create } from 'zustand';
import { Statistics, ServiceRecord, CallType } from '../types';

interface StatStore {
  statistics: Statistics | null;
  records: ServiceRecord[];
  setStatistics: (stats: Statistics) => void;
  setRecords: (records: ServiceRecord[]) => void;
  fetchStatistics: () => Promise<void>;
  fetchRecords: (filters?: { dateFrom?: string; dateTo?: string; type?: string }) => Promise<void>;
}

export const useStatStore = create<StatStore>((set) => ({
  statistics: null,
  records: [],
  setStatistics: (statistics) => set({ statistics }),
  setRecords: (records) => set({ records }),
  fetchStatistics: async () => {
    try {
      const res = await fetch('/api/statistics');
      const data = await res.json();
      if (data.success) {
        set({ statistics: data.data });
      }
    } catch (e) {
      console.error('Fetch statistics failed:', e);
    }
  },
  fetchRecords: async (filters) => {
    try {
      const params = new URLSearchParams();
      if (filters?.dateFrom) params.set('dateFrom', filters.dateFrom);
      if (filters?.dateTo) params.set('dateTo', filters.dateTo);
      if (filters?.type) params.set('type', filters.type as string);
      const query = params.toString() ? `?${params.toString()}` : '';
      const res = await fetch(`/api/statistics/records${query}`);
      const data = await res.json();
      if (data.success) {
        set({ records: data.data });
      }
    } catch (e) {
      console.error('Fetch records failed:', e);
    }
  }
}));
