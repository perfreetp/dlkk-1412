import { Statistics, ServiceRecord, CallType } from '../../shared/types';
import { memoryStore } from '../stores/MemoryStore';

export class StatService {
  static getStatistics(): Statistics {
    const records = memoryStore.getRecords();
    const now = new Date();
    const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

    const todayRecords = records.filter(r => r.recordDate === todayStr);
    const todayTotal = todayRecords.length;
    const todayCompleted = todayRecords.filter(r => r.responseTime > 0).length;

    const allResponseTimes = records.filter(r => r.responseTime > 0).map(r => r.responseTime);
    const allProcessTimes = records.filter(r => r.processTime > 0).map(r => r.processTime);

    const avgResponseTime = allResponseTimes.length > 0
      ? Math.round(allResponseTimes.reduce((a, b) => a + b, 0) / allResponseTimes.length)
      : 0;

    const avgProcessTime = allProcessTimes.length > 0
      ? Math.round(allProcessTimes.reduce((a, b) => a + b, 0) / allProcessTimes.length)
      : 0;

    const calls = memoryStore.getCalls();
    const timeoutCount = calls.filter(c => c.isTimeout).length;

    const hourCounts: Record<number, number> = {};
    records.forEach(r => {
      const date = new Date(r.completedAt);
      const hour = date.getHours();
      hourCounts[hour] = (hourCounts[hour] || 0) + 1;
    });

    const peakHours = Object.entries(hourCounts)
      .map(([hour, count]) => ({ hour: parseInt(hour), count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);

    const typeCounts: Record<string, number> = {};
    records.forEach(r => {
      typeCounts[r.callType] = (typeCounts[r.callType] || 0) + 1;
    });

    const typeDistribution = Object.entries(typeCounts)
      .map(([type, count]) => ({ type: type as CallType, count }))
      .sort((a, b) => b.count - a.count);

    return {
      todayTotal,
      todayCompleted,
      avgResponseTime,
      avgProcessTime,
      timeoutCount,
      peakHours,
      typeDistribution
    };
  }

  static getRecords(filters?: { dateFrom?: string; dateTo?: string; type?: string }): ServiceRecord[] {
    let records = memoryStore.getRecords();

    if (filters?.dateFrom) {
      const from = new Date(filters.dateFrom).getTime();
      records = records.filter(r => r.completedAt >= from);
    }
    if (filters?.dateTo) {
      const to = new Date(filters.dateTo).getTime() + 24 * 60 * 60 * 1000;
      records = records.filter(r => r.completedAt <= to);
    }
    if (filters?.type) {
      records = records.filter(r => r.callType === filters.type);
    }

    return records;
  }
}
