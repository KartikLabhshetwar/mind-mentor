'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp, BookOpen, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface StudyPlanCardProps {
  data: {
    subject: string;
    durationWeeks: number;
    hoursPerDay: number;
    examDate?: string | null;
    status: string;
  };
}

export function StudyPlanCard({ data }: StudyPlanCardProps) {
  const [expanded, setExpanded] = useState(true);

  return (
    <div className="bg-[#FBFAF8] border border-[#D5EBE7] rounded-xl p-4 my-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BookOpen className="h-5 w-5 text-[#497D74]" />
          <h3 className="font-lexend font-semibold text-[#27445D]">
            Study Plan: {data.subject}
          </h3>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" className="text-[#497D74] hover:text-[#335775]">
            <Save className="h-4 w-4 mr-1" /> Save
          </Button>
          <button onClick={() => setExpanded(!expanded)} className="text-[#497D74]">
            {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>
        </div>
      </div>
      {expanded && (
        <div className="mt-3 text-sm text-[#335775] space-y-1">
          <p><strong>Duration:</strong> {data.durationWeeks} weeks</p>
          <p><strong>Daily Hours:</strong> {data.hoursPerDay}h</p>
          {data.examDate && <p><strong>Exam Date:</strong> {data.examDate}</p>}
        </div>
      )}
    </div>
  );
}
