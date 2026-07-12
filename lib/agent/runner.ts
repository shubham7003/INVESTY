import { getModel } from "@/lib/llm/factory";
import { getFinancials } from "@/lib/tools/finance";
import { getNews } from "@/lib/tools/news";
import { Decision, ResearchReport } from "@/types/agent";

function buildFallbackDecision(companyName: string, financials: ResearchReport["financials"], news: ResearchReport["news"]): Decision {
  const reasons: string[] = [];
  const risks: string[] = ["Gemini model quota was unavailable, so this report used fallback heuristics."];
  const hasProfitMargin = financials?.profitMargin !== null && financials?.profitMargin !== undefined;

  if (hasProfitMargin) {
    reasons.push(`Profit margin data is available at ${financials?.profitMargin}.`);
  } else {
    risks.push("Financial snapshot is incomplete.");
  }

  if (news.length > 0) {
    reasons.push(`Collected ${news.length} recent news item${news.length === 1 ? "" : "s"}.`);
  } else {
    risks.push("No recent news items were returned.");
  }

  const investCandidate = hasProfitMargin && (financials?.profitMargin ?? 0) > 0 && news.length > 0;

  return {
    verdict: investCandidate ? "INVEST" : "PASS",
    confidence: investCandidate ? 62 : 44,
    summary: `${companyName} was analyzed with a fallback rule set because the Gemini request was rate-limited.`,
    reasons: reasons.length > 0 ? reasons : ["Fallback analysis completed using available market data."],
    risks,
  };
}

export async function runResearchAgent(companyName: string): Promise<ResearchReport> {
  const fast = getModel("fast");
  const reasoning = getModel("reasoning");

  let validTicker: string | null = null;

  try {
    const resolveRes = await fast.invoke(
      `What is the stock ticker symbol for "${companyName}"? Reply with ONLY the ticker, nothing else. If unknown, reply "UNKNOWN".`
    );
    const ticker = resolveRes.content.toString().trim().toUpperCase();
    validTicker = ticker !== "UNKNOWN" ? ticker : null;
  } catch {
    validTicker = null;
  }

  const [financials, news] = await Promise.all([
    validTicker ? getFinancials(validTicker) : Promise.resolve(null),
    getNews(companyName),
  ]);

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

  let decision: Decision;

  try {
    const decisionRes = await reasoning.invoke(decisionPrompt);
    const raw = decisionRes.content.toString().replace(/```json|```/g, "").trim();
    decision = Decision.parse(JSON.parse(raw));
  } catch {
    decision = buildFallbackDecision(companyName, financials, news);
  }

  return ResearchReport.parse({
    companyName,
    ticker: validTicker,
    financials,
    news,
    decision,
  });
}