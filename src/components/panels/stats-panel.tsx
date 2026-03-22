'use client';

import { useEffect, useState } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Flame, Clock, Trophy } from 'lucide-react';

interface StatsPanelProps {
  open: boolean;
  onClose: () => void;
}

export function StatsPanel({ open, onClose }: StatsPanelProps) {
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    if (open) {
      fetch('/api/users/stats').then(r => r.json()).then(setStats).catch(() => {});
    }
  }, [open]);

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent className="bg-[#FBFAF8] border-l border-[#D5EBE7] w-[400px]">
        <SheetHeader>
          <SheetTitle className="font-lexend text-[#27445D]">Study Stats</SheetTitle>
        </SheetHeader>
        {stats ? (
          <div className="mt-6 space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white border border-[#D5EBE7] rounded-xl p-4 text-center">
                <Flame className="h-8 w-8 text-orange-500 mx-auto mb-2" />
                <p className="text-3xl font-bold text-[#27445D]">{stats.currentStreak || 0}</p>
                <p className="text-xs text-[#538B81]">Current Streak</p>
              </div>
              <div className="bg-white border border-[#D5EBE7] rounded-xl p-4 text-center">
                <Trophy className="h-8 w-8 text-yellow-500 mx-auto mb-2" />
                <p className="text-3xl font-bold text-[#27445D]">{stats.bestStreak || 0}</p>
                <p className="text-xs text-[#538B81]">Best Streak</p>
              </div>
              <div className="bg-white border border-[#D5EBE7] rounded-xl p-4 text-center col-span-2">
                <Clock className="h-8 w-8 text-[#497D74] mx-auto mb-2" />
                <p className="text-3xl font-bold text-[#27445D]">{stats.totalStudyHours || 0}</p>
                <p className="text-xs text-[#538B81]">Total Study Hours</p>
              </div>
            </div>
          </div>
        ) : (
          <p className="text-sm text-[#8AC7C0] mt-4">Loading...</p>
        )}
      </SheetContent>
    </Sheet>
  );
}
