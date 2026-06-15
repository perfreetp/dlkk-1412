import { create } from 'zustand';
import { CallRecord, CallType, CALL_PRIORITY_ORDER } from '../types';

interface CallStore {
  calls: CallRecord[];
  lastCallId: string | null;
  completedReceipt: CallRecord | null;
  setCalls: (calls: CallRecord[]) => void;
  addCall: (call: CallRecord) => void;
  updateCall: (call: CallRecord) => void;
  setCompletedReceipt: (call: CallRecord | null) => void;
  fetchCalls: () => Promise<void>;
  createCall: (seatId: string, type: CallType, abnormalType?: string) => Promise<CallRecord | null>;
  acceptCall: (id: string, nurseName: string) => Promise<void>;
  completeCall: (id: string, remark?: string) => Promise<void>;
  cancelCall: (id: string) => Promise<void>;
  getSortedCalls: () => CallRecord[];
  getActiveCallsBySeat: (seatId: string) => CallRecord[];
}

export const useCallStore = create<CallStore>((set, get) => ({
  calls: [],
  lastCallId: null,
  completedReceipt: null,
  setCalls: (calls) => set({ calls }),
  addCall: (call) => set((state) => ({ calls: [...state.calls, call], lastCallId: call.id })),
  updateCall: (call) => set((state) => ({
    calls: state.calls.map((c) => (c.id === call.id ? call : c))
  })),
  setCompletedReceipt: (call) => set({ completedReceipt: call }),
  fetchCalls: async () => {
    try {
      const res = await fetch('/api/calls');
      const data = await res.json();
      if (data.success) {
        set({ calls: data.data });
      }
    } catch (e) {
      console.error('Fetch calls failed:', e);
    }
  },
  createCall: async (seatId, type, abnormalType) => {
    try {
      const res = await fetch('/api/calls', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ seatId, type, abnormalType })
      });
      const data = await res.json();
      if (data.success) {
        get().addCall(data.data);
        return data.data;
      }
    } catch (e) {
      console.error('Create call failed:', e);
    }
    return null;
  },
  acceptCall: async (id, nurseName) => {
    try {
      const res = await fetch(`/api/calls/${id}/accept`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nurseName })
      });
      const data = await res.json();
      if (data.success) {
        get().updateCall(data.data);
      }
    } catch (e) {
      console.error('Accept call failed:', e);
    }
  },
  completeCall: async (id, remark) => {
    try {
      const res = await fetch(`/api/calls/${id}/complete`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ remark })
      });
      const data = await res.json();
      if (data.success) {
        get().updateCall(data.data);
        set({ completedReceipt: data.data });
        setTimeout(() => set({ completedReceipt: null }), 3000);
      }
    } catch (e) {
      console.error('Complete call failed:', e);
    }
  },
  cancelCall: async (id) => {
    try {
      const res = await fetch(`/api/calls/${id}/cancel`, { method: 'PUT' });
      const data = await res.json();
      if (data.success) {
        get().updateCall(data.data);
      }
    } catch (e) {
      console.error('Cancel call failed:', e);
    }
  },
  getSortedCalls: () => {
    const active = get().calls.filter((c) => c.status === 'pending' || c.status === 'accepted');
    return active.sort((a, b) => {
      const pa = CALL_PRIORITY_ORDER[a.priority];
      const pb = CALL_PRIORITY_ORDER[b.priority];
      if (pa !== pb) return pa - pb;
      return a.createdAt - b.createdAt;
    });
  },
  getActiveCallsBySeat: (seatId) => {
    return get().calls.filter(
      (c) => c.seatId === seatId && (c.status === 'pending' || c.status === 'accepted')
    );
  }
}));
