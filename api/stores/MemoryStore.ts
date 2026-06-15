import { Seat, CallRecord, PatrolTask, ServiceRecord } from '../../shared/types';
import { generateMockSeats, generateMockCalls, generateMockPatrols, generateMockRecords } from '../utils/mockData';

class MemoryStore {
  private seats: Map<string, Seat> = new Map();
  private calls: Map<string, CallRecord> = new Map();
  private patrols: Map<string, PatrolTask> = new Map();
  private records: Map<string, ServiceRecord> = new Map();

  constructor() {
    this.initialize();
  }

  private initialize() {
    const mockSeats = generateMockSeats();
    mockSeats.forEach(seat => this.seats.set(seat.id, seat));

    const mockCalls = generateMockCalls(mockSeats);
    mockCalls.forEach(call => this.calls.set(call.id, call));

    const mockPatrols = generateMockPatrols();
    mockPatrols.forEach(patrol => this.patrols.set(patrol.id, patrol));

    const mockRecords = generateMockRecords();
    mockRecords.forEach(record => this.records.set(record.id, record));
  }

  getSeats(): Seat[] {
    return Array.from(this.seats.values());
  }

  getSeatById(id: string): Seat | undefined {
    return this.seats.get(id);
  }

  updateSeat(id: string, data: Partial<Seat>): Seat | undefined {
    const seat = this.seats.get(id);
    if (!seat) return undefined;
    const updated = { ...seat, ...data };
    this.seats.set(id, updated);
    return updated;
  }

  getCalls(filter?: { status?: string; type?: string }): CallRecord[] {
    let result = Array.from(this.calls.values());
    if (filter?.status) {
      result = result.filter(c => c.status === filter.status);
    }
    if (filter?.type) {
      result = result.filter(c => c.type === filter.type);
    }
    return result.sort((a, b) => a.createdAt - b.createdAt);
  }

  getCallById(id: string): CallRecord | undefined {
    return this.calls.get(id);
  }

  addCall(call: CallRecord): CallRecord {
    this.calls.set(call.id, call);
    return call;
  }

  updateCall(id: string, data: Partial<CallRecord>): CallRecord | undefined {
    const call = this.calls.get(id);
    if (!call) return undefined;
    const updated = { ...call, ...data };
    this.calls.set(id, updated);
    return updated;
  }

  getPatrols(): PatrolTask[] {
    return Array.from(this.patrols.values()).sort((a, b) => a.scheduledTime - b.scheduledTime);
  }

  addPatrol(patrol: PatrolTask): PatrolTask {
    this.patrols.set(patrol.id, patrol);
    return patrol;
  }

  updatePatrol(id: string, data: Partial<PatrolTask>): PatrolTask | undefined {
    const patrol = this.patrols.get(id);
    if (!patrol) return undefined;
    const updated = { ...patrol, ...data };
    this.patrols.set(id, updated);
    return updated;
  }

  getRecords(): ServiceRecord[] {
    return Array.from(this.records.values()).sort((a, b) => b.completedAt - a.completedAt);
  }

  addRecord(record: ServiceRecord): ServiceRecord {
    this.records.set(record.id, record);
    return record;
  }
}

export const memoryStore = new MemoryStore();
