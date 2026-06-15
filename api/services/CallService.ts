import { CallRecord, CallType, CallStatus, Seat, CALL_TYPE_PRIORITY, DEFAULT_TIMEOUT_THRESHOLDS, ServiceRecord } from '../../shared/types';
import { memoryStore } from '../stores/MemoryStore';
import { WebSocketServer } from '../ws/WebSocketServer';

function generateId(): string {
  return `call-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export class CallService {
  static createCall(seatId: string, type: CallType, abnormalType?: string): CallRecord | null {
    const seat = memoryStore.getSeatById(seatId);
    if (!seat) return null;

    if (seat.currentCallId) {
      const existing = memoryStore.getCallById(seat.currentCallId);
      if (existing && existing.status !== 'completed' && existing.status !== 'cancelled') {
        return existing;
      }
    }

    const priority = CALL_TYPE_PRIORITY[type];
    const timeoutAt = Date.now() + DEFAULT_TIMEOUT_THRESHOLDS[priority];

    const call: CallRecord = {
      id: generateId(),
      seatId,
      seatNumber: seat.number,
      type,
      priority,
      status: 'pending',
      patientName: seat.patientName,
      createdAt: Date.now(),
      timeoutAt,
      abnormalType
    };

    const newCall = memoryStore.addCall(call);
    const seatStatus: Seat['status'] = type === 'abnormal' ? 'abnormal' : 'calling';
    memoryStore.updateSeat(seatId, { status: seatStatus, currentCallId: call.id });

    this.tryMergeCalls(newCall);
    WebSocketServer.broadcast({ type: 'CALL_CREATED', data: newCall });
    WebSocketServer.broadcast({ type: 'SEAT_UPDATED', data: memoryStore.getSeatById(seatId) });

    return newCall;
  }

  private static tryMergeCalls(newCall: CallRecord) {
    if (newCall.priority === 'urgent') return;

    const pendingCalls = memoryStore.getCalls({ status: 'pending' }).filter(
      c => c.id !== newCall.id && c.type === newCall.type && c.priority === newCall.priority
    );

    const newSeat = memoryStore.getSeatById(newCall.seatId);
    if (!newSeat) return;

    const timeWindow = 5 * 60 * 1000;
    const nearbyCalls = pendingCalls.filter(c => {
      if (Math.abs(c.createdAt - newCall.createdAt) > timeWindow) return false;
      const seat = memoryStore.getSeatById(c.seatId);
      if (!seat) return false;
      const rowDiff = Math.abs(seat.row - newSeat.row);
      const colDiff = Math.abs(seat.col - newSeat.col);
      return rowDiff <= 1 && colDiff <= 2;
    });

    if (nearbyCalls.length > 0) {
      const mainCall = nearbyCalls[0];
      const mergedIds = [...(mainCall.mergedIds || []), newCall.id];
      memoryStore.updateCall(mainCall.id, { mergedIds });
      memoryStore.updateCall(newCall.id, { status: 'cancelled' });
    }
  }

  static acceptCall(callId: string, nurseName: string): CallRecord | null {
    const call = memoryStore.getCallById(callId);
    if (!call || call.status !== 'pending') return null;

    const updated = memoryStore.updateCall(callId, {
      status: 'accepted',
      acceptedAt: Date.now(),
      acceptedBy: nurseName
    });

    memoryStore.updateSeat(call.seatId, { status: 'processing' });

    if (updated?.mergedIds) {
      updated.mergedIds.forEach(id => {
        const subCall = memoryStore.getCallById(id);
        if (subCall) {
          memoryStore.updateCall(id, { status: 'accepted', acceptedAt: Date.now(), acceptedBy: nurseName });
          memoryStore.updateSeat(subCall.seatId, { status: 'processing' });
        }
      });
    }

    WebSocketServer.broadcast({ type: 'CALL_UPDATED', data: updated });
    WebSocketServer.broadcast({ type: 'SEAT_UPDATED', data: memoryStore.getSeatById(call.seatId) });

    return updated;
  }

  static completeCall(callId: string, remark?: string): CallRecord | null {
    const call = memoryStore.getCallById(callId);
    if (!call || (call.status !== 'accepted' && call.status !== 'processing')) return null;

    const now = Date.now();
    const updated = memoryStore.updateCall(callId, {
      status: 'completed',
      completedAt: now,
      remark
    });

    const seat = memoryStore.getSeatById(call.seatId);
    if (seat) {
      const newStatus: Seat['status'] = seat.infusionStartTime ? 'infusing' : 'idle';
      memoryStore.updateSeat(call.seatId, { status: newStatus, currentCallId: undefined });
    }

    if (call.acceptedAt) {
      const responseTime = Math.floor((call.acceptedAt - call.createdAt) / 1000);
      const processTime = Math.floor((now - call.acceptedAt) / 1000);
      const date = new Date(now);

      memoryStore.addRecord({
        id: `record-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        callId: call.id,
        seatNumber: call.seatNumber,
        callType: call.type,
        responseTime,
        processTime,
        handledBy: call.acceptedBy,
        recordDate: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`,
        completedAt: now
      });
    }

    if (updated?.mergedIds) {
      updated.mergedIds.forEach(id => {
        const subCall = memoryStore.getCallById(id);
        if (subCall && subCall.acceptedAt) {
          memoryStore.updateCall(id, { status: 'completed', completedAt: now, remark });
          const subSeat = memoryStore.getSeatById(subCall.seatId);
          if (subSeat) {
            const subNewStatus: Seat['status'] = subSeat.infusionStartTime ? 'infusing' : 'idle';
            memoryStore.updateSeat(subCall.seatId, { status: subNewStatus, currentCallId: undefined });
          }
        }
      });
    }

    WebSocketServer.broadcast({ type: 'CALL_UPDATED', data: updated });
    WebSocketServer.broadcast({ type: 'SEAT_UPDATED', data: memoryStore.getSeatById(call.seatId) });
    WebSocketServer.broadcast({ type: 'CALL_COMPLETED', data: updated });

    return updated;
  }

  static cancelCall(callId: string): CallRecord | null {
    const call = memoryStore.getCallById(callId);
    if (!call || call.status === 'completed') return null;

    const updated = memoryStore.updateCall(callId, { status: 'cancelled' });
    const seat = memoryStore.getSeatById(call.seatId);
    if (seat) {
      const newStatus: Seat['status'] = seat.infusionStartTime ? 'infusing' : 'idle';
      memoryStore.updateSeat(call.seatId, { status: newStatus, currentCallId: undefined });
    }

    WebSocketServer.broadcast({ type: 'CALL_UPDATED', data: updated });
    WebSocketServer.broadcast({ type: 'SEAT_UPDATED', data: memoryStore.getSeatById(call.seatId) });

    return updated;
  }

  static checkTimeouts() {
    const now = Date.now();
    const pendingCalls = memoryStore.getCalls({ status: 'pending' });

    pendingCalls.forEach(call => {
      if (call.timeoutAt && now > call.timeoutAt) {
        memoryStore.updateCall(call.id, { status: 'timeout' });
        WebSocketServer.broadcast({ type: 'CALL_TIMEOUT', data: call });
      }
    });
  }
}
