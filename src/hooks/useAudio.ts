import { useCallback, useRef } from 'react';
import { useSettingStore } from '../stores/useSettingStore';

export function useAudio() {
  const audioContextRef = useRef<AudioContext | null>(null);
  const { settings } = useSettingStore();

  const getContext = useCallback(() => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    }
    return audioContextRef.current;
  }, []);

  const playTone = useCallback((frequency: number, duration: number, type: OscillatorType = 'sine') => {
    if (!settings.soundEnabled) return;

    try {
      const ctx = getContext();
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();

      oscillator.type = type;
      oscillator.frequency.setValueAtTime(frequency, ctx.currentTime);

      const volume = settings.soundVolume / 100 * 0.3;
      gainNode.gain.setValueAtTime(volume, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);

      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);

      oscillator.start(ctx.currentTime);
      oscillator.stop(ctx.currentTime + duration);
    } catch (e) {
      console.error('Play sound failed:', e);
    }
  }, [getContext, settings.soundEnabled, settings.soundVolume]);

  const playCallSound = useCallback((urgent = false) => {
    if (!settings.soundEnabled) return;
    const baseFreq = urgent ? 880 : 660;
    setTimeout(() => playTone(baseFreq, 0.15), 0);
    setTimeout(() => playTone(baseFreq * 1.25, 0.15), 180);
    if (urgent) {
      setTimeout(() => playTone(baseFreq * 1.5, 0.2), 360);
    }
  }, [playTone, settings.soundEnabled]);

  const playPatrolSound = useCallback(() => {
    if (!settings.soundEnabled) return;
    setTimeout(() => playTone(523, 0.1), 0);
    setTimeout(() => playTone(659, 0.1), 120);
    setTimeout(() => playTone(784, 0.15), 240);
  }, [playTone, settings.soundEnabled]);

  const playCompleteSound = useCallback(() => {
    if (!settings.soundEnabled) return;
    setTimeout(() => playTone(784, 0.1), 0);
    setTimeout(() => playTone(988, 0.15), 100);
  }, [playTone, settings.soundEnabled]);

  return {
    playCallSound,
    playPatrolSound,
    playCompleteSound
  };
}
