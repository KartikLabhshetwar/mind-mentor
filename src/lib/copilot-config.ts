import { CopilotKit } from "@copilotkit/react-core";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY!);

const model = genAI.getGenerativeModel({
  model: "gemini-pro"
});

export const copilotConfig = {
  chatApiEndpoint: "/api/copilotkit",
  model: model,
};