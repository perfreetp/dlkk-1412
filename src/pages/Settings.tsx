import { useState } from 'react';
import {
  Settings as SettingsIcon, Moon, Sun, Volume2, VolumeX, Bell, Search,
  Clock, User, AlertTriangle, Save, RotateCcw, ChevronRight, Info, Shield,
  LayoutGrid, Headphones, Heart
} from 'lucide-react';
import { useSettingStore } from '../stores/useSettingStore';
import { useStatStore } from '../stores/useStatStore';
import Header from '../components/common/Header';
import { CALL_PRIORITY_LABELS, CallPriority } from '../types';

export default function Settings() {
  const { settings, setSettings, toggleNightMode, toggleSound, isNightModeActive } = useSettingStore();
  const { fetchStatistics } = useStatStore();
  const [savedTip, setSavedTip] = useState(false);

  const nightActive = isNightModeActive();

  const handleSave = () => {
    setSavedTip(true);
    fetchStatistics();
    setTimeout(() => setSavedTip(false), 2000);
  };

  const handleReset = () => {
    setSettings({
      nightMode: false,
      nightModeStart: '22:00',
      nightModeEnd: '06:00',
      soundEnabled: true,
      soundVolume: 70,
      patrolInterval: 30,
      currentNurse: '护士小王',
      timeoutThresholds: {
        urgent: 2 * 60 * 1000,
        high: 5 * 60 * 1000,
        normal: 8 * 60 * 1000,
        low: 15 * 60 * 1000
      }
    });
  };

  const priorities: { key: CallPriority; desc: string; color: string }[] = [
    { key: 'urgent', desc: '异常反应、过敏等紧急情况', color: 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-900' },
    { key: 'high', desc: '拔针、止血等需要立即响应', color: 'text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-950/40 border-orange-200 dark:border-orange-900' },
    { key: 'normal', desc: '加药、换液等常规操作', color: 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-900' },
    { key: 'low', desc: '咨询、求助等非紧急事项', color: 'text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700' }
  ];

  const msToMin = (ms: number) => Math.round(ms / 60000);
  const minToMs = (min: number) => min * 60 * 1000;

  return (
    <div className={`min-h-screen transition-colors duration-500 ${nightActive
      ? 'bg-gradient-to-br from-slate-950 via-indigo-950/30 to-slate-900 text-slate-100'
      : 'bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/50 text-slate-800'
    }`}>
      <Header />

      <main className="max-w-5xl mx-auto px-4 md:px-6 py-6 md:py-8">
        <div className="flex items-center justify-between mb-6 md:mb-8">
          <div>
            <h1 className="text-2xl md:text-3xl font-black flex items-center gap-3">
              <span className={`p-2.5 rounded-2xl shadow-lg ${nightActive ? 'bg-gradient-to-br from-indigo-500 to-purple-600' : 'bg-gradient-to-br from-blue-500 to-indigo-600 shadow-blue-500/30'}`}>
                <SettingsIcon className="w-6 h-6 md:w-7 md:h-7 text-white" />
              </span>
              系统设置
            </h1>
            <p className={`text-sm md:text-base mt-1.5 ${nightActive ? 'text-indigo-300' : 'text-slate-500'}`}>
              自定义呼叫系统的工作模式与提醒规则
            </p>
          </div>

          <div className="hidden md:flex items-center gap-3">
            <button
              onClick={handleReset}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl font-bold transition-all ${nightActive
                ? 'bg-slate-800/80 text-slate-300 hover:bg-slate-800 border border-slate-700'
                : 'bg-white text-slate-700 hover:bg-slate-50 border border-slate-200 shadow-sm'
              }`}
            >
              <RotateCcw className="w-4 h-4" />
              恢复默认
            </button>
            <button
              onClick={handleSave}
              className="flex items-center gap-2 px-5 py-2.5 rounded-2xl font-bold text-white bg-gradient-to-r from-blue-500 to-indigo-600 shadow-lg shadow-blue-500/30 hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all"
            >
              <Save className="w-4 h-4" />
              保存设置
            </button>
          </div>
        </div>

        {savedTip && (
          <div className="mb-6 px-4 py-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-bold shadow-lg shadow-emerald-500/30 animate-slide-in flex items-center gap-2">
            <ChevronRight className="w-5 h-5" />
            设置已保存，所有更改立即生效
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 md:gap-6">
          <div className="lg:col-span-2 space-y-5 md:space-y-6">
            <section className={`rounded-3xl p-5 md:p-7 shadow-xl border ${nightActive ? 'bg-slate-900/60 border-slate-800' : 'bg-white border-slate-200/70 shadow-slate-200/40'}`}>
              <h2 className="text-lg md:text-xl font-black mb-5 flex items-center gap-2.5">
                <span className={`p-2 rounded-xl ${nightActive ? 'bg-indigo-500/20 text-indigo-300' : 'bg-blue-100 text-blue-600'}`}>
                  <LayoutGrid className="w-5 h-5" />
                </span>
                显示与外观
              </h2>

              <div className="space-y-5">
                <div className={`p-4 md:p-5 rounded-2xl ${nightActive ? 'bg-slate-800/50 border border-slate-700/50' : 'bg-gradient-to-r from-indigo-50 to-blue-50 border border-blue-100'}`}>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1.5">
                        <h3 className="font-black text-base md:text-lg">夜间低打扰模式</h3>
                        <span className={`px-2 py-0.5 rounded-lg text-[11px] font-bold ${nightActive ? 'bg-indigo-500/30 text-indigo-200' : 'bg-blue-500 text-white'}`}>
                          推荐
                        </span>
                      </div>
                      <p className={`text-sm ${nightActive ? 'text-slate-400' : 'text-slate-500'}`}>
                        降低屏幕亮度、减小提示音量、减少动画效果，夜间时段自动开启，为患者创造安静休息环境
                      </p>
                    </div>
                    <button
                      onClick={toggleNightMode}
                      className={`relative flex-shrink-0 w-16 h-9 rounded-full transition-all duration-300 ${settings.nightMode
                        ? 'bg-gradient-to-r from-indigo-500 to-purple-600 shadow-lg shadow-indigo-500/40'
                        : nightActive
                          ? 'bg-slate-700'
                          : 'bg-slate-200'
                      }`}
                    >
                      <span className={`absolute top-1 w-7 h-7 rounded-full flex items-center justify-center transition-all duration-300 ${settings.nightMode
                        ? 'left-8 bg-white text-indigo-600 shadow-md'
                        : 'left-1 bg-white text-slate-500 shadow-md'
                      }`}>
                        {settings.nightMode ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
                      </span>
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-5">
                    <div>
                      <label className={`text-xs font-bold mb-1.5 block ${nightActive ? 'text-indigo-300' : 'text-slate-600'}`}>
                        自动开启时间
                      </label>
                      <div className="relative">
                        <Clock className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${nightActive ? 'text-indigo-400' : 'text-slate-400'}`} />
                        <input
                          type="time"
                          value={settings.nightModeStart}
                          onChange={(e) => setSettings({ nightModeStart: e.target.value })}
                          className={`w-full pl-10 pr-4 py-2.5 rounded-xl font-bold text-base tabular-nums transition-all ${nightActive
                            ? 'bg-slate-800 text-slate-100 border border-slate-700 focus:border-indigo-500'
                            : 'bg-white text-slate-800 border border-slate-200 focus:border-blue-500'
                          } focus:outline-none focus:ring-2 focus:ring-blue-500/20`}
                        />
                      </div>
                    </div>
                    <div>
                      <label className={`text-xs font-bold mb-1.5 block ${nightActive ? 'text-indigo-300' : 'text-slate-600'}`}>
                        自动关闭时间
                      </label>
                      <div className="relative">
                        <Clock className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${nightActive ? 'text-indigo-400' : 'text-slate-400'}`} />
                        <input
                          type="time"
                          value={settings.nightModeEnd}
                          onChange={(e) => setSettings({ nightModeEnd: e.target.value })}
                          className={`w-full pl-10 pr-4 py-2.5 rounded-xl font-bold text-base tabular-nums transition-all ${nightActive
                            ? 'bg-slate-800 text-slate-100 border border-slate-700 focus:border-indigo-500'
                            : 'bg-white text-slate-800 border border-slate-200 focus:border-blue-500'
                          } focus:outline-none focus:ring-2 focus:ring-blue-500/20`}
                        />
                      </div>
                    </div>
                  </div>

                  <div className={`mt-4 px-3 py-2 rounded-xl text-xs flex items-start gap-2 ${nightActive ? 'bg-indigo-500/15 text-indigo-300' : 'bg-blue-50 text-blue-600'}`}>
                    <Info className="w-4 h-4 flex-shrink-0 mt-0.5" />
                    <span>当前状态：<b>{nightActive ? '夜间模式生效中（手动或自动时段）' : settings.nightMode ? '手动开启' : '日间模式'}</b>，时间范围之外会自动恢复日间模式</span>
                  </div>
                </div>
              </div>
            </section>

            <section className={`rounded-3xl p-5 md:p-7 shadow-xl border ${nightActive ? 'bg-slate-900/60 border-slate-800' : 'bg-white border-slate-200/70 shadow-slate-200/40'}`}>
              <h2 className="text-lg md:text-xl font-black mb-5 flex items-center gap-2.5">
                <span className={`p-2 rounded-xl ${nightActive ? 'bg-purple-500/20 text-purple-300' : 'bg-purple-100 text-purple-600'}`}>
                  <Headphones className="w-5 h-5" />
                </span>
                声音提醒
              </h2>

              <div className="space-y-5">
                <div className={`p-4 md:p-5 rounded-2xl ${nightActive ? 'bg-slate-800/50 border border-slate-700/50' : 'bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-100'}`}>
                  <div className="flex items-center justify-between gap-4 mb-5">
                    <div>
                      <h3 className="font-black text-base md:text-lg mb-1">声音提醒开关</h3>
                      <p className={`text-sm ${nightActive ? 'text-slate-400' : 'text-slate-500'}`}>
                        新呼叫、巡视提醒、处理完成等事件的音效提示，关闭后仅屏幕闪烁提醒
                      </p>
                    </div>
                    <button
                      onClick={toggleSound}
                      className={`relative flex-shrink-0 w-16 h-9 rounded-full transition-all duration-300 ${settings.soundEnabled
                        ? 'bg-gradient-to-r from-purple-500 to-pink-600 shadow-lg shadow-purple-500/40'
                        : nightActive
                          ? 'bg-slate-700'
                          : 'bg-slate-200'
                      }`}
                    >
                      <span className={`absolute top-1 w-7 h-7 rounded-full flex items-center justify-center transition-all duration-300 ${settings.soundEnabled
                        ? 'left-8 bg-white text-purple-600 shadow-md'
                        : 'left-1 bg-white text-slate-500 shadow-md'
                      }`}>
                        {settings.soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                      </span>
                    </button>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className={`text-sm font-bold ${nightActive ? 'text-indigo-200' : 'text-slate-700'}`}>
                        提醒音量 <span className={nightActive ? 'text-indigo-400' : 'text-slate-500'}>（影响所有音效）</span>
                      </label>
                      <span className={`px-3 py-1 rounded-xl font-black tabular-nums ${settings.soundEnabled
                        ? nightActive
                          ? 'bg-purple-500/20 text-purple-200'
                          : 'bg-purple-500 text-white'
                        : nightActive
                          ? 'bg-slate-700 text-slate-400'
                          : 'bg-slate-200 text-slate-500'
                      }`}>
                        {settings.soundVolume}%
                      </span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={100}
                      value={settings.soundVolume}
                      onChange={(e) => setSettings({ soundVolume: Number(e.target.value) })}
                      disabled={!settings.soundEnabled}
                      className="w-full h-3 rounded-full appearance-none cursor-pointer accent-purple-500 disabled:opacity-40 disabled:cursor-not-allowed"
                      style={{
                        background: settings.soundEnabled
                          ? `linear-gradient(to right, #a855f7 0%, #ec4899 ${settings.soundVolume}%, ${nightActive ? '#334155' : '#e2e8f0'} ${settings.soundVolume}%, ${nightActive ? '#334155' : '#e2e8f0'} 100%)`
                          : undefined
                      }}
                    />
                    <div className={`flex justify-between text-xs mt-1.5 ${nightActive ? 'text-slate-500' : 'text-slate-400'}`}>
                      <span>静音</span>
                      <span>适中</span>
                      <span>最大</span>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            <section className={`rounded-3xl p-5 md:p-7 shadow-xl border ${nightActive ? 'bg-slate-900/60 border-slate-800' : 'bg-white border-slate-200/70 shadow-slate-200/40'}`}>
              <h2 className="text-lg md:text-xl font-black mb-5 flex items-center gap-2.5">
                <span className={`p-2 rounded-xl ${nightActive ? 'bg-emerald-500/20 text-emerald-300' : 'bg-emerald-100 text-emerald-600'}`}>
                  <Search className="w-5 h-5" />
                </span>
                巡视规则
              </h2>

              <div className={`p-4 md:p-5 rounded-2xl ${nightActive ? 'bg-slate-800/50 border border-slate-700/50' : 'bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-100'}`}>
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <label className={`text-sm font-bold ${nightActive ? 'text-emerald-200' : 'text-slate-700'}`}>
                      巡视周期
                    </label>
                    <span className={`px-3 py-1 rounded-xl font-black tabular-nums ${nightActive ? 'bg-emerald-500/20 text-emerald-200' : 'bg-emerald-500 text-white'}`}>
                      {settings.patrolInterval} 分钟/次
                    </span>
                  </div>
                  <input
                    type="range"
                    min={15}
                    max={60}
                    step={5}
                    value={settings.patrolInterval}
                    onChange={(e) => setSettings({ patrolInterval: Number(e.target.value) })}
                    className="w-full h-3 rounded-full appearance-none cursor-pointer accent-emerald-500"
                    style={{
                      background: `linear-gradient(to right, #10b981 0%, #14b8a6 ${((settings.patrolInterval - 15) / 45) * 100}%, ${nightActive ? '#334155' : '#e2e8f0'} ${((settings.patrolInterval - 15) / 45) * 100}%, ${nightActive ? '#334155' : '#e2e8f0'} 100%)`
                    }}
                  />
                  <div className={`flex justify-between text-xs mt-1.5 ${nightActive ? 'text-slate-500' : 'text-slate-400'}`}>
                    <span>15分钟 高频</span>
                    <span>30分钟 标准</span>
                    <span>60分钟 低频</span>
                  </div>
                </div>

                <div className={`px-3 py-2 rounded-xl text-xs flex items-start gap-2 ${nightActive ? 'bg-emerald-500/15 text-emerald-300' : 'bg-teal-50 text-teal-700'}`}>
                  <Info className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <span>护士端会按照此周期定时弹出巡视提醒，并通过WebSocket广播到所有在线终端。建议繁忙时段设置为15-20分钟。</span>
                </div>
              </div>
            </section>

            <section className={`rounded-3xl p-5 md:p-7 shadow-xl border ${nightActive ? 'bg-slate-900/60 border-slate-800' : 'bg-white border-slate-200/70 shadow-slate-200/40'}`}>
              <h2 className="text-lg md:text-xl font-black mb-2 flex items-center gap-2.5">
                <span className={`p-2 rounded-xl ${nightActive ? 'bg-amber-500/20 text-amber-300' : 'bg-amber-100 text-amber-600'}`}>
                  <Bell className="w-5 h-5" />
                </span>
                超时提醒阈值
              </h2>
              <p className={`text-sm mb-5 -mt-1 ${nightActive ? 'text-slate-400' : 'text-slate-500'}`}>
                呼叫等待超过此时间后，系统将标记为「超时」并升级提醒级别，催促护士尽快处理
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {priorities.map((p) => (
                  <div key={p.key} className={`p-4 rounded-2xl border ${p.color}`}>
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <div className="font-black text-base flex items-center gap-2">
                          {p.key === 'urgent' && <AlertTriangle className="w-4 h-4" />}
                          {CALL_PRIORITY_LABELS[p.key]}优先级
                        </div>
                        <p className="text-xs opacity-80 mt-0.5">{p.desc}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <input
                        type="number"
                        min={1}
                        max={60}
                        value={msToMin(settings.timeoutThresholds[p.key])}
                        onChange={(e) => {
                          const val = Math.max(1, Math.min(60, Number(e.target.value) || 1));
                          setSettings({
                            timeoutThresholds: {
                              ...settings.timeoutThresholds,
                              [p.key]: minToMs(val)
                            }
                          });
                        }}
                        className={`w-20 px-3 py-2 rounded-xl text-center font-black text-lg tabular-nums border-2 focus:outline-none focus:ring-2 focus:ring-offset-1 transition-all ${nightActive
                          ? 'bg-slate-900 text-white border-slate-600 focus:border-blue-500 focus:ring-blue-500/30'
                          : 'bg-white text-slate-800 border-slate-200 focus:border-blue-500 focus:ring-blue-500/30'
                        }`}
                      />
                      <span className="font-bold opacity-80">分钟</span>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section className={`rounded-3xl p-5 md:p-7 shadow-xl border ${nightActive ? 'bg-slate-900/60 border-slate-800' : 'bg-white border-slate-200/70 shadow-slate-200/40'}`}>
              <h2 className="text-lg md:text-xl font-black mb-5 flex items-center gap-2.5">
                <span className={`p-2 rounded-xl ${nightActive ? 'bg-rose-500/20 text-rose-300' : 'bg-rose-100 text-rose-600'}`}>
                  <User className="w-5 h-5" />
                </span>
                当前值班护士
              </h2>

              <div className="flex items-center gap-4">
                <div className="w-16 h-16 md:w-20 md:h-20 rounded-2xl bg-gradient-to-br from-purple-400 via-pink-500 to-rose-500 flex items-center justify-center text-white text-2xl md:text-3xl font-black shadow-lg shadow-rose-500/30">
                  {settings.currentNurse.slice(-2)}
                </div>
                <div className="flex-1">
                  <label className={`text-xs font-bold mb-1.5 block ${nightActive ? 'text-rose-300' : 'text-slate-600'}`}>
                    护士姓名
                  </label>
                  <input
                    type="text"
                    value={settings.currentNurse}
                    onChange={(e) => setSettings({ currentNurse: e.target.value })}
                    placeholder="请输入值班护士姓名"
                    className={`w-full px-4 py-3 rounded-xl font-bold text-base border-2 focus:outline-none focus:ring-2 focus:ring-rose-500/30 transition-all ${nightActive
                      ? 'bg-slate-800 text-white border-slate-700 focus:border-rose-500 placeholder:text-slate-500'
                      : 'bg-slate-50 text-slate-800 border-slate-200 focus:border-rose-500 placeholder:text-slate-400'
                    }`}
                  />
                </div>
              </div>
              <div className={`mt-4 px-3 py-2 rounded-xl text-xs flex items-start gap-2 ${nightActive ? 'bg-rose-500/15 text-rose-300' : 'bg-rose-50 text-rose-700'}`}>
                <Shield className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span>该名称会显示在所有接单记录和患者完成回执中，请确保填写真实姓名以便追溯。</span>
              </div>
            </section>
          </div>

          <div className="space-y-5 md:space-y-6">
            <section className={`rounded-3xl p-5 md:p-6 shadow-xl border ${nightActive ? 'bg-slate-900/60 border-slate-800' : 'bg-white border-slate-200/70 shadow-slate-200/40'}`}>
              <h2 className="text-lg font-black mb-4 flex items-center gap-2">
                <span className={`p-1.5 rounded-lg ${nightActive ? 'bg-cyan-500/20 text-cyan-300' : 'bg-cyan-100 text-cyan-600'}`}>
                  <Info className="w-4 h-4" />
                </span>
                当前配置概览
              </h2>
              <div className="space-y-2">
                {[
                  { label: '夜间模式', value: nightActive ? '生效中 🌙' : '日间 ☀️', color: nightActive ? 'text-indigo-400' : 'text-amber-500' },
                  { label: '声音提醒', value: settings.soundEnabled ? `${settings.soundVolume}% 🔔` : '静音 🔕', color: settings.soundEnabled ? 'text-purple-500' : 'text-slate-400' },
                  { label: '巡视周期', value: `${settings.patrolInterval}分钟`, color: 'text-emerald-500' },
                  { label: '值班护士', value: settings.currentNurse, color: 'text-rose-500' },
                  { label: '夜间时段', value: `${settings.nightModeStart} - ${settings.nightModeEnd}`, color: 'text-blue-500' }
                ].map((item, i) => (
                  <div key={i} className={`flex items-center justify-between py-2.5 px-3 rounded-xl text-sm ${nightActive ? 'bg-slate-800/50' : 'bg-slate-50'}`}>
                    <span className={nightActive ? 'text-slate-400' : 'text-slate-600'}>{item.label}</span>
                    <span className={`font-black ${item.color}`}>{item.value}</span>
                  </div>
                ))}
              </div>
            </section>

            <section className={`rounded-3xl p-5 md:p-6 shadow-xl border overflow-hidden relative ${nightActive ? 'bg-gradient-to-br from-blue-900/40 to-indigo-900/40 border-blue-800/40' : 'bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-600 border-transparent'}`}>
              <div className="absolute -right-8 -top-8 w-40 h-40 rounded-full bg-white/10" />
              <div className="absolute -right-4 -bottom-10 w-32 h-32 rounded-full bg-white/5" />
              <div className="relative">
                <h3 className="text-lg font-black text-white mb-2 flex items-center gap-2">
                  <Heart className="w-5 h-5" fill="white" />
                  快速操作
                </h3>
                <p className="text-sm text-white/80 mb-4">
                  快捷切换常用模式，一键调整到最佳工作状态
                </p>
                <div className="space-y-2.5">
                  <button
                    onClick={() => setSettings({
                      nightMode: false,
                      soundEnabled: true,
                      soundVolume: 80,
                      patrolInterval: 20,
                      timeoutThresholds: { urgent: 2 * 60 * 1000, high: 5 * 60 * 1000, normal: 8 * 60 * 1000, low: 15 * 60 * 1000 }
                    })}
                    className="w-full px-4 py-2.5 rounded-xl bg-white/15 hover:bg-white/25 text-white font-bold text-sm backdrop-blur-sm transition-all text-left flex items-center justify-between group"
                  >
                    <span>☀️ 白天高峰模式</span>
                    <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                  </button>
                  <button
                    onClick={() => setSettings({
                      nightMode: true,
                      soundEnabled: true,
                      soundVolume: 40,
                      patrolInterval: 30,
                      timeoutThresholds: { urgent: 2 * 60 * 1000, high: 6 * 60 * 1000, normal: 10 * 60 * 1000, low: 20 * 60 * 1000 }
                    })}
                    className="w-full px-4 py-2.5 rounded-xl bg-white/15 hover:bg-white/25 text-white font-bold text-sm backdrop-blur-sm transition-all text-left flex items-center justify-between group"
                  >
                    <span>🌙 夜间低打扰模式</span>
                    <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                  </button>
                  <button
                    onClick={() => setSettings({
                      nightMode: false,
                      soundEnabled: true,
                      soundVolume: 100,
                      patrolInterval: 15,
                      timeoutThresholds: { urgent: 1 * 60 * 1000, high: 3 * 60 * 1000, normal: 5 * 60 * 1000, low: 10 * 60 * 1000 }
                    })}
                    className="w-full px-4 py-2.5 rounded-xl bg-white/15 hover:bg-white/25 text-white font-bold text-sm backdrop-blur-sm transition-all text-left flex items-center justify-between group"
                  >
                    <span>🚨 应急响应模式</span>
                    <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                  </button>
                </div>
              </div>
            </section>

            <section className={`rounded-3xl p-5 md:p-6 shadow-xl border ${nightActive ? 'bg-slate-900/60 border-slate-800' : 'bg-white border-slate-200/70 shadow-slate-200/40'}`}>
              <h3 className="font-black mb-3 flex items-center gap-2 text-base">
                <AlertTriangle className={`w-4 h-4 ${nightActive ? 'text-amber-400' : 'text-amber-500'}`} />
                使用说明
              </h3>
              <ul className={`space-y-2 text-xs leading-relaxed ${nightActive ? 'text-slate-400' : 'text-slate-600'}`}>
                <li className="flex items-start gap-2"><span className="text-emerald-500 font-black mt-0.5">▸</span><span>设置修改<b>实时生效</b>，无需刷新页面即可应用到所有模块</span></li>
                <li className="flex items-start gap-2"><span className="text-emerald-500 font-black mt-0.5">▸</span><span>设置保存在<b>本地浏览器</b>中，切换设备需要重新配置</span></li>
                <li className="flex items-start gap-2"><span className="text-emerald-500 font-black mt-0.5">▸</span><span>超时阈值<b>影响队列排序</b>，超时呼叫将自动升级并闪烁提醒</span></li>
                <li className="flex items-start gap-2"><span className="text-emerald-500 font-black mt-0.5">▸</span><span>如遇异常请先尝试「<b>恢复默认</b>」，通常能解决大部分问题</span></li>
              </ul>
            </section>

            <div className="md:hidden fixed bottom-0 left-0 right-0 p-4 z-30 backdrop-blur-xl bg-white/80 dark:bg-slate-900/80 border-t border-slate-200 dark:border-slate-800 flex gap-3">
              <button
                onClick={handleReset}
                className={`flex-1 py-3 rounded-2xl font-bold transition-all ${nightActive ? 'bg-slate-800 text-slate-300' : 'bg-slate-100 text-slate-700'}`}
              >
                <RotateCcw className="w-4 h-4 inline mr-1" />
                恢复默认
              </button>
              <button
                onClick={handleSave}
                className="flex-[1.5] py-3 rounded-2xl font-bold text-white bg-gradient-to-r from-blue-500 to-indigo-600 shadow-lg shadow-blue-500/30"
              >
                <Save className="w-4 h-4 inline mr-1" />
                保存设置
              </button>
            </div>
          </div>
        </div>

        <div className="h-24 md:h-0" />
      </main>
    </div>
  );
}
