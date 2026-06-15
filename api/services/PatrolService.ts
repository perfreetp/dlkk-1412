import { PatrolTask } from '../../shared/types';
import { memoryStore } from '../stores/MemoryStore';
import { WebSocketServer } from '../ws/WebSocketServer';

function generateId(): string {
  return `patrol-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export class PatrolService {
  static getAll(): PatrolTask[] {
    return memoryStore.getPatrols();
  }

  static create(scheduledTime: number, area: string): PatrolTask {
    const patrol: PatrolTask = {
      id: generateId(),
      scheduledTime,
      area,
      status: 'pending'
    };
    const created = memoryStore.addPatrol(patrol);
    WebSocketServer.broadcast({ type: 'PATROL_CREATED', data: created });
    return created;
  }

  static complete(id: string, completedBy: string, remark?: string): PatrolTask | undefined {
    const updated = memoryStore.updatePatrol(id, {
      status: 'completed',
      completedAt: Date.now(),
      completedBy,
      remark
    });
    if (updated) {
      WebSocketServer.broadcast({ type: 'PATROL_UPDATED', data: updated });
    }
    return updated;
  }

  static skip(id: string, remark?: string): PatrolTask | undefined {
    const updated = memoryStore.updatePatrol(id, {
      status: 'skipped',
      completedAt: Date.now(),
      remark
    });
    if (updated) {
      WebSocketServer.broadcast({ type: 'PATROL_UPDATED', data: updated });
    }
    return updated;
  }

  static checkDue(): PatrolTask[] {
    const now = Date.now();
    const due = memoryStore.getPatrols().filter(
      p => p.status === 'pending' && p.scheduledTime <= now && p.scheduledTime > now - 60 * 1000
    );
    due.forEach(p => {
      WebSocketServer.broadcast({ type: 'PATROL_DUE', data: p });
    });
    return due;
  }
}
