import type { FinancialSnapshot } from "@/types/agent";

const toNumber = (v: any): number | null => {
  if (typeof v === "number") return v;
  if (v && typeof v === "object") {
    if (typeof v.raw === "number") return v.raw;
    if (typeof v.fmt === "string") {
      const n = Number(v.fmt.replace(/[,\$]/g, ""));
      return Number.isFinite(n) ? n : null;
    }
  }
  return null;
};

export async function verifyTicker(ticker: string): Promise<boolean> {
  const t = String(ticker || "").trim().toUpperCase();
  if (!t) return false;
  try {
    const yf: any = await import("yahoo-finance2");
    const quoteFn = yf.quote ?? yf.default?.quote ?? yf.default ?? yf;
    const q: any = await quoteFn(t);
    const name = q?.shortName ?? q?.longName;
    const price = toNumber(q?.regularMarketPrice);
    return Boolean(name && price !== null);
  } catch {
    return false;
  }
}

export async function getFinancials(ticker: string): Promise<FinancialSnapshot | null> {
  const t = String(ticker || "").trim().toUpperCase();
  if (!t) return null;
  try {
    const yf: any = await import("yahoo-finance2");
    const quoteFn = yf.quote ?? yf.default?.quote ?? yf.default ?? yf;
    const q: any = await quoteFn(t);

    let revenue: number | null = null;
    try {
      const quoteSummaryFn = yf.quoteSummary ?? yf.default?.quoteSummary ?? yf.quoteSummary ?? yf.default;
      const summary: any = await quoteSummaryFn(t, {
        modules: ["incomeStatementHistory", "financialData"],
      });
      const ish = summary?.incomeStatementHistory?.incomeStatementHistory;
      if (Array.isArray(ish) && ish.length > 0) {
        revenue = toNumber(ish[0]?.totalRevenue);
      }
      if (revenue === null) {
        revenue = toNumber(summary?.financialData?.totalRevenue);
      }
    } catch {
      // ignore quoteSummary failures
    }

    return {
      ticker: t,
      price: toNumber(q?.regularMarketPrice),
      marketCap: toNumber(q?.marketCap),
      peRatio: toNumber(q?.trailingPE),
      revenue,
      profitMargin: toNumber(q?.profitMargins),
    };
  } catch {
    return null;
  }
}