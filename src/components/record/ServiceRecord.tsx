import { useEffect, useMemo, useState } from 'react';
import { useStatStore } from '../../stores/useStatStore';
import { CallType, CALL_TYPE_LABELS } from '../../types';
import { FileText, Clock, TrendingUp, TrendingDown, BarChart3, UserCheck, AlertCircle, Filter, Calendar, PieChart } from 'lucide-react';

function formatSeconds(sec: number): string {
  if (sec < 60) return `${sec}秒`;
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}分${s > 0 ? `${s}秒` : ''}`;
}

function formatDate(ts: number): string {
  const d = new Date(ts);
  return `${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

const typeColors: Record<string, string> = {
  medication: 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300',
  remove_needle: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300',
  hemostasis: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300',
  consultation: 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300',
  abnormal: 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300',
  other: 'bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-gray-300'
};

export default function ServiceRecord() {
  const { statistics, records, fetchStatistics, fetchRecords } = useStatStore();
  const [filterType, setFilterType] = useState<string>('');
  const [tab, setTab] = useState<'stats' | 'records'>('stats');

  useEffect(() => {
    fetchStatistics();
    fetchRecords();
  }, [fetchStatistics, fetchRecords]);

  useEffect(() => {
    fetchRecords(filterType ? { type: filterType } : undefined);
  }, [filterType, fetchRecords]);

  const maxPeak = useMemo(() => {
    return Math.max(...(statistics?.peakHours.map(p => p.count) || [1]));
  }, [statistics]);

  const maxType = useMemo(() => {
    return Math.max(...(statistics?.typeDistribution.map(t => t.count) || [1]));
  }, [statistics]);

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-xl border border-slate-100 dark:border-slate-800 h-full flex flex-col">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
            <FileText className="w-6 h-6 text-emerald-500" />
            服务记录
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">历史记录与数据分析</p>
        </div>

        <div className="flex gap-2 bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl">
          <button
            onClick={() => setTab('stats')}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${tab === 'stats'
              ? 'bg-white dark:bg-slate-700 text-emerald-600 shadow-md'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <BarChart3 className="w-4 h-4 inline mr-1.5 -mt-0.5" />
            数据统计
          </button>
          <button
            onClick={() => setTab('records')}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${tab === 'records'
              ? 'bg-white dark:bg-slate-700 text-emerald-600 shadow-md'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <FileText className="w-4 h-4 inline mr-1.5 -mt-0.5" />
            详细记录
          </button>
        </div>
      </div>

      {tab === 'stats' ? (
        <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-5 rounded-2xl bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-950/30 dark:to-blue-900/20 border border-blue-100 dark:border-blue-900/30">
              <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 text-sm font-medium mb-2">
                <TrendingUp className="w-4 h-4" />
                今日处理
              </div>
              <div className="text-3xl font-black text-blue-700 dark:text-blue-300">
                {statistics?.todayCompleted ?? 0}
              </div>
              <div className="text-xs text-blue-600/60 mt-1">总计 {statistics?.todayTotal ?? 0} 单</div>
            </div>

            <div className="p-5 rounded-2xl bg-gradient-to-br from-emerald-50 to-emerald-100/50 dark:from-emerald-950/30 dark:to-emerald-900/20 border border-emerald-100 dark:border-emerald-900/30">
              <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 text-sm font-medium mb-2">
                <Clock className="w-4 h-4" />
                平均响应
              </div>
              <div className="text-3xl font-black text-emerald-700 dark:text-emerald-300">
                {formatSeconds(statistics?.avgResponseTime ?? 0)}
              </div>
              <div className="text-xs text-emerald-600/60 mt-1">接单用时</div>
            </div>

            <div className="p-5 rounded-2xl bg-gradient-to-br from-violet-50 to-violet-100/50 dark:from-violet-950/30 dark:to-violet-900/20 border border-violet-100 dark:border-violet-900/30">
              <div className="flex items-center gap-2 text-violet-600 dark:text-violet-400 text-sm font-medium mb-2">
                <UserCheck className="w-4 h-4" />
                平均处理
              </div>
              <div className="text-3xl font-black text-violet-700 dark:text-violet-300">
                {formatSeconds(statistics?.avgProcessTime ?? 0)}
              </div>
              <div className="text-xs text-violet-600/60 mt-1">现场处置时间</div>
            </div>

            <div className="p-5 rounded-2xl bg-gradient-to-br from-red-50 to-red-100/50 dark:from-red-950/30 dark:to-red-900/20 border border-red-100 dark:border-red-900/30">
              <div className="flex items-center gap-2 text-red-600 dark:text-red-400 text-sm font-medium mb-2">
                <AlertCircle className="w-4 h-4" />
                超时数量
              </div>
              <div className="text-3xl font-black text-red-700 dark:text-red-300">
                {statistics?.timeoutCount ?? 0}
              </div>
              <div className="text-xs text-red-600/60 mt-1">需重点关注</div>
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700">
            <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300 font-semibold mb-4">
              <TrendingDown className="w-5 h-5 text-amber-500" />
              高峰时段分布
            </div>
            <div className="flex items-end gap-2 h-32">
              {Array.from({ length: 24 }).map((_, hour) => {
                const peak = statistics?.peakHours.find(p => p.hour === hour);
                const count = peak?.count || 0;
                const height = maxPeak > 0 ? (count / maxPeak) * 100 : 0;
                const isPeak = peak && statistics?.peakHours.indexOf(peak) < 3;
                return (
                  <div key={hour} className="flex-1 flex flex-col items-center gap-1 group">
                    <div className="w-full flex-1 flex items-end">
                      <div
                        className={`w-full rounded-t-lg transition-all duration-500 ${isPeak
                          ? 'bg-gradient-to-t from-amber-400 to-amber-300 shadow-md'
                          : 'bg-gradient-to-t from-slate-300 to-slate-200 dark:from-slate-600 dark:to-slate-500'
                        } group-hover:opacity-80`}
                        style={{ height: `${Math.max(height, 2)}%` }}
                        title={`${hour}:00 - ${count}单`}
                      />
                    </div>
                    <span className={`text-[10px] ${isPeak ? 'text-amber-600 font-bold' : 'text-slate-400'}`}>
                      {hour}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700">
            <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300 font-semibold mb-4">
              <PieChart className="w-5 h-5 text-purple-500" />
              呼叫类型分布
            </div>
            <div className="space-y-3">
              {(statistics?.typeDistribution || []).map(({ type, count }) => (
                <div key={type} className="flex items-center gap-3">
                  <span className={`px-2 py-1 rounded-lg text-xs font-medium w-16 text-center ${typeColors[type] || typeColors.other}`}>
                    {CALL_TYPE_LABELS[type as CallType]}
                  </span>
                  <div className="flex-1 h-6 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-purple-400 to-purple-500 rounded-full transition-all duration-700"
                      style={{ width: `${maxType > 0 ? (count / maxType) * 100 : 0}%` }}
                    />
                  </div>
                  <span className="text-sm font-bold text-slate-700 dark:text-slate-200 w-12 text-right tabular-nums">
                    {count}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex flex-col min-h-0">
          <div className="flex items-center gap-3 mb-4 pb-4 border-b border-slate-100 dark:border-slate-800">
            <Filter className="w-4 h-4 text-slate-400" />
            <span className="text-sm text-slate-600 dark:text-slate-400">类型筛选：</span>
            <div className="flex gap-1.5 flex-wrap">
              <button
                onClick={() => setFilterType('')}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${!filterType
                  ? 'bg-emerald-500 text-white shadow-md'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                }`}
              >
                全部
              </button>
              {Object.entries(CALL_TYPE_LABELS).map(([key, label]) => (
                <button
                  key={key}
                  onClick={() => setFilterType(key)}
                  className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${filterType === key
                    ? 'bg-emerald-500 text-white shadow-md'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-slate-50 dark:bg-slate-800">
                <tr className="text-slate-500 dark:text-slate-400">
                  <th className="text-left py-3 px-2 font-medium"><Calendar className="w-4 h-4 inline mr-1" />时间</th>
                  <th className="text-left py-3 px-2 font-medium">座位</th>
                  <th className="text-left py-3 px-2 font-medium">类型</th>
                  <th className="text-left py-3 px-2 font-medium">响应</th>
                  <th className="text-left py-3 px-2 font-medium">处理</th>
                  <th className="text-left py-3 px-2 font-medium">护士</th>
                </tr>
              </thead>
              <tbody>
                {records.slice(0, 50).map(r => (
                  <tr key={r.id} className="border-b border-slate-50 dark:border-slate-800/50 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="py-2.5 px-2 text-slate-600 dark:text-slate-400 tabular-nums">{formatDate(r.completedAt)}</td>
                    <td className="py-2.5 px-2 font-bold text-slate-800 dark:text-slate-200">{r.seatNumber}</td>
                    <td className="py-2.5 px-2">
                      <span className={`px-2 py-0.5 rounded-md text-xs font-medium ${typeColors[r.callType] || typeColors.other}`}>
                        {CALL_TYPE_LABELS[r.callType]}
                      </span>
                    </td>
                    <td className="py-2.5 px-2 text-slate-600 dark:text-slate-400 tabular-nums">{formatSeconds(r.responseTime)}</td>
                    <td className="py-2.5 px-2 text-slate-600 dark:text-slate-400 tabular-nums">{formatSeconds(r.processTime)}</td>
                    <td className="py-2.5 px-2 text-slate-700 dark:text-slate-300">{r.handledBy || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {records.length === 0 && (
              <div className="text-center text-slate-400 py-12">暂无记录</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
