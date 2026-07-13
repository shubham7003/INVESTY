import { ChatGroq } from "@langchain/groq";

export function getModel(role: "fast" | "reasoning") {
  return new ChatGroq({
    model: role === "fast" ? "llama-3.1-8b-instant" : "llama-3.3-70b-versatile",
    apiKey: process.env.GROQ_API_KEY,
    temperature: role === "reasoning" ? 0.3 : 0,
  });
}