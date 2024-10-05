import { CopilotRuntime, GoogleGenerativeAIAdapter } from "@copilotkit/runtime";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextRequest } from "next/server";

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY!);

const model = genAI.getGenerativeModel({
  model: "gemini-pro"
});

const llmAdapter = new GoogleGenerativeAIAdapter({ model });

const runtime = new CopilotRuntime({
  llms: [llmAdapter],
});

export async function POST(req: NextRequest) {
  const { handleRequest } = runtime.createHandler({
    endpoint: "/api/ask-question",
  });

  return handleRequest(req);
}