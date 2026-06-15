export type CallType = 'medication' | 'remove_needle' | 'hemostasis' | 'consultation' | 'abnormal' | 'other';
export type CallPriority = 'urgent' | 'high' | 'normal' | 'low';
export type CallStatus = 'pending' | 'accepted' | 'processing' | 'completed' | 'cancelled';
export type SeatStatus = 'idle' | 'infusing' | 'calling' | 'processing' | 'abnormal';

export interface Seat {
  id: string;
  number: string;
  row: number;
  col: number;
  status: SeatStatus;
  patientName?: string;
  infusionStartTime?: number;
  infusionDuration?: number;
  currentCallId?: string;
  isPaused?: boolean;
}

export interface CallRecord {
  id: string;
  seatId: string;
  seatNumber: string;
  type: CallType;
  priority: CallPriority;
  status: CallStatus;
  patientName?: string;
  createdAt: number;
  acceptedAt?: number;
  completedAt?: number;
  timeoutAt?: number;
  acceptedBy?: string;
  remark?: string;
  abnormalType?: string;
  mergedIds?: string[];
  mergedSeatNumbers?: string[];
  mergedIntoId?: string;
  isTimeout?: boolean;
}

export interface CreateCallResult {
  call: CallRecord | null;
  isDuplicate?: boolean;
  duplicateType?: CallType;
  isPaused?: boolean;
  isMerged?: boolean;
  mergedIntoCall?: CallRecord | null;
}

export interface PatrolTask {
  id: string;
  scheduledTime: number;
  area: string;
  status: 'pending' | 'completed' | 'skipped';
  completedBy?: string;
  completedAt?: number;
  remark?: string;
}

export interface ServiceRecord {
  id: string;
  callId: string;
  seatNumber: string;
  callType: CallType;
  responseTime: number;
  processTime: number;
  handledBy?: string;
  recordDate: string;
  completedAt: number;
}

export interface Statistics {
  todayTotal: number;
  todayCompleted: number;
  avgResponseTime: number;
  avgProcessTime: number;
  timeoutCount: number;
  peakHours: { hour: number; count: number }[];
  typeDistribution: { type: CallType; count: number }[];
}

export interface SystemSettings {
  nightMode: boolean;
  nightModeStart: string;
  nightModeEnd: string;
  soundEnabled: boolean;
  soundVolume: number;
  patrolInterval: number;
  timeoutThresholds: Record<CallPriority, number>;
}

export const CALL_TYPE_LABELS: Record<CallType, string> = {
  medication: '加药',
  remove_needle: '拔针',
  hemostasis: '止血',
  consultation: '咨询',
  abnormal: '异常',
  other: '其他'
};

export const CALL_PRIORITY_LABELS: Record<CallPriority, string> = {
  urgent: '紧急',
  high: '高',
  normal: '普通',
  low: '低'
};

export const SEAT_STATUS_LABELS: Record<SeatStatus, string> = {
  idle: '空闲',
  infusing: '输液中',
  calling: '呼叫中',
  processing: '处理中',
  abnormal: '异常'
};

export const CALL_PRIORITY_ORDER: Record<CallPriority, number> = {
  urgent: 0,
  high: 1,
  normal: 2,
  low: 3
};

export const CALL_TYPE_PRIORITY: Record<CallType, CallPriority> = {
  abnormal: 'urgent',
  hemostasis: 'high',
  remove_needle: 'high',
  medication: 'normal',
  consultation: 'low',
  other: 'low'
};

export const DEFAULT_TIMEOUT_THRESHOLDS: Record<CallPriority, number> = {
  urgent: 2 * 60 * 1000,
  high: 5 * 60 * 1000,
  normal: 8 * 60 * 1000,
  low: 15 * 60 * 1000
};
