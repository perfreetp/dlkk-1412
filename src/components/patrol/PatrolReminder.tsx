import { useEffect, useState } from 'react';
import { usePatrolStore } from '../../stores/usePatrolStore';
import { useSettingStore } from '../../stores/useSettingStore';
import { PatrolTask } from '../../types';
import { Search, Check, Clock, MapPin, SkipForward, Bell } from 'lucide-react';
import { useAudio } from '../../hooks/useAudio';

function formatTime(ts: number): string {
  const d = new Date(ts);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

function formatRelative(ts: number, now: number): string {
  const diff = ts - now;
  const absMin = Math.abs(Math.floor(diff / 60000));
  if (diff > 0) return `${absMin}分钟后`;
  if (diff < -60000) return `${absMin}分钟前`;
  return '现在';
}

function PatrolItem({ task, now, onComplete, onSkip }: {
  task: PatrolTask;
  now: number;
  onComplete: () => void;
  onSkip: () => void;
}) {
  const isDue = task.status === 'pending' && task.scheduledTime <= now;
  const isUpcoming = task.status === 'pending' && task.scheduledTime > now;

  return (
    <div className={`
      relative pl-12 pb-6 last:pb-0
      ${task.status !== 'completed' ? '' : ''}
    `}>
      <div className={`
        absolute left-2 top-0 w-8 h-8 rounded-full flex items-center justify-center
        transition-all duration-300
        ${task.status === 'completed'
          ? 'bg-emerald-500 text-white'
          : isDue
            ? 'bg-blue-500 text-white animate-pulse shadow-lg shadow-blue-500/50'
            : isUpcoming
              ? 'bg-slate-200 dark:bg-slate-700 text-slate-500'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
        }
      `}>
        {task.status === 'completed' ? (
          <Check className="w-4 h-4" />
        ) : task.status === 'skipped' ? (
          <SkipForward className="w-4 h-4" />
        ) : (
          <Search className="w-4 h-4" />
        )}
      </div>

      {task.status !== 'completed' && task.status !== 'skipped' && (
        <div className={`absolute left-[15px] top-8 bottom-0 w-0.5 ${isDue ? 'bg-blue-300' : 'bg-slate-200 dark:bg-slate-700'}`} />
      )}

      <div className={`
        p-4 rounded-2xl transition-all duration-300
        ${task.status === 'completed'
          ? 'bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/50'
          : task.status === 'skipped'
            ? 'bg-slate-50 dark:bg-slate-800/30 border border-slate-200 dark:border-slate-700 opacity-60'
            : isDue
              ? 'bg-blue-50 dark:bg-blue-950/30 border-2 border-blue-300 dark:border-blue-700 shadow-lg shadow-blue-500/10'
              : 'bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700'
        }
      `}>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Clock className={`w-4 h-4 ${isDue ? 'text-blue-500' : 'text-slate-400'}`} />
            <span className={`font-bold tabular-nums ${isDue ? 'text-blue-700 dark:text-blue-300' : 'text-slate-700 dark:text-slate-200'}`}>
              {formatTime(task.scheduledTime)}
            </span>
            <span className={`text-xs px-2 py-0.5 rounded-full ${isDue
              ? 'bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 font-medium'
              : 'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400'
            }`}>
              {formatRelative(task.scheduledTime, now)}
            </span>
          </div>
          {task.status === 'skipped' && (
            <span className="text-xs text-slate-500">已跳过</span>
          )}
        </div>

        <div className="flex items-center gap-2 mb-3">
          <MapPin className={`w-4 h-4 ${task.status === 'completed' ? 'text-emerald-500' : 'text-slate-500'}`} />
          <span className={`font-medium ${task.status === 'completed' ? 'text-emerald-700 dark:text-emerald-300' : 'text-slate-800 dark:text-slate-100'}`}>
            {task.area}
          </span>
        </div>

        {task.completedBy && (
          <div className="text-xs text-slate-500 mb-3">
            {task.completedBy} · {formatTime(task.completedAt!)} 完成
          </div>
        )}

        {task.status === 'pending' && (
          <div className="flex gap-2">
            <button
              onClick={onComplete}
              className={`flex-1 py-2 rounded-xl font-semibold text-sm transition-all hover:scale-[1.02] active:scale-95 ${isDue
                ? 'bg-blue-500 hover:bg-blue-600 text-white shadow-lg shadow-blue-500/30'
                : 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-md'
              }`}
            >
              标记已巡视
            </button>
            <button
              onClick={onSkip}
              className="px-4 py-2 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-600 dark:text-slate-300 rounded-xl text-sm transition-all"
            >
              跳过
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function PatrolReminder() {
  const { patrols, duePatrolId, completePatrol, skipPatrol } = usePatrolStore();
  const { settings } = useSettingStore();
  const { playPatrolSound } = useAudio();
  const [now, setNow] = useState(Date.now());
  const [notifiedId, setNotifiedId] = useState<string | null>(null);

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (duePatrolId && duePatrolId !== notifiedId) {
      playPatrolSound();
      setNotifiedId(duePatrolId);
    }
  }, [duePatrolId, notifiedId, playPatrolSound]);

  const sorted = [...patrols].sort((a, b) => a.scheduledTime - b.scheduledTime);
  const completedCount = sorted.filter(p => p.status === 'completed').length;
  const pendingCount = sorted.filter(p => p.status === 'pending').length;

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-xl border border-slate-100 dark:border-slate-800 h-full flex flex-col">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
            <Bell className="w-6 h-6 text-purple-500" />
            巡视提醒
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">按时巡视确保输液安全</p>
        </div>
        <div className="flex gap-3">
          <div className="px-4 py-2 bg-emerald-50 dark:bg-emerald-950/30 rounded-xl text-center">
            <div className="text-2xl font-bold text-emerald-600">{completedCount}</div>
            <div className="text-xs text-emerald-600/70">已完成</div>
          </div>
          <div className="px-4 py-2 bg-slate-100 dark:bg-slate-800 rounded-xl text-center">
            <div className="text-2xl font-bold text-slate-600 dark:text-slate-300">{pendingCount}</div>
            <div className="text-xs text-slate-500">待巡视</div>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
        {sorted.length === 0 ? (
          <div className="text-center text-slate-400 py-8">暂无巡视任务</div>
        ) : (
          sorted.map(task => (
            <PatrolItem
              key={task.id}
              task={task}
              now={now}
              onComplete={() => completePatrol(task.id, settings.currentNurse)}
              onSkip={() => skipPatrol(task.id)}
            />
          ))
        )}
      </div>
    </div>
  );
}
