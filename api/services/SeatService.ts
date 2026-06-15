import { Seat } from '../../shared/types';
import { memoryStore } from '../stores/MemoryStore';
import { WebSocketServer } from '../ws/WebSocketServer';

export class SeatService {
  static getAllSeats(): Seat[] {
    return memoryStore.getSeats();
  }

  static getSeat(id: string): Seat | undefined {
    return memoryStore.getSeatById(id);
  }

  static updateSeat(id: string, data: Partial<Seat>): Seat | undefined {
    const updated = memoryStore.updateSeat(id, data);
    if (updated) {
      WebSocketServer.broadcast({ type: 'SEAT_UPDATED', data: updated });
    }
    return updated;
  }

  static togglePause(id: string): Seat | undefined {
    const seat = memoryStore.getSeatById(id);
    if (!seat) return undefined;
    const updated = memoryStore.updateSeat(id, { isPaused: !seat.isPaused });
    if (updated) {
      WebSocketServer.broadcast({ type: 'SEAT_UPDATED', data: updated });
    }
    return updated;
  }

  static startInfusion(id: string, patientName: string, duration: number): Seat | undefined {
    const now = Date.now();
    const updated = memoryStore.updateSeat(id, {
      patientName,
      infusionStartTime: now,
      infusionDuration: duration,
      status: 'infusing'
    });
    if (updated) {
      WebSocketServer.broadcast({ type: 'SEAT_UPDATED', data: updated });
    }
    return updated;
  }

  static endInfusion(id: string): Seat | undefined {
    const updated = memoryStore.updateSeat(id, {
      patientName: undefined,
      infusionStartTime: undefined,
      infusionDuration: undefined,
      status: 'idle',
      currentCallId: undefined
    });
    if (updated) {
      WebSocketServer.broadcast({ type: 'SEAT_UPDATED', data: updated });
    }
    return updated;
  }
}
