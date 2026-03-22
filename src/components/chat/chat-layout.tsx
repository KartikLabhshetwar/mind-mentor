'use client';

import { AppSidebar } from '@/components/sidebar/app-sidebar';
import { LibraryPanel } from '@/components/panels/library-panel';
import { StatsPanel } from '@/components/panels/stats-panel';
import { TimerWidget } from '@/components/widgets/timer-widget';
import { useAppStore } from '@/store/app-store';

interface ChatLayoutProps {
  conversations: Array<{ _id: string; title: string; createdAt: string }>;
  children: React.ReactNode;
}

export function ChatLayout({ conversations, children }: ChatLayoutProps) {
  const {
    selectedModel, setSelectedModel,
    libraryOpen, setLibraryOpen,
    statsOpen, setStatsOpen,
    timerActive, startTimer,
  } = useAppStore();

  return (
    <div className="flex h-screen w-full">
      <AppSidebar
        conversations={conversations}
        selectedModel={selectedModel}
        onModelChange={setSelectedModel}
        onOpenLibrary={() => setLibraryOpen(true)}
        onOpenStats={() => setStatsOpen(true)}
        onOpenTimer={() => startTimer(25, 'focus')}
      />
      <main className="flex-1 flex flex-col overflow-hidden">
        {children}
      </main>
      <LibraryPanel open={libraryOpen} onClose={() => setLibraryOpen(false)} />
      <StatsPanel open={statsOpen} onClose={() => setStatsOpen(false)} />
      {timerActive && <TimerWidget />}
    </div>
  );
}
