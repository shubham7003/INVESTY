import { tavily } from "@tavily/core";
import { NewsItem } from "../../types/agent";

const client = tavily({ apiKey: process.env.TAVILY_API_KEY });

export async function getNews(companyName: string): Promise<NewsItem[]> {
  const res = await client.search(`${companyName} recent news financial outlook`, {
    maxResults: 5,
    topic: "news",
  });
  return res.results.map((r) => ({
    title: r.title,
    url: r.url,
    snippet: r.content.slice(0, 300),
  }));
}