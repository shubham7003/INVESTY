import { getModel } from "@/lib/llm/factory";
import { getFinancials } from "@/lib/tools/finance";
import { getNews } from "@/lib/tools/news";
import { Decision, ResearchReport } from "@/types/agent";

export class InvalidCompanyException extends Error {}

export async function runResearchAgent(companyName: string): Promise<ResearchReport> {
  const fast = getModel("fast");
  const reasoning = getModel("reasoning");

  // Step 1: resolve ticker
  const resolveRes = await fast.invoke(
    `What is the stock ticker symbol for "${companyName}"? Reply with ONLY the ticker, nothing else. If this is not a real, publicly traded company, reply "UNKNOWN".`
  );
  const rawContent = resolveRes?.content?.toString?.() ?? String(resolveRes ?? "");
  console.log("RAW TICKER RESPONSE:", JSON.stringify(rawContent));

  // Extract a ticker-like token (e.g. AAPL, BRK.B) from any model response
  const m = rawContent.match(/([A-Z]{1,6}(?:\.[A-Z]{1,4})?)/);
  const ticker = (m ? m[1] : rawContent.trim().toUpperCase().replace(/[^A-Z.]/g, "").slice(0, 6));

  if (ticker === "UNKNOWN" || ticker.length > 6 || !/^[A-Z.]+$/.test(ticker)) {
    throw new InvalidCompanyException(
      `"${companyName}" doesn't look like a valid publicly traded company.`
    );
  }

  // Step 2: gather financials (which also serves as verification) and news
  const [financials, news] = await Promise.all([
    getFinancials(ticker),
    getNews(companyName),
  ]);

  // If we couldn't fetch financials, treat as invalid company
  if (!financials) {
    throw new InvalidCompanyException(
      `"${companyName}" doesn't match any publicly traded company we could find.`
    );
  }

  // Step 3: decide
  const decisionPrompt = `You are an investment analyst. Based on this data, decide INVEST or PASS.

Company: ${companyName}
Financials: ${JSON.stringify(financials)}
Recent news: ${JSON.stringify(news)}

Respond ONLY with valid JSON matching this shape, no markdown fences:
{
  "verdict": "INVEST" or "PASS",
  "confidence": number 0-100,
  "summary": "2-3 sentence summary",
  "reasons": ["reason1", "reason2", ...],
  "risks": ["risk1", "risk2", ...]
}`;

  const decisionRes = await reasoning.invoke(decisionPrompt);
  const raw = decisionRes.content.toString().replace(/```json|```/g, "").trim();
  const decision: Decision = Decision.parse(JSON.parse(raw));

  return ResearchReport.parse({
    companyName,
    ticker,
    financials,
    news,
    decision,
  });
}