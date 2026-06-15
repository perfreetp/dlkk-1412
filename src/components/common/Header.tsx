import { Link, useLocation } from 'react-router-dom';
import { Heart, Monitor, User, Settings, Moon, Sun, Volume2, VolumeX, Bell } from 'lucide-react';
import { useSettingStore } from '../../stores/useSettingStore';
import { useCallStore } from '../../stores/useCallStore';
import { useEffect, useState } from 'react';

export default function Header() {
  const { settings, toggleNightMode, toggleSound } = useSettingStore();
  const { getSortedCalls } = useCallStore();
  const location = useLocation();
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const activeCalls = getSortedCalls();
  const pendingCount = activeCalls.filter(c => c.status === 'pending').length;
  const urgentCount = activeCalls.filter(c => c.priority === 'urgent' && c.status === 'pending').length;

  const navItems = [
    { path: '/', label: '护士控制台', icon: <Monitor className="w-4 h-4" /> },
    { path: '/patient/seat-0-0', label: '患者端示例', icon: <User className="w-4 h-4" /> },
    { path: '/settings', label: '系统设置', icon: <Settings className="w-4 h-4" /> },
  ];

  return (
    <header className="sticky top-0 z-40 glass-effect border-b border-slate-200/50 dark:border-slate-800/50">
      <div className="max-w-[1920px] mx-auto px-6 py-4">
        <div className="flex items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <Link to="/" className="flex items-center gap-3 group">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-blue-500 via-blue-600 to-purple-600 flex items-center justify-center shadow-lg shadow-blue-500/30 group-hover:scale-110 transition-transform">
                <Heart className="w-6 h-6 text-white" fill="white" />
              </div>
              <div>
                <h1 className="text-xl font-black text-slate-800 dark:text-white tracking-tight">
                  输液智能呼叫系统
                </h1>
                <p className="text-xs text-slate-500 dark:text-slate-400">Infusion Call Center</p>
              </div>
            </Link>

            <nav className="hidden md:flex items-center gap-1 ml-6 bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl">
              {navItems.map(item => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all flex items-center gap-2 ${
                    location.pathname === item.path || (item.path !== '/' && item.path !== '/settings' && location.pathname.startsWith('/patient'))
                      ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-md'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                >
                  {item.icon}
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>

          <div className="flex items-center gap-4">
            {pendingCount > 0 && (
              <div className={`hidden sm:flex items-center gap-2 px-4 py-2 rounded-2xl ${urgentCount > 0
                ? 'bg-red-500 text-white animate-pulse'
                : 'bg-amber-100 dark:bg-amber-950/30 text-amber-700 dark:text-amber-300'
              }`}>
                <Bell className={`w-4 h-4 ${urgentCount > 0 ? '' : ''}`} />
                <span className="text-sm font-bold tabular-nums">{pendingCount} 待处理</span>
                {urgentCount > 0 && <span className="text-xs font-bold px-1.5 py-0.5 rounded-md bg-white/20">{urgentCount}紧急</span>}
              </div>
            )}

            <div className="hidden lg:flex flex-col items-end">
              <div className="text-lg font-bold text-slate-800 dark:text-white tabular-nums">
                {String(now.getHours()).padStart(2, '0')}:{String(now.getMinutes()).padStart(2, '0')}:{String(now.getSeconds()).padStart(2, '0')}
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400">
                {now.getFullYear()}年{now.getMonth() + 1}月{now.getDate()}日 {['周日','周一','周二','周三','周四','周五','周六'][now.getDay()]}
              </div>
            </div>

            <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl">
              <button
                onClick={toggleSound}
                className="p-2.5 rounded-xl text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-white dark:hover:bg-slate-700 transition-all"
                title={settings.soundEnabled ? '关闭声音' : '开启声音'}
              >
                {settings.soundEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
              </button>
              <button
                onClick={toggleNightMode}
                className="p-2.5 rounded-xl text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-white dark:hover:bg-slate-700 transition-all"
                title={settings.nightMode ? '日间模式' : '夜间模式'}
              >
                {settings.nightMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </button>
            </div>

            <div className="hidden sm:flex items-center gap-3 pl-4 border-l border-slate-200 dark:border-slate-700">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-purple-400 to-pink-500 flex items-center justify-center text-white font-bold shadow-md">
                {settings.currentNurse.slice(-2)}
              </div>
              <div className="hidden xl:block">
                <div className="text-sm font-semibold text-slate-800 dark:text-white">{settings.currentNurse}</div>
                <div className="text-xs text-slate-500 dark:text-slate-400">值班中</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
