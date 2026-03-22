'use client';

import { ExternalLink, Video, FileText, GraduationCap, BookOpen } from 'lucide-react';

interface Resource {
  title: string;
  url: string;
  snippet?: string;
}

interface ResourceGridProps {
  data: { topic: string; resources: Resource[] };
}

function getIcon(url: string) {
  if (url.includes('youtube')) return <Video className="h-4 w-4 text-red-500" />;
  if (url.includes('coursera') || url.includes('udemy')) return <GraduationCap className="h-4 w-4 text-blue-500" />;
  return <FileText className="h-4 w-4 text-[#497D74]" />;
}

export function ResourceGrid({ data }: ResourceGridProps) {
  return (
    <div className="my-2">
      <div className="flex items-center gap-2 mb-3">
        <BookOpen className="h-5 w-5 text-[#497D74]" />
        <h3 className="font-lexend font-semibold text-[#27445D]">Resources: {data.topic}</h3>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
        {data.resources.map((r, i) => (
          <a key={i} href={r.url} target="_blank" rel="noopener noreferrer"
            className="flex items-start gap-3 p-3 bg-[#FBFAF8] border border-[#D5EBE7] rounded-lg hover:border-[#71BBB2] transition-colors">
            <div className="mt-0.5">{getIcon(r.url)}</div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-[#27445D] truncate">{r.title}</p>
              {r.snippet && <p className="text-xs text-[#538B81] line-clamp-2 mt-1">{r.snippet}</p>}
            </div>
            <ExternalLink className="h-3 w-3 text-[#8AC7C0] shrink-0 mt-1" />
          </a>
        ))}
      </div>
    </div>
  );
}
