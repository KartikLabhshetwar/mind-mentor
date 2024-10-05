import {
  CopilotRuntime,
  GoogleGenerativeAIAdapter,
  copilotRuntimeNextJSAppRouterEndpoint,
} from '@copilotkit/runtime';
import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextRequest } from 'next/server';

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY!);

const llmAdapter = new GoogleGenerativeAIAdapter({ 
  model: genAI.getGenerativeModel({ model: "gemini-1.5-pro" }),
  generationConfig: {
    temperature: 0.5,
    maxOutputTokens: 1024,
    topP: 0.95,
    topK: 1,
  },
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