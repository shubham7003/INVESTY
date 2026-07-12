import { ChatGoogleGenerativeAI } from "@langchain/google-genai";

export function getModel(role: "fast" | "reasoning") {
  const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY ?? process.env.GOOGLE_API_KEY;
  const model = process.env.GOOGLE_GENERATIVE_AI_MODEL ?? "gemini-3-pro-preview";

  return new ChatGoogleGenerativeAI({
    model,
    apiKey,
    temperature: role === "reasoning" ? 0.3 : 0,
  });
}