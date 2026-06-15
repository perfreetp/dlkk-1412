import { useEffect, useState } from 'react';
import { useCallStore } from '../../stores/useCallStore';
import { useSettingStore } from '../../stores/useSettingStore';
import { CallRecord, CALL_TYPE_LABELS, CALL_PRIORITY_LABELS, DEFAULT_TIMEOUT_THRESHOLDS } from '../../types';
import { ListTodo, Clock, UserCheck, AlertCircle, Syringe, Pill, Bandage, MessageCircle, AlertTriangle, MoreHorizontal, CheckCircle2, X } from 'lucide-react';
import { useAudio } from '../../hooks/useAudio';

const priorityStyles: Record<string, { bg: string; text: string; badge: string }> = {
  urgent: { bg: 'bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-900', text: 'text-red-700 dark:text-red-300', badge: 'bg-red-500' },
  high: { bg: 'bg-orange-50 dark:bg-orange-950/30 border-orange-200 dark:border-orange-900', text: 'text-orange-700 dark:text-orange-300', badge: 'bg-orange-500' },
  normal: { bg: 'bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-900', text: 'text-blue-700 dark:text-blue-300', badge: 'bg-blue-500' },
  low: { bg: 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700', text: 'text-slate-700 dark:text-slate-300', badge: 'bg-slate-500' }
};

const typeIcons: Record<string, React.ReactNode> = {
  medication: <Pill className="w-5 h-5" />,
  remove_needle: <Syringe className="w-5 h-5" />,
  hemostasis: <Bandage className="w-5 h-5" />,
  consultation: <MessageCircle className="w-5 h-5" />,
  abnormal: <AlertTriangle className="w-5 h-5" />,
  other: <MoreHorizontal className="w-5 h-5" />
};

function formatDuration(ms: number): string {
  const totalSec = Math.floor(ms / 1000);
  const min = Math.floor(totalSec / 60);
  const sec = totalSec % 60;
  return min > 0 ? `${min}分${sec}秒` : `${sec}秒`;
}

function CallCard({ call, onAccept, onComplete, onCancel }: {
  call: CallRecord;
  onAccept: () => void;
  onComplete: () => void;
  onCancel: () => void;
}) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  const styles = priorityStyles[call.priority];
  const waitTime = now - call.createdAt;
  const timeout = DEFAULT_TIMEOUT_THRESHOLDS[call.priority];
  const isTimeout = call.status === 'pending' && waitTime > timeout;
  const progress = Math.min(100, (waitTime / timeout) * 100);
  const mergedCount = call.mergedIds?.length || 0;

  return (
    <div className={`
      relative p-4 rounded-2xl border-2 ${styles.bg}
      transition-all duration-300 animate-slide-in
      ${isTimeout ? 'animate-flash-red ring-2 ring-red-400' : ''}
      ${call.status === 'accepted' ? 'opacity-80' : ''}
    `}>
      <div className="absolute left-0 top-0 bottom-0 w-1.5 rounded-l-2xl" style={{
        background: isTimeout ? '#EF4444' : undefined,
        backgroundColor: !isTimeout ? undefined : undefined
      }}>
        <div className={`w-full h-full rounded-l-2xl ${styles.badge} ${isTimeout ? 'bg-red-500 animate-pulse' : ''}`} />
      </div>

      <div className="flex items-start justify-between gap-3 pl-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <span className={`px-2.5 py-1 rounded-full text-xs font-bold text-white ${styles.badge}`}>
              {CALL_PRIORITY_LABELS[call.priority]}
            </span>
            <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${styles.text} bg-white/60 dark:bg-slate-900/60`}>
              {typeIcons[call.type]}
              <span className="ml-1">{CALL_TYPE_LABELS[call.type]}</span>
            </span>
            {mergedCount > 0 && (
              <span className="px-2 py-0.5 rounded-full text-xs bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 font-medium">
                合并{mergedCount}单
              </span>
            )}
            {isTimeout && (
              <span className="px-2 py-0.5 rounded-full text-xs bg-red-100 dark:bg-red-900/30 text-red-600 font-bold animate-pulse flex items-center gap-1">
                <AlertCircle className="w-3 h-3" /> 超时
              </span>
            )}
          </div>

          <div className="flex items-center gap-4 text-sm">
            <div className="font-bold text-lg text-slate-800 dark:text-white">
              {call.seatNumber}号
            </div>
            {call.patientName && (
              <div className="text-slate-600 dark:text-slate-400">{call.patientName}</div>
            )}
          </div>

          {call.abnormalType && (
            <div className="mt-2 text-sm text-red-600 dark:text-red-400 font-medium">
              ⚠️ {call.abnormalType}
            </div>
          )}

          {call.acceptedBy && call.status === 'accepted' && (
            <div className="mt-2 text-sm text-blue-600 dark:text-blue-400 flex items-center gap-1">
              <UserCheck className="w-4 h-4" />
              {call.acceptedBy} 已接单
            </div>
          )}

          <div className="mt-3 flex items-center gap-2">
            <Clock className="w-4 h-4 text-slate-400" />
            <span className="text-sm text-slate-600 dark:text-slate-400 tabular-nums">
              等待 {formatDuration(waitTime)}
            </span>
            {call.status === 'pending' && (
              <div className="flex-1 h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden ml-2">
                <div
                  className={`h-full rounded-full transition-all duration-1000 ${isTimeout ? 'bg-red-500' : progress > 70 ? 'bg-orange-500' : 'bg-blue-500'}`}
                  style={{ width: `${progress}%` }}
                />
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-2">
          {call.status === 'pending' && (
            <>
              <button
                onClick={onAccept}
                className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-xl font-semibold text-sm transition-all hover:scale-105 active:scale-95 shadow-lg shadow-blue-500/30"
              >
                接单
              </button>
              <button
                onClick={onCancel}
                className="px-4 py-2 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-xl text-sm transition-all"
              >
                取消
              </button>
            </>
          )}
          {call.status === 'accepted' && (
            <button
              onClick={onComplete}
              className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-semibold text-sm transition-all hover:scale-105 active:scale-95 shadow-lg shadow-emerald-500/30 flex items-center gap-1"
            >
              <CheckCircle2 className="w-4 h-4" />
              完成
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default function CallQueue() {
  const { calls, getSortedCalls, acceptCall, completeCall, cancelCall } = useCallStore();
  const { settings } = useSettingStore();
  const { playCallSound } = useAudio();
  const [prevCount, setPrevCount] = useState(0);

  const sortedCalls = getSortedCalls();
  const pendingCount = sortedCalls.filter(c => c.status === 'pending').length;
  const processingCount = sortedCalls.filter(c => c.status === 'accepted').length;

  useEffect(() => {
    const currentPending = calls.filter(c => c.status === 'pending').length;
    if (currentPending > prevCount) {
      const hasUrgent = calls.some(c => c.status === 'pending' && c.priority === 'urgent');
      playCallSound(hasUrgent);
    }
    setPrevCount(currentPending);
  }, [calls, prevCount, playCallSound]);

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-xl border border-slate-100 dark:border-slate-800 h-full flex flex-col">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
            <ListTodo className="w-6 h-6 text-amber-500" />
            呼叫队列
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">按优先级自动排序处理</p>
        </div>
        <div className="flex gap-3">
          <div className="px-4 py-2 bg-amber-50 dark:bg-amber-950/30 rounded-xl text-center">
            <div className="text-2xl font-bold text-amber-600">{pendingCount}</div>
            <div className="text-xs text-amber-600/70">待接单</div>
          </div>
          <div className="px-4 py-2 bg-blue-50 dark:bg-blue-950/30 rounded-xl text-center">
            <div className="text-2xl font-bold text-blue-600">{processingCount}</div>
            <div className="text-xs text-blue-600/70">处理中</div>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto space-y-3 pr-2 custom-scrollbar">
        {sortedCalls.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-slate-400 py-12">
            <X className="w-16 h-16 mb-4 opacity-30" />
            <p className="text-lg font-medium">暂无呼叫请求</p>
            <p className="text-sm mt-2">患者发起呼叫后将显示在此处</p>
          </div>
        ) : (
          sortedCalls.map(call => (
            <CallCard
              key={call.id}
              call={call}
              onAccept={() => acceptCall(call.id, settings.currentNurse)}
              onComplete={() => completeCall(call.id)}
              onCancel={() => cancelCall(call.id)}
            />
          ))
        )}
      </div>
    </div>
  );
}
