'use client';

import { Flame, Clock, Trophy } from 'lucide-react';

interface StatsWidgetProps {
  data: { currentStreak: number; bestStreak: number; totalStudyHours: number };
}

export function StatsWidget({ data }: StatsWidgetProps) {
  return (
    <div className="bg-[#FBFAF8] border border-[#D5EBE7] rounded-xl p-4 my-2">
      <h3 className="font-lexend font-semibold text-[#27445D] mb-3">Your Study Stats</h3>
      <div className="grid grid-cols-3 gap-4">
        <div className="text-center">
          <Flame className="h-6 w-6 text-orange-500 mx-auto mb-1" />
          <p className="text-2xl font-bold text-[#27445D]">{data.currentStreak}</p>
          <p className="text-xs text-[#538B81]">Day Streak</p>
        </div>
        <div className="text-center">
          <Trophy className="h-6 w-6 text-yellow-500 mx-auto mb-1" />
          <p className="text-2xl font-bold text-[#27445D]">{data.bestStreak}</p>
          <p className="text-xs text-[#538B81]">Best Streak</p>
        </div>
        <div className="text-center">
          <Clock className="h-6 w-6 text-[#497D74] mx-auto mb-1" />
          <p className="text-2xl font-bold text-[#27445D]">{data.totalStudyHours}</p>
          <p className="text-xs text-[#538B81]">Total Hours</p>
        </div>
      </div>
    </div>
  );
}
