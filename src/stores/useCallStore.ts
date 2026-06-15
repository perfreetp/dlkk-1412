import { create } from 'zustand';
import { CallRecord, CallType, CALL_PRIORITY_ORDER, CreateCallResult, CallPriority } from '../types';

interface CreateCallResultLocal extends CreateCallResult {
  message?: string;
}

interface CallStore {
  calls: CallRecord[];
  lastCallId: string | null;
  completedReceipt: CallRecord | null;
  setCalls: (calls: CallRecord[]) => void;
  addCall: (call: CallRecord) => void;
  updateCall: (call: CallRecord) => void;
  setCompletedReceipt: (call: CallRecord | null) => void;
  fetchCalls: () => Promise<void>;
  createCall: (seatId: string, type: CallType, abnormalType?: string) => Promise<CreateCallResultLocal>;
  acceptCall: (id: string, nurseName: string) => Promise<void>;
  completeCall: (id: string, remark?: string) => Promise<void>;
  cancelCall: (id: string) => Promise<void>;
  getSortedCalls: () => CallRecord[];
  getActiveCallsBySeat: (seatId: string) => CallRecord[];
  findMainCallForSeat: (seatId: string) => CallRecord | null;
  getQueuePosition: (callId: string) => number;
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
        if (data.data) {
          if (data.isMerged && data.mergedIntoCall) {
            get().updateCall({
              ...data.data,
              mergedIntoId: data.mergedIntoCall.id
            });
          } else {
            get().addCall(data.data);
          }
        }
        if (data.mergedIntoCall) get().updateCall(data.mergedIntoCall);

        return {
          call: data.data || null,
          isMerged: data.isMerged,
          mergedIntoCall: data.mergedIntoCall || null
        };
      }

      if (data.isPaused) {
        return { call: null, isPaused: true, message: data.message };
      }

      if (data.isDuplicate) {
        if (data.existingCall) {
          get().updateCall(data.existingCall);
        }
        return {
          call: data.existingCall || null,
          isDuplicate: true,
          duplicateType: data.duplicateType,
          message: data.message
        };
      }
    } catch (e) {
      console.error('Create call failed:', e);
    }
    return { call: null };
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
        setTimeout(() => set({ completedReceipt: null }), 3500);
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
    const mainCalls = get().calls.filter(
      (c) =>
        (c.status === 'pending' || c.status === 'accepted') &&
        !c.mergedIntoId
    );

    return mainCalls.sort((a, b) => {
      const aTimeout = a.isTimeout ? 1 : 0;
      const bTimeout = b.isTimeout ? 1 : 0;
      if (aTimeout !== bTimeout) return bTimeout - aTimeout;

      const pa = CALL_PRIORITY_ORDER[a.priority];
      const pb = CALL_PRIORITY_ORDER[b.priority];
      if (pa !== pb) return pa - pb;

      return a.createdAt - b.createdAt;
    });
  },
  getActiveCallsBySeat: (seatId) => {
    return get().calls.filter(
      (c) =>
        c.seatId === seatId &&
        (c.status === 'pending' || c.status === 'accepted')
    );
  },
  findMainCallForSeat: (seatId) => {
    const myCalls = get().calls.filter(
      (c) =>
        c.seatId === seatId &&
        (c.status === 'pending' || c.status === 'accepted')
    );
    if (myCalls.length === 0) return null;

    const ownMain = myCalls.find((c) => !c.mergedIntoId);
    if (ownMain) return ownMain;

    const mergedCall = myCalls.find((c) => c.mergedIntoId);
    if (mergedCall?.mergedIntoId) {
      return get().calls.find((c) => c.id === mergedCall.mergedIntoId) || null;
    }

    return myCalls[0];
  },
  getQueuePosition: (callId) => {
    const sorted = get().getSortedCalls();
    const idx = sorted.findIndex((c) => c.id === callId);
    return idx >= 0 ? idx + 1 : -1;
  }
}));
