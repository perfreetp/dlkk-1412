import { useState } from 'react';
import { X, Pill, Syringe, Bandage, MessageCircle, AlertTriangle, MoreHorizontal, User, Clock, Play, Square, Pause, AlertCircle, Users, CheckCircle2 } from 'lucide-react';
import { Seat, CallType, ABNORMAL_TYPES, CALL_TYPE_LABELS } from '../../types';
import { useSeatStore } from '../../stores/useSeatStore';
import { useCallStore } from '../../stores/useCallStore';

interface Props {
  seat: Seat;
  onClose: () => void;
}

const callButtons: { type: CallType; label: string; icon: React.ReactNode; color: string }[] = [
  { type: 'medication', label: '加药', icon: <Pill className="w-7 h-7" />, color: 'from-purple-400 to-purple-600 hover:from-purple-500 hover:to-purple-700' },
  { type: 'remove_needle', label: '拔针', icon: <Syringe className="w-7 h-7" />, color: 'from-blue-400 to-blue-600 hover:from-blue-500 hover:to-blue-700' },
  { type: 'hemostasis', label: '止血', icon: <Bandage className="w-7 h-7" />, color: 'from-red-400 to-red-600 hover:from-red-500 hover:to-red-700' },
  { type: 'consultation', label: '咨询', icon: <MessageCircle className="w-7 h-7" />, color: 'from-slate-400 to-slate-600 hover:from-slate-500 hover:to-slate-700' },
  { type: 'abnormal', label: '异常', icon: <AlertTriangle className="w-7 h-7" />, color: 'from-orange-400 to-red-500 hover:from-orange-500 hover:to-red-600' },
  { type: 'other', label: '其他', icon: <MoreHorizontal className="w-7 h-7" />, color: 'from-teal-400 to-teal-600 hover:from-teal-500 hover:to-teal-700' },
];

export default function SeatDetailModal({ seat, onClose }: Props) {
  const { togglePause, startInfusion, endInfusion } = useSeatStore();
  const { createCall, getActiveCallsBySeat } = useCallStore();
  const [showInfusionForm, setShowInfusionForm] = useState(false);
  const [patientName, setPatientName] = useState('');
  const [duration, setDuration] = useState(90);
  const [showAbnormalModal, setShowAbnormalModal] = useState(false);
  const [abnormalType, setAbnormalType] = useState('');
  const [callFeedback, setCallFeedback] = useState<{ type: CallType; mode: 'success' | 'paused' | 'duplicate' | 'merged'; message?: string; existingType?: CallType; mergedSeatNumber?: string } | null>(null);

  const activeCalls = getActiveCallsBySeat(seat.id);
  const now = Date.now();
  const progress = seat.infusionStartTime && seat.infusionDuration
    ? Math.min(100, ((now - seat.infusionStartTime) / (seat.infusionDuration * 60000)) * 100)
    : 0;

  const handleCall = async (type: CallType) => {
    if (type === 'abnormal') {
      setShowAbnormalModal(true);
      return;
    }

    if (seat.isPaused) {
      setCallFeedback({ type, mode: 'paused', message: '当前座位已暂停，恢复后才能发起呼叫' });
      setTimeout(() => setCallFeedback(null), 2500);
      return;
    }

    const result = await createCall(seat.id, type);

    if (result.isPaused) {
      setCallFeedback({ type, mode: 'paused', message: result.message || '座位已暂停' });
      setTimeout(() => setCallFeedback(null), 2500);
      return;
    }

    if (result.isDuplicate) {
      setCallFeedback({
        type,
        mode: 'duplicate',
        existingType: result.duplicateType,
        message: result.message
      });
      setTimeout(() => setCallFeedback(null), 3000);
      return;
    }

    if (result.isMerged && result.mergedIntoCall) {
      setCallFeedback({
        type,
        mode: 'merged',
        mergedSeatNumber: result.mergedIntoCall.seatNumber
      });
      setTimeout(() => setCallFeedback(null), 2500);
      return;
    }

    if (result.call) {
      setCallFeedback({ type, mode: 'success' });
      setTimeout(() => setCallFeedback(null), 2000);
    }
  };

  const handleAbnormalSubmit = async () => {
    if (!abnormalType) return;

    if (seat.isPaused) {
      setShowAbnormalModal(false);
      setCallFeedback({ type: 'abnormal', mode: 'paused', message: '当前座位已暂停，恢复后才能发起呼叫' });
      setTimeout(() => setCallFeedback(null), 2500);
      return;
    }

    const result = await createCall(seat.id, 'abnormal', abnormalType);
    setShowAbnormalModal(false);
    setAbnormalType('');

    if (result.isPaused) {
      setCallFeedback({ type: 'abnormal', mode: 'paused', message: result.message || '座位已暂停' });
      setTimeout(() => setCallFeedback(null), 2500);
      return;
    }

    if (result.isDuplicate) {
      setCallFeedback({
        type: 'abnormal',
        mode: 'duplicate',
        existingType: result.duplicateType,
        message: result.message
      });
      setTimeout(() => setCallFeedback(null), 3000);
      return;
    }

    if (result.call) {
      setCallFeedback({ type: 'abnormal', mode: 'success' });
      setTimeout(() => setCallFeedback(null), 2000);
    }
  };

  const handleStartInfusion = async () => {
    if (!patientName.trim()) return;
    await startInfusion(seat.id, patientName.trim(), duration);
    setShowInfusionForm(false);
    setPatientName('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in" onClick={onClose}>
      <div
        className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl overflow-hidden animate-scale-in max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3">
              <h3 className="text-3xl font-black text-slate-800 dark:text-white">{seat.number}号座位</h3>
              {seat.isPaused && (
                <span className="px-2 py-1 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-xs font-medium flex items-center gap-1">
                  <Pause className="w-3 h-3" /> 已暂停
                </span>
              )}
            </div>
            <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">第{seat.row + 1}排 · 第{seat.col + 1}列</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar space-y-6">
          {seat.patientName ? (
            <div className="p-5 rounded-2xl bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/30 border border-emerald-100 dark:border-emerald-900/30">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center">
                    <User className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <div>
                    <div className="font-bold text-lg text-slate-800 dark:text-white">{seat.patientName}</div>
                    <div className="text-sm text-slate-500 dark:text-slate-400 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      输液中 · 预计{seat.infusionDuration}分钟
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => togglePause(seat.id)}
                    className="px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                  >
                    {seat.isPaused ? '恢复' : '暂停'}
                  </button>
                  <button
                    onClick={() => endInfusion(seat.id)}
                    className="px-3 py-2 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-950/50 transition-colors"
                  >
                    <Square className="w-4 h-4 inline mr-1" /> 结束输液
                  </button>
                </div>
              </div>
              <div className="mt-4">
                <div className="flex justify-between text-xs text-slate-500 mb-1.5">
                  <span>输液进度</span>
                  <span className="font-semibold tabular-nums">{progress.toFixed(0)}%</span>
                </div>
                <div className="h-3 bg-white dark:bg-slate-800 rounded-full overflow-hidden shadow-inner">
                  <div
                    className="h-full bg-gradient-to-r from-emerald-400 via-emerald-500 to-teal-500 rounded-full transition-all duration-1000 relative overflow-hidden"
                    style={{ width: `${progress}%` }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-pulse" />
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
              {!showInfusionForm ? (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-slate-200 dark:bg-slate-700 flex items-center justify-center">
                      <User className="w-6 h-6 text-slate-400" />
                    </div>
                    <div>
                      <div className="font-medium text-slate-600 dark:text-slate-400">空床</div>
                      <div className="text-sm text-slate-400 dark:text-slate-500">可安排患者输液</div>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowInfusionForm(true)}
                    className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-semibold transition-all hover:scale-[1.02] shadow-lg shadow-emerald-500/30 flex items-center gap-1"
                  >
                    <Play className="w-4 h-4" /> 开始输液
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">患者姓名</label>
                    <input
                      type="text"
                      value={patientName}
                      onChange={(e) => setPatientName(e.target.value)}
                      placeholder="请输入患者姓名"
                      className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-emerald-400 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      预计时长：<span className="font-bold text-emerald-600">{duration}分钟</span>
                    </label>
                    <input
                      type="range"
                      min={30}
                      max={240}
                      step={15}
                      value={duration}
                      onChange={(e) => setDuration(Number(e.target.value))}
                      className="w-full"
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setShowInfusionForm(false)}
                      className="flex-1 px-4 py-3 rounded-xl bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors"
                    >
                      取消
                    </button>
                    <button
                      onClick={handleStartInfusion}
                      disabled={!patientName.trim()}
                      className="flex-1 px-4 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold transition-all"
                    >
                      确认开始
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeCalls.length > 0 && (
            <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/50">
              <div className="text-sm font-semibold text-amber-700 dark:text-amber-400 mb-2">当前呼叫</div>
              {activeCalls.map(call => (
                <div key={call.id} className="flex items-center justify-between">
                  <span className="text-slate-700 dark:text-slate-300">{CALL_TYPE_LABELS[call.type]}</span>
                  <span className={`badge ${call.status === 'accepted' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300' : 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300'}`}>
                    {call.status === 'accepted' ? '处理中' : '等待中'}
                  </span>
                </div>
              ))}
            </div>
          )}

          <div>
            <div className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3 flex items-center gap-2">
              <MessageCircle className="w-4 h-4" />
              发起呼叫
            </div>

            {callFeedback && (
              <div className={`mb-4 p-3 rounded-2xl flex items-center gap-3 text-sm font-medium animate-slide-in ${
                callFeedback.mode === 'success'
                  ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900/50'
                  : callFeedback.mode === 'paused'
                    ? 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                    : callFeedback.mode === 'duplicate'
                      ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-900/50'
                      : 'bg-cyan-50 dark:bg-cyan-950/40 text-cyan-700 dark:text-cyan-300 border border-cyan-200 dark:border-cyan-900/50'
              }`}>
                {callFeedback.mode === 'success' && <CheckCircle2 className="w-5 h-5 flex-shrink-0" />}
                {callFeedback.mode === 'paused' && <Pause className="w-5 h-5 flex-shrink-0" />}
                {callFeedback.mode === 'duplicate' && <AlertCircle className="w-5 h-5 flex-shrink-0" />}
                {callFeedback.mode === 'merged' && <Users className="w-5 h-5 flex-shrink-0" />}
                <div className="flex-1">
                  <div className="font-bold">
                    {callFeedback.mode === 'success' && `${CALL_TYPE_LABELS[callFeedback.type]}呼叫已发送`}
                    {callFeedback.mode === 'paused' && '座位已暂停'}
                    {callFeedback.mode === 'duplicate' && '已有呼叫等待中'}
                    {callFeedback.mode === 'merged' && '已加入合并队列'}
                  </div>
                  <div className="text-xs opacity-80 mt-0.5">
                    {callFeedback.mode === 'success' && '护士会尽快前来处理'}
                    {callFeedback.mode === 'paused' && (callFeedback.message || '恢复后才能发起呼叫，请联系护士')}
                    {callFeedback.mode === 'duplicate' && `当前已有【${callFeedback.existingType ? CALL_TYPE_LABELS[callFeedback.existingType] : '未处理'}】请求`}
                    {callFeedback.mode === 'merged' && `与${callFeedback.mergedSeatNumber}号合并，护士会统一处理`}
                  </div>
                </div>
              </div>
            )}

            <div className="grid grid-cols-3 gap-3">
              {callButtons.map(({ type, label, icon, color }) => {
                const hasActive = activeCalls.length > 0;
                const isDisabled = !seat.patientName || hasActive;
                return (
                  <button
                    key={type}
                    onClick={() => handleCall(type)}
                    disabled={isDisabled}
                    className={`
                      p-4 rounded-2xl text-white font-semibold bg-gradient-to-br ${color}
                      transition-all duration-200 hover:scale-[1.03] active:scale-95 shadow-lg
                      disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100
                      flex flex-col items-center justify-center gap-2
                      ${hasActive ? '' : ''}
                    `}
                  >
                    {icon}
                    <span className="text-sm">{label}</span>
                  </button>
                );
              })}
            </div>

            {activeCalls.length > 0 && (
              <div className="mt-3 text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5" />
                当前已有{activeCalls.length}个未处理呼叫，请等待处理完成后再发起新呼叫
              </div>
            )}
            {seat.isPaused && (
              <div className="mt-3 text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <Pause className="w-3.5 h-3.5" />
                座位处于暂停状态，患者端无法发起呼叫
              </div>
            )}
          </div>
        </div>
      </div>

      {showAbnormalModal && (
        <div className="absolute inset-0 z-10 flex items-center justify-center p-4 bg-black/50 animate-fade-in" onClick={() => setShowAbnormalModal(false)}>
          <div
            className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-2xl overflow-hidden animate-scale-in p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h4 className="text-xl font-bold text-slate-800 dark:text-white mb-2 flex items-center gap-2">
              <AlertTriangle className="w-6 h-6 text-orange-500" />
              请选择异常类型
            </h4>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">异常呼叫将最高优先级处理</p>
            <div className="grid grid-cols-2 gap-2 mb-5">
              {ABNORMAL_TYPES.map(type => (
                <button
                  key={type}
                  onClick={() => setAbnormalType(type)}
                  className={`p-3 rounded-xl text-sm font-medium transition-all ${abnormalType === type
                    ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/30 scale-105'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowAbnormalModal(false)}
                className="flex-1 px-4 py-3 rounded-xl bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleAbnormalSubmit}
                disabled={!abnormalType}
                className="flex-1 px-4 py-3 rounded-xl bg-orange-500 hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold transition-all shadow-lg shadow-orange-500/30"
              >
                确认呼叫
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
