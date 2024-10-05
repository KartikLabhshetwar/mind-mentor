import {
  CopilotRuntime,
  GoogleGenerativeAIAdapter,
  copilotRuntimeNextJSAppRouterEndpoint,
} from '@copilotkit/runtime';
import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextRequest } from 'next/server';

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY!);

const model = genAI.getGenerativeModel({
  model: "gemini-pro"
});


const llmAdapter = new GoogleGenerativeAIAdapter({ 
  model,
  requestOptions: {
    temperature: 0.5,
  },
  maxOutputTokens: 1000,
  maxInputTokens: 1000,
  maxTokens: 1000,
  topP: 0.95,
  topK: 1,
  frequencyPenalty: 0,
  presencePenalty: 0,
  stopSequences: [],
  safetySettings: [],
  responseMIMEType: 'text/plain',
  promptTruncation: 'auto',
});

const runtime = new CopilotRuntime();

export const POST = async (req: NextRequest) => {
  const { handleRequest } = copilotRuntimeNextJSAppRouterEndpoint({
    runtime,
    serviceAdapter: llmAdapter,
    endpoint: '/api/copilotkit',
  });

  return handleRequest(req);
};