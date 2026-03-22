'use client';

import { useState, useEffect } from 'react';
import { X, Pause, Play } from 'lucide-react';
import { useAppStore } from '@/store/app-store';

export function TimerWidget() {
  const { timerDuration, timerType, stopTimer } = useAppStore();
  const [secondsLeft, setSecondsLeft] = useState(timerDuration * 60);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    setSecondsLeft(timerDuration * 60);
  }, [timerDuration]);

  useEffect(() => {
    if (paused) return;
    if (secondsLeft <= 0) { stopTimer(); return; }
    const interval = setInterval(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearInterval(interval);
  }, [secondsLeft, paused, stopTimer]);

  const mins = Math.floor(secondsLeft / 60);
  const secs = secondsLeft % 60;

  return (
    <div className="fixed bottom-6 right-6 bg-[#27445D] text-white rounded-full px-4 py-2 flex items-center gap-3 shadow-lg z-50">
      <span className="text-xs uppercase text-[#8AC7C0]">{timerType}</span>
      <span className="font-mono text-lg font-bold">
        {mins.toString().padStart(2, '0')}:{secs.toString().padStart(2, '0')}
      </span>
      <button onClick={() => setPaused(!paused)} className="text-[#A3D3CD] hover:text-white">
        {paused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
      </button>
      <button onClick={stopTimer} className="text-[#A3D3CD] hover:text-white">
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
