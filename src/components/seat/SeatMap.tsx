import { useMemo } from 'react';
import { useSeatStore } from '../../stores/useSeatStore';
import { Seat, SeatStatus, SEAT_STATUS_LABELS } from '../../types';
import { User, Pause, AlertTriangle, Clock } from 'lucide-react';

const seatStatusColors: Record<SeatStatus, { border: string; bg: string; text: string; pulse: boolean }> = {
  idle: { border: 'border-slate-200 dark:border-slate-700', bg: 'bg-slate-50 dark:bg-slate-800/50', text: 'text-slate-400', pulse: false },
  infusing: { border: 'border-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-950/30', text: 'text-emerald-700 dark:text-emerald-300', pulse: false },
  calling: { border: 'border-amber-400', bg: 'bg-amber-50 dark:bg-amber-950/30', text: 'text-amber-700 dark:text-amber-300', pulse: true },
  processing: { border: 'border-blue-500', bg: 'bg-blue-50 dark:bg-blue-950/30', text: 'text-blue-700 dark:text-blue-300', pulse: false },
  abnormal: { border: 'border-red-500', bg: 'bg-red-50 dark:bg-red-950/30', text: 'text-red-700 dark:text-red-300', pulse: true }
};

function SeatCard({ seat, onClick, selected }: { seat: Seat; onClick: () => void; selected: boolean }) {
  const colors = seatStatusColors[seat.status];
  const now = Date.now();
  const progress = seat.infusionStartTime && seat.infusionDuration
    ? Math.min(100, ((now - seat.infusionStartTime) / (seat.infusionDuration * 60 * 1000)) * 100)
    : 0;

  return (
    <button
      onClick={onClick}
      className={`
        relative p-3 rounded-2xl border-2 ${colors.border} ${colors.bg}
        transition-all duration-300 ease-out
        hover:scale-105 hover:shadow-lg
        ${selected ? 'ring-4 ring-blue-400/50 scale-105 shadow-xl' : ''}
        ${colors.pulse ? 'animate-pulse-slow shadow-md' : ''}
        ${seat.isPaused ? 'opacity-70' : ''}
        focus:outline-none focus:ring-4 focus:ring-blue-300
      `}
    >
      <div className="flex items-center justify-between mb-2">
        <span className={`font-bold text-lg ${colors.text}`}>{seat.number}</span>
        {seat.isPaused && <Pause className="w-4 h-4 text-slate-500" />}
        {seat.status === 'abnormal' && <AlertTriangle className="w-4 h-4 text-red-500 animate-bounce" />}
      </div>

      <div className="flex items-center gap-1 mb-2 min-h-6">
        {seat.patientName ? (
          <>
            <User className="w-3 h-3 text-slate-500 flex-shrink-0" />
            <span className="text-xs text-slate-700 dark:text-slate-300 truncate">{seat.patientName}</span>
          </>
        ) : (
          <span className="text-xs text-slate-400">空床</span>
        )}
      </div>

      <div className={`text-[10px] font-medium ${colors.text} mb-2`}>
        {SEAT_STATUS_LABELS[seat.status]}
      </div>

      {seat.infusionStartTime && seat.infusionDuration && (
        <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-emerald-400 to-emerald-500 rounded-full transition-all duration-1000"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}

      {seat.status === 'calling' && (
        <div className="absolute -top-1 -right-1 w-3 h-3 bg-amber-500 rounded-full animate-ping" />
      )}
      {seat.status === 'processing' && (
        <div className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 rounded-full" />
      )}
    </button>
  );
}

function Legend() {
  const items: { status: SeatStatus; label: string }[] = [
    { status: 'idle', label: '空闲' },
    { status: 'infusing', label: '输液中' },
    { status: 'calling', label: '呼叫中' },
    { status: 'processing', label: '处理中' },
    { status: 'abnormal', label: '异常' }
  ];

  return (
    <div className="flex flex-wrap gap-4 mb-4">
      {items.map(({ status, label }) => (
        <div key={status} className="flex items-center gap-2">
          <div className={`w-4 h-4 rounded border-2 ${seatStatusColors[status].border} ${seatStatusColors[status].bg}`} />
          <span className="text-sm text-slate-600 dark:text-slate-400">{label}</span>
        </div>
      ))}
    </div>
  );
}

export default function SeatMap({ onSeatClick }: { onSeatClick?: (seat: Seat) => void }) {
  const { seats, selectedSeatId, setSelectedSeat } = useSeatStore();

  const { rows, cols } = useMemo(() => {
    let maxRow = 0, maxCol = 0;
    seats.forEach(s => {
      maxRow = Math.max(maxRow, s.row);
      maxCol = Math.max(maxCol, s.col);
    });
    return { rows: maxRow + 1, cols: maxCol + 1 };
  }, [seats]);

  const handleClick = (seat: Seat) => {
    setSelectedSeat(selectedSeatId === seat.id ? null : seat.id);
    onSeatClick?.(seat);
  };

  const stats = useMemo(() => {
    const total = seats.length;
    const infusing = seats.filter(s => s.status === 'infusing').length;
    const calling = seats.filter(s => s.status === 'calling' || s.status === 'processing').length;
    const abnormal = seats.filter(s => s.status === 'abnormal').length;
    return { total, infusing, calling, abnormal };
  }, [seats]);

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-xl border border-slate-100 dark:border-slate-800">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
            <Clock className="w-6 h-6 text-blue-500" />
            输液座位图
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">点击座位查看详情或发起呼叫</p>
        </div>
        <div className="flex gap-3">
          <div className="px-4 py-2 bg-slate-100 dark:bg-slate-800 rounded-xl text-center">
            <div className="text-2xl font-bold text-slate-700 dark:text-slate-200">{stats.total}</div>
            <div className="text-xs text-slate-500">总座位</div>
          </div>
          <div className="px-4 py-2 bg-emerald-50 dark:bg-emerald-950/30 rounded-xl text-center">
            <div className="text-2xl font-bold text-emerald-600">{stats.infusing}</div>
            <div className="text-xs text-emerald-600/70">输液中</div>
          </div>
          <div className="px-4 py-2 bg-amber-50 dark:bg-amber-950/30 rounded-xl text-center">
            <div className="text-2xl font-bold text-amber-600">{stats.calling}</div>
            <div className="text-xs text-amber-600/70">待处理</div>
          </div>
          <div className="px-4 py-2 bg-red-50 dark:bg-red-950/30 rounded-xl text-center">
            <div className="text-2xl font-bold text-red-600">{stats.abnormal}</div>
            <div className="text-xs text-red-600/70">异常</div>
          </div>
        </div>
      </div>

      <Legend />

      <div
        className="grid gap-3"
        style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
      >
        {Array.from({ length: rows }).map((_, row) =>
          Array.from({ length: cols }).map((_, col) => {
            const seat = seats.find(s => s.row === row && s.col === col);
            if (!seat) return <div key={`${row}-${col}`} className="aspect-square" />;
            return (
              <SeatCard
                key={seat.id}
                seat={seat}
                onClick={() => handleClick(seat)}
                selected={selectedSeatId === seat.id}
              />
            );
          })
        )}
      </div>
    </div>
  );
}
