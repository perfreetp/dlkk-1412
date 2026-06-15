import { useEffect, useState } from 'react';
import { CheckCircle2, Clock, UserCheck, X } from 'lucide-react';
import { useCallStore } from '../../stores/useCallStore';
import { CALL_TYPE_LABELS } from '../../types';
import { useAudio } from '../../hooks/useAudio';

export default function CompletionReceipt() {
  const { completedReceipt, setCompletedReceipt } = useCallStore();
  const [visible, setVisible] = useState(false);
  const { playCompleteSound } = useAudio();

  useEffect(() => {
    if (completedReceipt) {
      setVisible(true);
      playCompleteSound();
      const t = setTimeout(() => {
        setVisible(false);
        setTimeout(() => setCompletedReceipt(null), 300);
      }, 3500);
      return () => clearTimeout(t);
    }
  }, [completedReceipt, playCompleteSound, setCompletedReceipt]);

  if (!completedReceipt || !visible) return null;

  return (
    <div className={`fixed top-6 right-6 z-50 transition-all duration-300 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'}`}>
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border-2 border-emerald-200 dark:border-emerald-800 p-5 w-80 animate-scale-in">
        <div className="flex items-start gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center flex-shrink-0 shadow-lg shadow-emerald-500/30">
            <CheckCircle2 className="w-8 h-8 text-white animate-bounce-soft" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-lg text-slate-800 dark:text-white">处理完成</h4>
              <button
                onClick={() => { setVisible(false); setTimeout(() => setCompletedReceipt(null), 300); }}
                className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="mt-2 space-y-1.5 text-sm">
              <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                <span className="font-bold text-emerald-600 dark:text-emerald-400">{completedReceipt.seatNumber}号</span>
                <span className="text-slate-400">·</span>
                <span>{CALL_TYPE_LABELS[completedReceipt.type]}</span>
              </div>
              {completedReceipt.acceptedBy && (
                <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
                  <UserCheck className="w-3.5 h-3.5" />
                  {completedReceipt.acceptedBy}
                </div>
              )}
              {completedReceipt.acceptedAt && completedReceipt.completedAt && (
                <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
                  <Clock className="w-3.5 h-3.5" />
                  处理用时 {Math.floor((completedReceipt.completedAt - completedReceipt.acceptedAt) / 1000)}秒
                </div>
              )}
            </div>
          </div>
        </div>
        <div className="mt-4 h-1 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
          <div className="h-full bg-gradient-to-r from-emerald-400 to-emerald-500 rounded-full animate-progress" style={{ animation: 'progress 3.2s linear forwards' }} />
        </div>
        <style>{`
          @keyframes progress {
            from { width: 100%; }
            to { width: 0%; }
          }
        `}</style>
      </div>
    </div>
  );
}
