import { z } from "zod";

export const InvalidCompanyError = z.object({
  error: z.literal("INVALID_COMPANY"),
  message: z.string(),
});
export type InvalidCompanyError = z.infer<typeof InvalidCompanyError>;

export const FinancialSnapshot = z.object({
  ticker: z.string(),
  price: z.number().nullable(),
  marketCap: z.number().nullable(),
  peRatio: z.number().nullable(),
  revenue: z.number().nullable(),
  profitMargin: z.number().nullable(),
});
export type FinancialSnapshot = z.infer<typeof FinancialSnapshot>;

export const NewsItem = z.object({
  title: z.string(),
  url: z.string(),
  snippet: z.string(),
});
export type NewsItem = z.infer<typeof NewsItem>;

export const Decision = z.object({
  verdict: z.enum(["INVEST", "PASS"]),
  confidence: z.number().min(0).max(100),
  summary: z.string(),
  reasons: z.array(z.string()),
  risks: z.array(z.string()),
});
export type Decision = z.infer<typeof Decision>;

export const ResearchReport = z.object({
  companyName: z.string(),
  ticker: z.string().nullable(),
  financials: FinancialSnapshot.nullable(),
  news: z.array(NewsItem),
  decision: Decision,
});
export type ResearchReport = z.infer<typeof ResearchReport>;