import { create } from 'zustand';
import { SystemSettings, DEFAULT_TIMEOUT_THRESHOLDS } from '../types';

interface SettingStore {
  settings: SystemSettings;
  setSettings: (settings: Partial<SystemSettings>) => void;
  toggleNightMode: () => void;
  toggleSound: () => void;
  isNightModeActive: () => boolean;
}

const STORAGE_KEY = 'infusion-call-settings';

function loadSettings(): SystemSettings {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (e) {
    console.error('Load settings failed:', e);
  }
  return {
    nightMode: false,
    nightModeStart: '22:00',
    nightModeEnd: '06:00',
    soundEnabled: true,
    soundVolume: 70,
    patrolInterval: 30,
    currentNurse: '护士小王',
    timeoutThresholds: { ...DEFAULT_TIMEOUT_THRESHOLDS }
  };
}

export const useSettingStore = create<SettingStore>((set, get) => ({
  settings: loadSettings(),
  setSettings: (partial) =>
    set((state) => {
      const updated = { ...state.settings, ...partial };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      if (updated.nightMode) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
      return { settings: updated };
    }),
  toggleNightMode: () => {
    const { settings, setSettings } = get();
    setSettings({ nightMode: !settings.nightMode });
  },
  toggleSound: () => {
    const { settings, setSettings } = get();
    setSettings({ soundEnabled: !settings.soundEnabled });
  },
  isNightModeActive: () => {
    const { settings } = get();
    if (settings.nightMode) return true;
    const now = new Date();
    const current = now.getHours() * 60 + now.getMinutes();
    const [sh, sm] = settings.nightModeStart.split(':').map(Number);
    const [eh, em] = settings.nightModeEnd.split(':').map(Number);
    const start = sh * 60 + sm;
    const end = eh * 60 + em;
    if (start > end) {
      return current >= start || current < end;
    }
    return current >= start && current < end;
  }
}));

const initSettings = loadSettings();
if (initSettings.nightMode) {
  document.documentElement.classList.add('dark');
}
