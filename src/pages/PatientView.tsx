import { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Pill, Syringe, Bandage, MessageCircle, AlertTriangle, MoreHorizontal,
  ArrowLeft, CheckCircle2, Clock, User, Heart, X, ChevronRight, Volume2, VolumeX, Moon, Sun,
  Users, Zap, AlertCircle
} from 'lucide-react';

import { useSeatStore } from '../stores/useSeatStore';
import { useCallStore } from '../stores/useCallStore';
import { useSettingStore } from '../stores/useSettingStore';
import { useAudio } from '../hooks/useAudio';

import { Seat, CallType, CALL_TYPE_LABELS, CALL_PRIORITY_LABELS, ABNORMAL_TYPES, DEFAULT_TIMEOUT_THRESHOLDS } from '../types';

const callButtons: { type: CallType; label: string; icon: React.ReactNode; gradient: string; ring: string; desc: string }[] = [
  { type: 'medication', label: '需要加药', icon: <Pill className="w-10 h-10 md:w-12 md:h-12" />, gradient: 'from-purple-400 via-purple-500 to-purple-600', ring: 'ring-purple-300/60', desc: '药液快输完或需要添加药物' },
  { type: 'remove_needle', label: '输液完成拔针', icon: <Syringe className="w-10 h-10 md:w-12 md:h-12" />, gradient: 'from-blue-400 via-blue-500 to-blue-600', ring: 'ring-blue-300/60', desc: '输液结束，需要拔除针头' },
  { type: 'hemostasis', label: '出血止血', icon: <Bandage className="w-10 h-10 md:w-12 md:h-12" />, gradient: 'from-rose-400 via-red-500 to-red-600', ring: 'ring-red-300/60', desc: '穿刺部位出血或渗血' },
  { type: 'consultation', label: '咨询问题', icon: <MessageCircle className="w-10 h-10 md:w-12 md:h-12" />, gradient: 'from-slate-400 via-slate-500 to-slate-600', ring: 'ring-slate-300/60', desc: '有疑问需要咨询护士' },
  { type: 'abnormal', label: '身体异常', icon: <AlertTriangle className="w-10 h-10 md:w-12 md:h-12" />, gradient: 'from-orange-400 via-orange-500 to-red-500', ring: 'ring-orange-300/60', desc: '感到不适或出现异常反应' },
  { type: 'other', label: '其他需求', icon: <MoreHorizontal className="w-10 h-10 md:w-12 md:h-12" />, gradient: 'from-teal-400 via-teal-500 to-teal-600', ring: 'ring-teal-300/60', desc: '其他需要帮助的事项' }
];

export default function PatientView() {
  const { seatId = 'seat-0-0' } = useParams<{ seatId: string }>();
  const navigate = useNavigate();

  const { seats, fetchSeats } = useSeatStore();
  const { createCall, getActiveCallsBySeat, cancelCall, calls, completedReceipt, setCompletedReceipt } = useCallStore();
  const { settings, toggleNightMode, toggleSound, isNightModeActive } = useSettingStore();
  const { playCompleteSound } = useAudio();

  const [showAbnormalPicker, setShowAbnormalPicker] = useState(false);
  const [selectedAbnormal, setSelectedAbnormal] = useState('');
  const [callFeedback, setCallFeedback] = useState<{ type: CallType; show: boolean; mode: 'success' | 'paused' | 'duplicate' | 'merged'; message?: string; existingType?: CallType; mergedSeatNumber?: string } | null>(null);
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    fetchSeats();
  }, [fetchSeats]);

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (completedReceipt && completedReceipt.seatId === seatId) {
      playCompleteSound();
    }
  }, [completedReceipt, seatId, playCompleteSound]);

  const seat: Seat | undefined = useMemo(() => seats.find((s) => s.id === seatId), [seats, seatId]);
  const myActiveCalls = useMemo(() => getActiveCallsBySeat(seatId), [calls, seatId, getActiveCallsBySeat]);

  const allActiveCalls = useMemo(() => {
    return calls
      .filter((c) => c.status === 'pending' || c.status === 'accepted')
      .sort((a, b) => {
        const pa = { urgent: 0, high: 1, normal: 2, low: 3 }[a.priority];
        const pb = { urgent: 0, high: 1, normal: 2, low: 3 }[b.priority];
        if (pa !== pb) return pa - pb;
        return a.createdAt - b.createdAt;
      });
  }, [calls]);

  const myQueuePosition = useMemo(() => {
    const mainCall = useCallStore.getState().findMainCallForSeat(seatId);
    if (!mainCall) return null;
    const position = useCallStore.getState().getQueuePosition(mainCall.id);
    return position > 0 ? position : null;
  }, [calls, seatId]);

  const handleCall = async (type: CallType) => {
    if (seat?.isPaused) {
      setCallFeedback({
        type,
        show: true,
        mode: 'paused',
        message: '当前座位呼叫功能已临时暂停'
      });
      setTimeout(() => setCallFeedback(null), 3000);
      return;
    }

    if (type === 'abnormal') {
      setShowAbnormalPicker(true);
      return;
    }

    const result = await createCall(seatId, type);

    if (result.isPaused) {
      setCallFeedback({
        type,
        show: true,
        mode: 'paused',
        message: result.message || '座位已暂停，请联系护士恢复后再呼叫'
      });
      setTimeout(() => setCallFeedback(null), 3500);
      return;
    }

    if (result.isDuplicate) {
      setCallFeedback({
        type,
        show: true,
        mode: 'duplicate',
        existingType: result.duplicateType,
        message: result.message || '已有未处理的呼叫'
      });
      setTimeout(() => setCallFeedback(null), 3500);
      return;
    }

    if (result.isMerged && result.mergedIntoCall) {
      setCallFeedback({
        type,
        show: true,
        mode: 'merged',
        mergedSeatNumber: result.mergedIntoCall.seatNumber,
        message: `已加入${result.mergedIntoCall.seatNumber}号的合并呼叫队列`
      });
      setTimeout(() => setCallFeedback(null), 3000);
      return;
    }

    if (result.call) {
      setCallFeedback({ type, show: true, mode: 'success' });
      setTimeout(() => setCallFeedback(null), 2500);
    }
  };

  const handleAbnormalSubmit = async () => {
    if (!selectedAbnormal) return;

    if (seat?.isPaused) {
      setShowAbnormalPicker(false);
      setCallFeedback({
        type: 'abnormal',
        show: true,
        mode: 'paused',
        message: '当前座位呼叫功能已临时暂停'
      });
      setTimeout(() => setCallFeedback(null), 3000);
      return;
    }

    const result = await createCall(seatId, 'abnormal', selectedAbnormal);
    setShowAbnormalPicker(false);
    setSelectedAbnormal('');

    if (result.isPaused) {
      setCallFeedback({
        type: 'abnormal',
        show: true,
        mode: 'paused',
        message: result.message || '座位已暂停，请联系护士恢复后再呼叫'
      });
      setTimeout(() => setCallFeedback(null), 3500);
      return;
    }

    if (result.isDuplicate) {
      setCallFeedback({
        type: 'abnormal',
        show: true,
        mode: 'duplicate',
        existingType: result.duplicateType,
        message: result.message || '已有未处理的呼叫'
      });
      setTimeout(() => setCallFeedback(null), 3500);
      return;
    }

    if (result.call) {
      setCallFeedback({ type: 'abnormal', show: true, mode: 'success' });
      setTimeout(() => setCallFeedback(null), 2500);
    }
  };

  const formatWaitTime = (ms: number) => {
    const totalSec = Math.floor(ms / 1000);
    const min = Math.floor(totalSec / 60);
    const sec = totalSec % 60;
    return min > 0 ? `${min}分${sec}秒` : `${sec}秒`;
  };

  const infusionProgress = seat?.infusionStartTime && seat?.infusionDuration
    ? Math.min(100, ((now - seat.infusionStartTime) / (seat.infusionDuration * 60000)) * 100)
    : 0;

  const remainingMinutes = seat?.infusionStartTime && seat?.infusionDuration
    ? Math.max(0, Math.ceil((seat.infusionDuration * 60000 - (now - seat.infusionStartTime)) / 60000))
    : 0;

  const nightActive = isNightModeActive();

  if (!seat) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100 dark:bg-slate-900 p-4">
        <div className="text-center">
          <div className="w-20 h-20 mx-auto mb-4 rounded-full border-4 border-slate-200 border-t-blue-500 animate-spin" />
          <p className="text-lg text-slate-600 dark:text-slate-400">加载中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen transition-colors duration-500 ${nightActive
      ? 'bg-gradient-to-b from-indigo-950 via-slate-950 to-slate-900 text-slate-100'
      : 'bg-gradient-to-b from-sky-50 via-blue-50/40 to-indigo-50/60 text-slate-800'
    }`}>
      <header className={`sticky top-0 z-30 backdrop-blur-xl border-b transition-colors ${nightActive ? 'bg-indigo-950/70 border-indigo-900/50' : 'bg-white/70 border-slate-200/60'}`}>
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between gap-4">
            <button
              onClick={() => navigate('/')}
              className={`p-2.5 rounded-2xl transition-all ${nightActive ? 'hover:bg-indigo-900/60 text-indigo-200' : 'hover:bg-slate-100 text-slate-600'}`}
            >
              <ArrowLeft className="w-6 h-6" />
            </button>

            <div className="flex items-center gap-3">
              <div className={`w-12 h-12 md:w-14 md:h-14 rounded-2xl flex items-center justify-center shadow-lg ${nightActive ? 'bg-gradient-to-br from-indigo-500 to-purple-600' : 'bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-600 shadow-blue-500/30'}`}>
                <Heart className="w-6 h-6 md:w-7 md:h-7 text-white" fill="white" />
              </div>
              <div>
                <h1 className="text-lg md:text-xl font-black">输液呼叫服务</h1>
                <p className={`text-xs ${nightActive ? 'text-indigo-300' : 'text-slate-500'}`}>一键呼叫 · 安心输液</p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-slate-100/60 dark:bg-slate-800/50">
              <button
                onClick={toggleSound}
                className={`p-2 rounded-xl transition-colors ${nightActive ? 'text-indigo-200 hover:bg-indigo-900/60' : 'text-slate-600 hover:bg-white'}`}
                title={settings.soundEnabled ? '静音' : '开启声音'}
              >
                {settings.soundEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
              </button>
              <button
                onClick={toggleNightMode}
                className={`p-2 rounded-xl transition-colors ${nightActive ? 'text-indigo-200 hover:bg-indigo-900/60' : 'text-slate-600 hover:bg-white'}`}
                title={settings.nightMode ? '日间模式' : '夜间模式'}
              >
                {nightActive ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6 md:py-8 space-y-6">
        <section className={`rounded-3xl p-5 md:p-7 shadow-xl border ${nightActive ? 'bg-gradient-to-br from-indigo-900/60 to-slate-900/80 border-indigo-800/40' : 'bg-white border-slate-200/70 shadow-slate-200/50'}`}>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
            <div className="flex items-center gap-4">
              <div className={`
                w-20 h-20 md:w-24 md:h-24 rounded-3xl flex flex-col items-center justify-center font-black shadow-lg
                ${seat.status === 'abnormal'
                  ? 'bg-gradient-to-br from-red-500 to-rose-600 text-white animate-pulse'
                  : seat.status === 'calling'
                    ? 'bg-gradient-to-br from-amber-400 to-orange-500 text-white animate-pulse-slow'
                    : seat.status === 'processing'
                      ? 'bg-gradient-to-br from-blue-400 to-blue-600 text-white'
                      : seat.status === 'infusing'
                        ? nightActive
                          ? 'bg-gradient-to-br from-emerald-500 to-teal-600 text-white'
                          : 'bg-gradient-to-br from-emerald-400 to-emerald-600 text-white'
                        : nightActive
                          ? 'bg-slate-800 text-slate-300'
                          : 'bg-slate-100 text-slate-500'
                }
              `}>
                <span className="text-2xl md:text-3xl">{seat.number}</span>
                <span className="text-[10px] md:text-xs font-medium opacity-80">号座位</span>
              </div>
              <div className="space-y-2 flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  {seat.patientName ? (
                    <>
                      <User className={`w-5 h-5 ${nightActive ? 'text-indigo-300' : 'text-slate-400'}`} />
                      <span className="text-xl md:text-2xl font-bold">{seat.patientName}</span>
                    </>
                  ) : (
                    <span className={`text-lg ${nightActive ? 'text-indigo-300' : 'text-slate-500'}`}>暂未登记患者</span>
                  )}
                  {seat.isPaused && (
                    <span className={`px-2.5 py-1 rounded-lg text-xs font-bold ${nightActive ? 'bg-slate-700 text-slate-300' : 'bg-slate-100 text-slate-600'}`}>已暂停</span>
                  )}
                </div>
                <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-sm font-bold ${seat.status === 'abnormal'
                  ? 'bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-300'
                  : seat.status === 'calling'
                    ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300'
                    : seat.status === 'processing'
                      ? 'bg-blue-100 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300'
                      : seat.status === 'infusing'
                        ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300'
                        : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                }`}>
                  <span className={`w-2 h-2 rounded-full ${seat.status === 'calling' || seat.status === 'abnormal' ? 'animate-pulse' : ''} ${seat.status === 'abnormal'
                    ? 'bg-red-500'
                    : seat.status === 'calling'
                      ? 'bg-amber-500'
                      : seat.status === 'processing'
                        ? 'bg-blue-500'
                        : seat.status === 'infusing'
                          ? 'bg-emerald-500'
                          : 'bg-slate-400'
                  }`} />
                  {{
                    idle: '空闲中',
                    infusing: '输液进行中',
                    calling: '呼叫已发出',
                    processing: '护士正在赶来',
                    abnormal: '异常情况处理中'
                  }[seat.status]}
                </div>
              </div>
            </div>

            {seat.status === 'infusing' && (
              <div className={`w-full md:w-64 space-y-2 ${nightActive ? '' : ''}`}>
                <div className="flex items-center justify-between text-sm font-bold">
                  <span className={nightActive ? 'text-indigo-200' : 'text-slate-600'}>输液进度</span>
                  <span className="tabular-nums text-emerald-600 dark:text-emerald-400">{infusionProgress.toFixed(0)}%</span>
                </div>
                <div className={`h-4 rounded-full overflow-hidden ${nightActive ? 'bg-slate-800' : 'bg-slate-100'}`}>
                  <div
                    className="h-full bg-gradient-to-r from-emerald-400 via-emerald-500 to-teal-500 rounded-full transition-all duration-1000 shadow-sm shadow-emerald-400/30"
                    style={{ width: `${infusionProgress}%` }}
                  />
                </div>
                <div className={`flex items-center justify-between text-xs ${nightActive ? 'text-indigo-300' : 'text-slate-500'}`}>
                  <span>预计剩余</span>
                  <span className="font-bold tabular-nums">{remainingMinutes > 0 ? `${remainingMinutes}分钟` : '即将完成'}</span>
                </div>
              </div>
            )}
          </div>
        </section>

        {myActiveCalls.length > 0 && (
          <section className={`rounded-3xl p-5 md:p-6 shadow-xl border space-y-4 ${nightActive ? 'bg-gradient-to-br from-blue-900/40 to-indigo-900/40 border-blue-800/30' : 'bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200/60 shadow-blue-100/50'}`}>
            <div className="flex items-center justify-between">
              <h2 className="text-lg md:text-xl font-black flex items-center gap-2">
                <Clock className="w-5 h-5 text-blue-500" />
                当前呼叫状态
              </h2>
              {myQueuePosition !== null && (
                <div className={`flex items-center gap-2 px-4 py-2 rounded-2xl font-black ${nightActive ? 'bg-blue-500/20 text-blue-200' : 'bg-blue-500 text-white shadow-md shadow-blue-500/30'}`}>
                  <ChevronRight className="w-4 h-4 animate-pulse" />
                  <span>队列第 {myQueuePosition} 位</span>
                </div>
              )}
            </div>

            <div className="space-y-3">
              {myActiveCalls.map((call) => {
                const waitTime = now - call.createdAt;
                const timeoutMs = DEFAULT_TIMEOUT_THRESHOLDS[call.priority];
                const progress = Math.min(100, (waitTime / timeoutMs) * 100);
                const isTimeout = call.status === 'pending' && waitTime > timeoutMs;

                return (
                  <div
                    key={call.id}
                    className={`rounded-2xl p-4 border space-y-3 ${call.status === 'accepted'
                      ? nightActive
                        ? 'bg-emerald-900/30 border-emerald-700/40'
                        : 'bg-emerald-50 border-emerald-200'
                      : isTimeout
                        ? nightActive
                          ? 'bg-red-900/30 border-red-700/50'
                          : 'bg-red-50 border-red-200'
                        : nightActive
                          ? 'bg-slate-800/60 border-slate-700'
                          : 'bg-white border-slate-200'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className={`
                          w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-md
                          ${call.priority === 'urgent'
                            ? 'bg-gradient-to-br from-red-500 to-rose-600'
                            : call.priority === 'high'
                              ? 'bg-gradient-to-br from-orange-500 to-amber-600'
                              : call.priority === 'normal'
                                ? 'bg-gradient-to-br from-blue-500 to-indigo-600'
                                : 'bg-gradient-to-br from-slate-500 to-slate-600'
                          }
                        `}>
                          {callButtons.find((b) => b.type === call.type)?.icon || <MoreHorizontal className="w-6 h-6" />}
                        </div>
                        <div>
                          <div className="font-black text-base">{CALL_TYPE_LABELS[call.type]}</div>
                          <div className={`text-xs flex items-center gap-1.5 mt-0.5 flex-wrap ${nightActive ? 'text-indigo-300' : 'text-slate-500'}`}>
                            <span className={`px-1.5 py-0.5 rounded-md text-[10px] font-bold ${call.priority === 'urgent'
                              ? 'bg-red-500 text-white'
                              : call.priority === 'high'
                                ? 'bg-orange-500 text-white'
                                : call.priority === 'normal'
                                  ? 'bg-blue-500 text-white'
                                  : 'bg-slate-500 text-white'
                            }`}>
                              {CALL_PRIORITY_LABELS[call.priority]}优先级
                            </span>
                            {call.abnormalType && <span>· {call.abnormalType}</span>}
                            {call.mergedIntoId && (
                              <span className={`px-1.5 py-0.5 rounded-md text-[10px] font-bold flex items-center gap-0.5 ${nightActive ? 'bg-emerald-500/20 text-emerald-300' : 'bg-emerald-100 text-emerald-700'}`}>
                                <Users className="w-3 h-3" /> 已合并
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={() => cancelCall(call.id)}
                        className={`p-2 rounded-xl transition-all ${nightActive ? 'text-slate-400 hover:bg-slate-700 hover:text-red-400' : 'text-slate-400 hover:bg-red-50 hover:text-red-500'}`}
                        title="取消呼叫"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>

                    <div className="space-y-1.5">
                      <div className={`flex items-center justify-between text-xs font-bold ${nightActive ? 'text-indigo-200' : 'text-slate-600'}`}>
                        <span className="flex items-center gap-1.5">
                          {call.status === 'accepted' ? (
                            <><CheckCircle2 className="w-4 h-4 text-emerald-500" /> 护士已接单，正在赶来</>
                          ) : isTimeout ? (
                            <>等待超时，正在加急处理</>
                          ) : (
                            <><Clock className="w-4 h-4" /> 已等待 {formatWaitTime(waitTime)}</>
                          )}
                        </span>
                        <span className="tabular-nums">{call.acceptedBy ? call.acceptedBy : `预计${Math.ceil((timeoutMs - waitTime) / 60000)}分钟内响应`}</span>
                      </div>
                      <div className={`h-2 rounded-full overflow-hidden ${nightActive ? 'bg-slate-800' : 'bg-slate-100'}`}>
                        <div
                          className={`h-full rounded-full transition-all duration-1000 ${call.status === 'accepted'
                            ? 'bg-gradient-to-r from-emerald-400 to-emerald-600'
                            : isTimeout
                              ? 'bg-gradient-to-r from-red-400 to-red-600 animate-pulse'
                              : 'bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-500'
                          }`}
                          style={{ width: `${call.status === 'accepted' ? 100 : progress}%` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        <section className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-lg md:text-xl font-black flex items-center gap-2">
              <span className={`w-1.5 h-6 rounded-full ${nightActive ? 'bg-indigo-400' : 'bg-blue-500'}`} />
              请选择您的需求
            </h2>
            <p className={`text-xs md:text-sm ${nightActive ? 'text-indigo-300' : 'text-slate-500'}`}>点击按钮一键呼叫护士</p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
            {callButtons.map((btn) => {
              const disabled = seat.status === 'idle' || seat.isPaused;
              const activeForType = myActiveCalls.some((c) => c.type === btn.type);

              return (
                <button
                  key={btn.type}
                  onClick={() => !disabled && !activeForType && handleCall(btn.type)}
                  disabled={disabled || activeForType}
                  className={`
                    group relative overflow-hidden rounded-3xl p-4 md:p-6 text-left
                    transition-all duration-300 transform
                    ${disabled
                      ? 'opacity-40 cursor-not-allowed'
                      : 'hover:scale-[1.03] active:scale-[0.97] cursor-pointer'
                    }
                    ${activeForType ? `ring-4 ${btn.ring}` : ''}
                    bg-gradient-to-br ${btn.gradient} text-white
                    shadow-lg hover:shadow-xl
                  `}
                >
                  <div className="absolute -right-6 -top-6 w-24 h-24 rounded-full bg-white/10 group-hover:scale-150 transition-transform duration-500" />
                  <div className="absolute -right-3 -bottom-3 w-16 h-16 rounded-full bg-white/5" />

                  <div className="relative space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="p-3 rounded-2xl bg-white/20 backdrop-blur-sm">
                        {btn.icon}
                      </div>
                      {activeForType && (
                        <div className="px-2 py-1 rounded-lg bg-white text-slate-800 text-[10px] font-black flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> 已呼叫
                        </div>
                      )}
                    </div>
                    <div>
                      <div className="font-black text-base md:text-lg leading-tight">{btn.label}</div>
                      <div className="text-xs md:text-sm opacity-80 mt-1 leading-snug">{btn.desc}</div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {seat.status === 'idle' && (
            <div className={`text-center rounded-2xl p-4 text-sm ${nightActive ? 'bg-indigo-900/40 text-indigo-200' : 'bg-amber-50 text-amber-700'}`}>
              💡 当前座位尚未开始输液，请联系护士登记后使用呼叫功能
            </div>
          )}
          {seat.isPaused && (
            <div className={`text-center rounded-2xl p-4 text-sm ${nightActive ? 'bg-slate-800/60 text-slate-300' : 'bg-slate-100 text-slate-600'}`}>
              ⏸ 呼叫功能已临时暂停，如需恢复请联系护士
            </div>
          )}
        </section>

        <section className={`rounded-3xl p-5 md:p-6 border ${nightActive ? 'bg-slate-900/50 border-slate-800' : 'bg-white border-slate-200/70 shadow-sm'}`}>
          <h3 className="font-black mb-3 flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${nightActive ? 'bg-indigo-400' : 'bg-blue-500'} animate-pulse`} />
            温馨提示
          </h3>
          <ul className={`space-y-2 text-sm ${nightActive ? 'text-slate-300' : 'text-slate-600'}`}>
            <li className="flex items-start gap-2"><span className="text-emerald-500 font-bold">•</span> 呼叫发出后，护士会按优先级尽快前来，请耐心等待</li>
            <li className="flex items-start gap-2"><span className="text-emerald-500 font-bold">•</span> 情况紧急请选择「身体异常」，会以最高优先级处理</li>
            <li className="flex items-start gap-2"><span className="text-emerald-500 font-bold">•</span> 夜间模式下屏幕亮度降低，减少打扰您的休息</li>
            <li className="flex items-start gap-2"><span className="text-emerald-500 font-bold">•</span> 呼叫误发可以点击状态卡片右上角的 ✕ 取消</li>
          </ul>
        </section>
      </main>

      {showAbnormalPicker && (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-0 md:p-4 bg-black/60 backdrop-blur-sm animate-fade-in" onClick={() => setShowAbnormalPicker(false)}>
          <div
            className={`w-full md:max-w-md rounded-t-3xl md:rounded-3xl p-6 shadow-2xl animate-slide-up md:animate-scale-in ${nightActive ? 'bg-slate-900 border-t md:border border-slate-800' : 'bg-white'}`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="text-xl font-black flex items-center gap-2">
                  <AlertTriangle className="w-6 h-6 text-orange-500" />
                  选择异常类型
                </h3>
                <p className={`text-sm mt-1 ${nightActive ? 'text-slate-400' : 'text-slate-500'}`}>请选择您遇到的具体情况</p>
              </div>
              <button
                onClick={() => setShowAbnormalPicker(false)}
                className={`p-2 rounded-xl transition-colors ${nightActive ? 'hover:bg-slate-800 text-slate-400' : 'hover:bg-slate-100 text-slate-500'}`}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-5">
              {ABNORMAL_TYPES.map((type) => (
                <button
                  key={type}
                  onClick={() => setSelectedAbnormal(type)}
                  className={`
                    p-4 rounded-2xl border-2 font-bold text-sm transition-all text-left
                    ${selectedAbnormal === type
                      ? nightActive
                        ? 'border-orange-500 bg-orange-500/20 text-orange-200'
                        : 'border-orange-500 bg-orange-50 text-orange-700 shadow-md shadow-orange-200'
                      : nightActive
                        ? 'border-slate-700 bg-slate-800/50 text-slate-200 hover:border-slate-600'
                        : 'border-slate-200 bg-slate-50 text-slate-700 hover:border-slate-300 hover:bg-white'
                    }
                  `}
                >
                  {type}
                </button>
              ))}
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowAbnormalPicker(false)}
                className={`flex-1 py-3.5 rounded-2xl font-black transition-colors ${nightActive ? 'bg-slate-800 text-slate-300 hover:bg-slate-700' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}
              >
                取消
              </button>
              <button
                onClick={handleAbnormalSubmit}
                disabled={!selectedAbnormal}
                className={`flex-1 py-3.5 rounded-2xl font-black text-white transition-all ${selectedAbnormal
                  ? 'bg-gradient-to-r from-orange-500 via-red-500 to-rose-600 shadow-lg shadow-orange-500/30 hover:shadow-xl hover:scale-[1.02] active:scale-[0.98]'
                  : 'bg-slate-300 dark:bg-slate-700 cursor-not-allowed'
                }`}
              >
                立即呼叫
              </button>
            </div>
          </div>
        </div>
      )}

      {callFeedback?.show && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none animate-fade-in">
          <div className={`
            px-8 py-6 rounded-3xl shadow-2xl text-center animate-scale-in max-w-sm w-full
            ${callFeedback.mode === 'success'
              ? 'bg-gradient-to-br from-emerald-400 via-emerald-500 to-teal-600 text-white'
              : callFeedback.mode === 'paused'
                ? 'bg-gradient-to-br from-slate-500 via-slate-600 to-slate-700 text-white'
                : callFeedback.mode === 'duplicate'
                  ? 'bg-gradient-to-br from-amber-400 via-orange-500 to-amber-600 text-white'
                  : 'bg-gradient-to-br from-cyan-400 via-blue-500 to-indigo-600 text-white'
            }
          `}>
            {callFeedback.mode === 'success' && (
              <>
                <CheckCircle2 className="w-16 h-16 mx-auto mb-3 animate-bounce" strokeWidth={2.5} />
                <div className="text-2xl font-black mb-1">呼叫已发送 ✨</div>
                <div className="text-white/90">
                  {CALL_TYPE_LABELS[callFeedback.type]}请求已提交
                  <br />
                  护士会尽快前来处理
                </div>
              </>
            )}
            {callFeedback.mode === 'paused' && (
              <>
                <div className="w-16 h-16 mx-auto mb-3 rounded-2xl bg-white/20 flex items-center justify-center">
                  <span className="text-4xl">⏸</span>
                </div>
                <div className="text-2xl font-black mb-2">呼叫已暂停</div>
                <div className="text-white/90 text-base leading-relaxed">
                  {callFeedback.message || '当前座位呼叫功能已临时暂停'}
                  <br />
                  <span className="text-white/70 text-sm">请联系护士恢复后再使用</span>
                </div>
              </>
            )}
            {callFeedback.mode === 'duplicate' && (
              <>
                <div className="w-16 h-16 mx-auto mb-3 rounded-2xl bg-white/20 flex items-center justify-center">
                  <AlertCircle className="w-10 h-10" />
                </div>
                <div className="text-2xl font-black mb-2">已有呼叫等待中</div>
                <div className="text-white/90 text-base leading-relaxed">
                  当前座位已有
                  <span className="font-black px-1.5 py-0.5 rounded bg-white/20 mx-1">
                    {callFeedback.existingType ? CALL_TYPE_LABELS[callFeedback.existingType] : '未处理'}
                  </span>
                  请求
                  <br />
                  <span className="text-white/70 text-sm">请先等待处理完成或取消当前呼叫</span>
                </div>
              </>
            )}
            {callFeedback.mode === 'merged' && (
              <>
                <div className="w-16 h-16 mx-auto mb-3 rounded-2xl bg-white/20 flex items-center justify-center">
                  <Users className="w-10 h-10" />
                </div>
                <div className="text-2xl font-black mb-2">已加入合并队列 👥</div>
                <div className="text-white/90 text-base leading-relaxed">
                  您的{CALL_TYPE_LABELS[callFeedback.type]}请求
                  <br />
                  已与{callFeedback.mergedSeatNumber}号合并处理
                  <br />
                  <span className="text-white/70 text-sm">护士会统一前往，减少您的等待</span>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {completedReceipt && completedReceipt.seatId === seatId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none animate-fade-in">
          <div className="px-8 py-6 rounded-3xl shadow-2xl text-center animate-scale-in bg-gradient-to-br from-blue-400 via-indigo-500 to-purple-600 text-white max-w-sm w-full">
            <Heart className="w-16 h-16 mx-auto mb-3 animate-pulse" fill="white" />
            <div className="text-2xl font-black mb-1">服务已完成 💙</div>
            <div className="text-white/90">
              {CALL_TYPE_LABELS[completedReceipt.type]}已处理完毕
              {completedReceipt.acceptedBy && <><br />处理护士：{completedReceipt.acceptedBy}</>}
            </div>
          </div>
          {(() => { setTimeout(() => setCompletedReceipt(null), 2500); return null; })()}
        </div>
      )}
    </div>
  );
}
