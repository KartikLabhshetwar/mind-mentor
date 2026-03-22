'use client';

import { useState } from 'react';
import { FileText, ChevronDown, ChevronUp } from 'lucide-react';

interface PdfResponseProps {
  data: { documentTitle: string; relevantChunks: Array<{ text: string; page: number }> };
}

export function PdfResponse({ data }: PdfResponseProps) {
  const [showSources, setShowSources] = useState(false);

  return (
    <div className="bg-[#FBFAF8] border border-[#D5EBE7] rounded-xl p-4 my-2">
      <div className="flex items-center gap-2 mb-2">
        <FileText className="h-5 w-5 text-[#497D74]" />
        <span className="text-sm font-medium text-[#27445D]">{data.documentTitle}</span>
      </div>
      <button onClick={() => setShowSources(!showSources)}
        className="flex items-center gap-1 text-xs text-[#497D74] hover:text-[#335775]">
        {showSources ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
        {data.relevantChunks.length} sources
      </button>
      {showSources && (
        <div className="mt-2 space-y-2">
          {data.relevantChunks.map((chunk, i) => (
            <div key={i} className="text-xs bg-[#EFE9D5]/50 p-2 rounded border border-[#D5EBE7]">
              <span className="font-medium text-[#497D74]">Page {chunk.page}:</span>{' '}
              <span className="text-[#335775]">{chunk.text.slice(0, 200)}...</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
