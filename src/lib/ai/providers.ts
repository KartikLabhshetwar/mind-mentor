import { createGroq } from '@ai-sdk/groq';
import { createAnthropic } from '@ai-sdk/anthropic';
import { createOpenAI } from '@ai-sdk/openai';

const groq = createGroq();
const anthropic = createAnthropic();
const openai = createOpenAI();

export const models = {
  groq: groq('llama-3.3-70b-versatile'),
  anthropic: anthropic('claude-sonnet-4-20250514'),
  openai: openai('gpt-4o'),
} as const;

export type ModelId = keyof typeof models;

export function getModel(id: ModelId) {
  return models[id];
}
