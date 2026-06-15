import { useEffect, useState } from 'react';
import { useSeatStore } from '../stores/useSeatStore';
import { useCallStore } from '../stores/useCallStore';
import { usePatrolStore } from '../stores/usePatrolStore';
import { useStatStore } from '../stores/useStatStore';
import { useSettingStore } from '../stores/useSettingStore';
import { useAudio } from '../hooks/useAudio';

import SeatMap from '../components/seat/SeatMap';
import CallQueue from '../components/call/CallQueue';
import PatrolReminder from '../components/patrol/PatrolReminder';
import AbnormalPanel from '../components/abnormal/AbnormalPanel';
import ServiceRecord from '../components/record/ServiceRecord';
import SeatDetailModal from '../components/common/SeatDetailModal';
import CompletionReceipt from '../components/common/CompletionReceipt';
import Header from '../components/common/Header';

import { LayoutGrid, ListTodo, Search, AlertTriangle, FileBarChart } from 'lucide-react';

type TabKey = 'overview' | 'calls' | 'patrol' | 'abnormal' | 'records';

export default function Dashboard() {
  const { seats, selectedSeatId, setSelectedSeat, fetchSeats } = useSeatStore();
  const { calls, getSortedCalls, completedReceipt, fetchCalls, lastCallId } = useCallStore();
  const { patrols, fetchPatrols, duePatrolId } = usePatrolStore();
  const { fetchStatistics, fetchRecords } = useStatStore();
  const { playCallSound, playPatrolSound } = useAudio();

  const [activeTab, setActiveTab] = useState<TabKey>('overview');
  const [dataLoaded, setDataLoaded] = useState(false);
  const prevLastCallRef = useState<string | null>(null);
  const prevDuePatrolRef = useState<string | null>(null);

  useEffect(() => {
    const init = async () => {
      await Promise.all([
        fetchSeats(),
        fetchCalls(),
        fetchPatrols(),
        fetchStatistics(),
        fetchRecords()
      ]);
      setDataLoaded(true);
    };
    init();
  }, [fetchSeats, fetchCalls, fetchPatrols, fetchStatistics, fetchRecords]);

  useEffect(() => {
    if (lastCallId && lastCallId !== prevLastCallRef[0]) {
      prevLastCallRef[0] = lastCallId;
      if (dataLoaded) {
        const hasUrgent = calls.some(c => c.id === lastCallId && c.priority === 'urgent');
        playCallSound(hasUrgent);
      }
    }
  }, [lastCallId, dataLoaded, playCallSound, calls]);

  useEffect(() => {
    if (duePatrolId && duePatrolId !== prevDuePatrolRef[0]) {
      prevDuePatrolRef[0] = duePatrolId;
      if (dataLoaded) playPatrolSound();
    }
  }, [duePatrolId, dataLoaded, playPatrolSound]);

  const selectedSeat = seats.find((s) => s.id === selectedSeatId) || null;
  const activeCalls = getSortedCalls();
  const pendingCount = activeCalls.filter((c) => c.status === 'pending').length;
  const abnormalCalls = activeCalls.filter((c) => c.type === 'abnormal');
  const pendingPatrols = patrols.filter((p) => p.status === 'pending');

  const tabs: { key: TabKey; label: string; icon: React.ReactNode; badge?: number }[] = [
    { key: 'overview', label: '总览', icon: <LayoutGrid className="w-4 h-4" /> },
    { key: 'calls', label: '呼叫队列', icon: <ListTodo className="w-4 h-4" />, badge: pendingCount },
    { key: 'patrol', label: '巡视提醒', icon: <Search className="w-4 h-4" />, badge: pendingPatrols.length },
    { key: 'abnormal', label: '异常处理', icon: <AlertTriangle className="w-4 h-4" />, badge: abnormalCalls.length },
    { key: 'records', label: '服务记录', icon: <FileBarChart className="w-4 h-4" /> }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/50 dark:from-slate-950 dark:via-slate-900 dark:to-indigo-950/30">
      <Header />

      <main className="max-w-[1920px] mx-auto px-4 md:px-6 py-6">
        <div className="mb-6">
          <div className="flex items-center gap-2 p-1.5 bg-white dark:bg-slate-800/80 rounded-2xl shadow-sm border border-slate-200/60 dark:border-slate-700/50 w-fit overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`
                  relative flex items-center gap-2 px-4 md:px-5 py-2.5 rounded-xl text-sm font-bold transition-all whitespace-nowrap
                  ${activeTab === tab.key
                    ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg shadow-blue-500/25 scale-105'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700/50'
                  }
                `}
              >
                {tab.icon}
                {tab.label}
                {tab.badge !== undefined && tab.badge > 0 && (
                  <span className={`
                    ml-1 px-2 py-0.5 rounded-full text-xs font-black tabular-nums min-w-[22px] text-center
                    ${activeTab === tab.key
                      ? 'bg-white/25 text-white'
                      : tab.key === 'abnormal'
                        ? 'bg-red-500 text-white animate-pulse'
                        : 'bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300'
                    }
                  `}>
                    {tab.badge}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            <div className="xl:col-span-2 space-y-6">
              <SeatMap />
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <PatrolReminder />
                <AbnormalPanel />
              </div>
            </div>
            <div className="space-y-6">
              <CallQueue />
            </div>
          </div>
        )}

        {activeTab === 'calls' && <CallQueue />}
        {activeTab === 'patrol' && <PatrolReminder />}
        {activeTab === 'abnormal' && <AbnormalPanel />}
        {activeTab === 'records' && <ServiceRecord />}
      </main>

      {selectedSeat && (
        <SeatDetailModal
          seat={selectedSeat}
          onClose={() => setSelectedSeat(null)}
        />
      )}

      <CompletionReceipt />
    </div>
  );
}
