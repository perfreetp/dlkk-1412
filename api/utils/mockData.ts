import { Seat, CallRecord, PatrolTask, ServiceRecord, CallType, CallPriority, SeatStatus, CALL_TYPE_PRIORITY } from '../../shared/types';

const ROWS = 6;
const COLS = 8;
const patientNames = ['张伟', '李娜', '王芳', '刘洋', '陈静', '杨光', '赵敏', '黄磊', '周婷', '吴强', '徐丽', '孙浩', '马玲', '朱军', '胡雪', '林涛'];

export function generateMockSeats(): Seat[] {
  const seats: Seat[] = [];
  const now = Date.now();

  for (let row = 0; row < ROWS; row++) {
    for (let col = 0; col < COLS; col++) {
      const id = `seat-${row}-${col}`;
      const number = `${String.fromCharCode(65 + row)}${col + 1}`;
      const rand = Math.random();
      let status: SeatStatus = 'idle';
      let patientName: string | undefined;
      let infusionStartTime: number | undefined;
      let infusionDuration: number | undefined;

      if (rand < 0.6) {
        status = 'infusing';
        patientName = patientNames[Math.floor(Math.random() * patientNames.length)];
        infusionDuration = 60 + Math.floor(Math.random() * 120);
        infusionStartTime = now - Math.floor(Math.random() * infusionDuration * 60 * 1000 * 0.5);
      }

      seats.push({
        id,
        number,
        row,
        col,
        status,
        patientName,
        infusionStartTime,
        infusionDuration
      });
    }
  }

  const callingSeats = [3, 10, 25, 38];
  callingSeats.forEach(idx => {
    if (seats[idx]) {
      seats[idx].status = 'calling';
    }
  });

  seats[15].status = 'processing';
  seats[20].status = 'abnormal';
  seats[44].patientName = undefined;
  seats[44].status = 'idle';
  seats[44].infusionStartTime = undefined;
  seats[44].infusionDuration = undefined;

  return seats;
}

const callTypes: CallType[] = ['medication', 'remove_needle', 'hemostasis', 'consultation', 'abnormal', 'other'];

export function generateMockCalls(seats: Seat[]): CallRecord[] {
  const calls: CallRecord[] = [];
  const now = Date.now();

  const callingSeats = seats.filter(s => s.status === 'calling' || s.status === 'processing' || s.status === 'abnormal');
  const types: CallType[] = ['remove_needle', 'medication', 'hemostasis', 'abnormal', 'consultation', 'medication', 'other', 'remove_needle'];

  callingSeats.forEach((seat, idx) => {
    const type = types[idx % types.length];
    const priority = CALL_TYPE_PRIORITY[type];
    const call: CallRecord = {
      id: `call-${seat.id}`,
      seatId: seat.id,
      seatNumber: seat.number,
      type,
      priority,
      status: seat.status === 'processing' ? 'accepted' : seat.status === 'abnormal' ? 'pending' : 'pending',
      patientName: seat.patientName,
      createdAt: now - (idx + 1) * 60 * 1000,
      acceptedAt: seat.status === 'processing' ? now - 30 * 1000 : undefined,
      acceptedBy: seat.status === 'processing' ? '护士小王' : undefined,
      abnormalType: type === 'abnormal' ? '液体渗液' : undefined
    };
    calls.push(call);
    seat.currentCallId = call.id;
  });

  return calls;
}

export function generateMockPatrols(): PatrolTask[] {
  const now = Date.now();
  const patrols: PatrolTask[] = [];
  const areas = ['A区(1-8号)', 'B区(1-8号)', 'C区(1-8号)', 'D区(1-8号)'];

  for (let i = 0; i < 4; i++) {
    patrols.push({
      id: `patrol-${i}`,
      scheduledTime: now - (4 - i) * 30 * 60 * 1000,
      area: areas[i],
      status: i < 2 ? 'completed' : i === 2 ? 'pending' : 'pending',
      completedBy: i < 2 ? '护士小李' : undefined,
      completedAt: i < 2 ? now - (3 - i) * 30 * 60 * 1000 : undefined
    });
  }

  patrols.push({
    id: `patrol-next`,
    scheduledTime: now + 15 * 60 * 1000,
    area: 'A区(1-8号)',
    status: 'pending'
  });

  return patrols;
}

export function generateMockRecords(): ServiceRecord[] {
  const records: ServiceRecord[] = [];
  const now = Date.now();
  const types: CallType[] = ['medication', 'remove_needle', 'hemostasis', 'consultation', 'other'];
  const seats = ['A1', 'A3', 'B2', 'B5', 'C1', 'C4', 'D3', 'D7', 'A5', 'B7'];
  const nurses = ['护士小王', '护士小李', '护士小张', '护士小陈'];

  for (let i = 0; i < 50; i++) {
    const completedAt = now - i * 30 * 60 * 1000 - Math.random() * 20 * 60 * 1000;
    const date = new Date(completedAt);
    records.push({
      id: `record-${i}`,
      callId: `call-hist-${i}`,
      seatNumber: seats[i % seats.length],
      callType: types[i % types.length],
      responseTime: 30 + Math.floor(Math.random() * 200),
      processTime: 60 + Math.floor(Math.random() * 300),
      handledBy: nurses[i % nurses.length],
      recordDate: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`,
      completedAt
    });
  }

  return records;
}
