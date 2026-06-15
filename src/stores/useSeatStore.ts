import { create } from 'zustand';
import { Seat } from '../types';

interface SeatStore {
  seats: Seat[];
  selectedSeatId: string | null;
  setSeats: (seats: Seat[]) => void;
  updateSeat: (seat: Seat) => void;
  setSelectedSeat: (id: string | null) => void;
  fetchSeats: () => Promise<void>;
  togglePause: (id: string) => Promise<void>;
  startInfusion: (id: string, patientName: string, duration: number) => Promise<void>;
  endInfusion: (id: string) => Promise<void>;
}

export const useSeatStore = create<SeatStore>((set, get) => ({
  seats: [],
  selectedSeatId: null,
  setSeats: (seats) => set({ seats }),
  updateSeat: (seat) => set((state) => ({
    seats: state.seats.map((s) => (s.id === seat.id ? seat : s))
  })),
  setSelectedSeat: (id) => set({ selectedSeatId: id }),
  fetchSeats: async () => {
    try {
      const res = await fetch('/api/seats');
      const data = await res.json();
      if (data.success) {
        set({ seats: data.data });
      }
    } catch (e) {
      console.error('Fetch seats failed:', e);
    }
  },
  togglePause: async (id) => {
    try {
      const res = await fetch(`/api/seats/${id}/pause`, { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        get().updateSeat(data.data);
      }
    } catch (e) {
      console.error('Toggle pause failed:', e);
    }
  },
  startInfusion: async (id, patientName, duration) => {
    try {
      const res = await fetch(`/api/seats/${id}/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ patientName, duration })
      });
      const data = await res.json();
      if (data.success) {
        get().updateSeat(data.data);
      }
    } catch (e) {
      console.error('Start infusion failed:', e);
    }
  },
  endInfusion: async (id) => {
    try {
      const res = await fetch(`/api/seats/${id}/end`, { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        get().updateSeat(data.data);
      }
    } catch (e) {
      console.error('End infusion failed:', e);
    }
  }
}));
