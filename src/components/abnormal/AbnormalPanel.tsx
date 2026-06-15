import { useMemo } from 'react';
import { useCallStore } from '../../stores/useCallStore';
import { useSeatStore } from '../../stores/useSeatStore';
import { useSettingStore } from '../../stores/useSettingStore';
import { CallRecord, CALL_TYPE_LABELS, ABNORMAL_TYPES } from '../../types';
import { AlertOctagon, AlertTriangle, Clock, User, CheckCircle2, Phone, Syringe, Heart } from 'lucide-react';
import { useState } from 'react';

function AbnormalCard({ call, onAccept, onComplete }: {
  call: CallRecord;
  onAccept: () => void;
  onComplete: (remark: string) => void;
}) {
  const [showDetail, setShowDetail] = useState(false);
  const [remark, setRemark] = useState('');
  const seats = useSeatStore(s => s.seats);
  const seat = seats.find(s => s.id === call.seatId);
  const now = Date.now();
  const waitTime = now - call.createdAt;
  const min = Math.floor(waitTime / 60000);
  const sec = Math.floor((waitTime % 60000) / 1000);

  return (
    <div className={`
      relative p-5 rounded-2xl border-2 border-red-300 dark:border-red-800
      bg-gradient-to-br from-red-50 to-white dark:from-red-950/40 dark:to-slate-900
      shadow-lg shadow-red-500/10 animate-pulse-border
      ${call.status === 'accepted' ? 'ring-2 ring-blue-400' : ''}
    `}>
      <div className="absolute top-0 right-0 w-16 h-16 overflow-hidden rounded-tr-2xl">
        <div className="absolute top-2 -right-10 w-32 bg-red-500 text-white text-center py-1 text-xs font-bold transform rotate-45 shadow-lg">
          紧急
        </div>
      </div>

      <div className="flex items-start gap-4">
        <div className="w-14 h-14 rounded-2xl bg-red-500/10 border-2 border-red-400/50 flex items-center justify-center flex-shrink-0">
          <AlertTriangle className="w-7 h-7 text-red-500 animate-pulse" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-2xl font-black text-red-700 dark:text-red-300">{call.seatNumber}号</span>
            <span className="px-3 py-1 rounded-full bg-red-500 text-white text-xs font-bold">
              {CALL_TYPE_LABELS[call.type]}
            </span>
            {call.abnormalType && (
              <span className="px-2 py-1 rounded-md bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 text-sm font-medium">
                {call.abnormalType}
              </span>
            )}
          </div>

          {call.patientName && (
            <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400 text-sm mb-2">
              <User className="w-4 h-4" />
              {call.patientName}
            </div>
          )}

          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-1 text-red-600 dark:text-red-400">
              <Clock className="w-4 h-4" />
              <span className="font-bold tabular-nums">等待 {min > 0 ? `${min}分` : ''}{sec}秒</span>
            </div>
            {call.acceptedBy && call.status === 'accepted' && (
              <div className="text-blue-600 dark:text-blue-400 font-medium">
                ✓ {call.acceptedBy} 已处理中
              </div>
            )}
          </div>

          {seat?.infusionStartTime && seat.infusionDuration && (
            <div className="mt-3">
              <div className="text-xs text-slate-500 mb-1">输液进度</div>
              <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-red-400 to-red-500 rounded-full"
                  style={{
                    width: `${Math.min(100, ((now - seat.infusionStartTime) / (seat.infusionDuration * 60000)) * 100)}%`
                  }}
                />
              </div>
            </div>
          )}

          {showDetail && call.status === 'accepted' && (
            <div className="mt-4 space-y-3">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  处置结果
                </label>
                <textarea
                  value={remark}
                  onChange={(e) => setRemark(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 text-sm focus:ring-2 focus:ring-blue-400 outline-none resize-none"
                  rows={3}
                  placeholder="请记录处置情况..."
                />
              </div>
            </div>
          )}

          <div className="flex gap-2 mt-4">
            {call.status === 'pending' && (
              <>
                <button
                  onClick={onAccept}
                  className="flex-1 py-3 bg-red-500 hover:bg-red-600 text-white rounded-xl font-bold transition-all hover:scale-[1.02] active:scale-95 shadow-lg shadow-red-500/30 flex items-center justify-center gap-2"
                >
                  <Phone className="w-5 h-5" />
                  立即处理
                </button>
                <button
                  onClick={() => alert('已通知值班医生')}
                  className="px-4 py-3 bg-white dark:bg-slate-800 border-2 border-red-200 dark:border-red-900 text-red-600 dark:text-red-400 rounded-xl font-semibold transition-all hover:bg-red-50 dark:hover:bg-red-950/30 flex items-center justify-center gap-2"
                >
                  <Heart className="w-5 h-5" />
                  呼叫医生
                </button>
              </>
            )}
            {call.status === 'accepted' && (
              <>
                <button
                  onClick={() => setShowDetail(!showDetail)}
                  className="px-4 py-3 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-xl font-semibold transition-all"
                >
                  {showDetail ? '收起' : '填写记录'}
                </button>
                <button
                  onClick={() => onComplete(remark)}
                  className="flex-1 py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-bold transition-all hover:scale-[1.02] active:scale-95 shadow-lg shadow-emerald-500/30 flex items-center justify-center gap-2"
                >
                  <CheckCircle2 className="w-5 h-5" />
                  处置完成
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AbnormalPanel() {
  const { calls, acceptCall, completeCall } = useCallStore();
  const { settings } = useSettingStore();

  const abnormalCalls = useMemo(() => {
    return calls.filter(c => c.type === 'abnormal' && (c.status === 'pending' || c.status === 'accepted'));
  }, [calls]);

  return (
    <div className={`
      bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-xl border-2
      ${abnormalCalls.length > 0
        ? 'border-red-300 dark:border-red-800 shadow-red-500/10'
        : 'border-slate-100 dark:border-slate-800'
      }
    `}>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
            <AlertOctagon className={`w-6 h-6 ${abnormalCalls.length > 0 ? 'text-red-500 animate-pulse' : 'text-slate-400'}`} />
            异常处理
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">最高优先级，立即响应</p>
        </div>
        <div className={`px-6 py-3 rounded-2xl text-center ${abnormalCalls.length > 0
          ? 'bg-red-500 text-white animate-pulse shadow-lg shadow-red-500/30'
          : 'bg-emerald-50 dark:bg-emerald-950/30'
        }`}>
          <div className={`text-3xl font-black ${abnormalCalls.length > 0 ? 'text-white' : 'text-emerald-600'}`}>
            {abnormalCalls.length}
          </div>
          <div className={`text-xs ${abnormalCalls.length > 0 ? 'text-white/90' : 'text-emerald-600/70'}`}>
            待处理异常
          </div>
        </div>
      </div>

      {abnormalCalls.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-emerald-50 dark:bg-emerald-950/30 flex items-center justify-center">
            <CheckCircle2 className="w-10 h-10 text-emerald-500" />
          </div>
          <p className="text-lg font-semibold text-slate-700 dark:text-slate-300">一切正常</p>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">暂无异常情况</p>
        </div>
      ) : (
        <div className="space-y-4">
          {abnormalCalls.map(call => (
            <AbnormalCard
              key={call.id}
              call={call}
              onAccept={() => acceptCall(call.id, settings.currentNurse)}
              onComplete={(remark) => completeCall(call.id, remark)}
            />
          ))}
        </div>
      )}

      <div className="mt-6 pt-6 border-t border-slate-100 dark:border-slate-800">
        <div className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-3">常见异常类型</div>
        <div className="flex flex-wrap gap-2">
          {ABNORMAL_TYPES.map(type => (
            <span
              key={type}
              className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-sm"
            >
              <Syringe className="w-3 h-3 inline mr-1.5 -mt-0.5" />
              {type}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
