import { create } from 'zustand';
import { PatrolTask } from '../types';

interface PatrolStore {
  patrols: PatrolTask[];
  duePatrolId: string | null;
  setPatrols: (patrols: PatrolTask[]) => void;
  updatePatrol: (patrol: PatrolTask) => void;
  addPatrol: (patrol: PatrolTask) => void;
  setDuePatrolId: (id: string | null) => void;
  fetchPatrols: () => Promise<void>;
  createPatrol: (scheduledTime: number, area: string) => Promise<void>;
  completePatrol: (id: string, completedBy: string, remark?: string) => Promise<void>;
  skipPatrol: (id: string, remark?: string) => Promise<void>;
}

export const usePatrolStore = create<PatrolStore>((set, get) => ({
  patrols: [],
  duePatrolId: null,
  setPatrols: (patrols) => set({ patrols }),
  updatePatrol: (patrol) => set((state) => ({
    patrols: state.patrols.map((p) => (p.id === patrol.id ? patrol : p))
  })),
  addPatrol: (patrol) => set((state) => ({ patrols: [...state.patrols, patrol] })),
  setDuePatrolId: (id) => set({ duePatrolId: id }),
  fetchPatrols: async () => {
    try {
      const res = await fetch('/api/patrols');
      const data = await res.json();
      if (data.success) {
        set({ patrols: data.data });
      }
    } catch (e) {
      console.error('Fetch patrols failed:', e);
    }
  },
  createPatrol: async (scheduledTime, area) => {
    try {
      const res = await fetch('/api/patrols', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scheduledTime, area })
      });
      const data = await res.json();
      if (data.success) {
        get().addPatrol(data.data);
      }
    } catch (e) {
      console.error('Create patrol failed:', e);
    }
  },
  completePatrol: async (id, completedBy, remark) => {
    try {
      const res = await fetch(`/api/patrols/${id}/complete`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ completedBy, remark })
      });
      const data = await res.json();
      if (data.success) {
        get().updatePatrol(data.data);
      }
    } catch (e) {
      console.error('Complete patrol failed:', e);
    }
  },
  skipPatrol: async (id, remark) => {
    try {
      const res = await fetch(`/api/patrols/${id}/skip`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ remark })
      });
      const data = await res.json();
      if (data.success) {
        get().updatePatrol(data.data);
      }
    } catch (e) {
      console.error('Skip patrol failed:', e);
    }
  }
}));
