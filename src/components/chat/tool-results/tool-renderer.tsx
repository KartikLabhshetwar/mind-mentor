'use client';

import { Loader2 } from 'lucide-react';
import { StudyPlanCard } from './study-plan-card';
import { ResourceGrid } from './resource-grid';
import { PdfResponse } from './pdf-response';
import { StatsWidget } from './stats-widget';

interface ToolRendererProps {
  toolName: string;
  state: string;
  input?: Record<string, unknown>;
  output?: Record<string, unknown>;
}

export function ToolRenderer({ toolName, state, input, output }: ToolRendererProps) {
  if (state === 'input-streaming' || state === 'input-available') {
    return (
      <div className="flex items-center gap-2 text-sm text-[#538B81] py-2">
        <Loader2 className="h-4 w-4 animate-spin" />
        <span>
          {toolName === 'generateStudyPlan' && `Creating study plan for ${(input as any)?.subject || '...'}...`}
          {toolName === 'searchResources' && `Searching resources for ${(input as any)?.topic || '...'}...`}
          {toolName === 'analyzePDF' && 'Analyzing document...'}
          {toolName === 'getStudyStats' && 'Fetching your stats...'}
          {toolName === 'startTimer' && 'Starting timer...'}
          {!['generateStudyPlan', 'searchResources', 'analyzePDF', 'getStudyStats', 'startTimer'].includes(toolName) && 'Working...'}
        </span>
      </div>
    );
  }

  if (state === 'output-error') {
    return <p className="text-sm text-red-500 py-2">Tool error occurred. Please try again.</p>;
  }

  if (state === 'output-available' && output) {
    switch (toolName) {
      case 'generateStudyPlan': return <StudyPlanCard data={output as any} />;
      case 'searchResources': return <ResourceGrid data={output as any} />;
      case 'analyzePDF': return <PdfResponse data={output as any} />;
      case 'getStudyStats': return <StatsWidget data={output as any} />;
      case 'startTimer': return null;
      default: return <pre className="text-xs bg-[#EFE9D5] p-2 rounded">{JSON.stringify(output, null, 2)}</pre>;
    }
  }

  return null;
}
