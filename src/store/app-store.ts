import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type ModelId = 'groq' | 'anthropic' | 'openai';

interface AppStore {
  selectedModel: ModelId;
  setSelectedModel: (model: ModelId) => void;
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  libraryOpen: boolean;
  setLibraryOpen: (open: boolean) => void;
  statsOpen: boolean;
  setStatsOpen: (open: boolean) => void;
  timerActive: boolean;
  timerDuration: number;
  timerType: 'focus' | 'break';
  startTimer: (duration: number, type: 'focus' | 'break') => void;
  stopTimer: () => void;
}

export const useAppStore = create<AppStore>()(
  persist(
    (set) => ({
      selectedModel: 'groq',
      setSelectedModel: (model) => set({ selectedModel: model }),
      sidebarOpen: true,
      setSidebarOpen: (open) => set({ sidebarOpen: open }),
      libraryOpen: false,
      setLibraryOpen: (open) => set({ libraryOpen: open }),
      statsOpen: false,
      setStatsOpen: (open) => set({ statsOpen: open }),
      timerActive: false,
      timerDuration: 25,
      timerType: 'focus',
      startTimer: (duration, type) => set({ timerActive: true, timerDuration: duration, timerType: type }),
      stopTimer: () => set({ timerActive: false }),
    }),
    { name: 'mind-mentor-store' }
  )
);
