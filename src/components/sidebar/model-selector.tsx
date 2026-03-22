'use client';

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export type ModelId = 'groq' | 'anthropic' | 'openai';

interface ModelSelectorProps {
  value: ModelId;
  onChange: (value: ModelId) => void;
}

export function ModelSelector({ value, onChange }: ModelSelectorProps) {
  return (
    <Select value={value} onValueChange={(v) => onChange(v as ModelId)}>
      <SelectTrigger className="w-full bg-[#2D4D69] border-[#497D74] text-[#D5EBE7]">
        <SelectValue />
      </SelectTrigger>
      <SelectContent className="bg-[#27445D] border-[#497D74]">
        <SelectItem value="groq" className="text-[#D5EBE7] focus:bg-[#335775] focus:text-white">Groq (Llama 3.3)</SelectItem>
        <SelectItem value="anthropic" className="text-[#D5EBE7] focus:bg-[#335775] focus:text-white">Claude (Sonnet)</SelectItem>
        <SelectItem value="openai" className="text-[#D5EBE7] focus:bg-[#335775] focus:text-white">GPT-4o</SelectItem>
      </SelectContent>
    </Select>
  );
}
