import yahooFinance from "yahoo-finance2";
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

export async function getFinancials(ticker: string): Promise<FinancialSnapshot | null> {
  const t = String(ticker || "").trim().toUpperCase();
  if (!t) return null;
  try {
    const q: any = await yahooFinance.quote(t); // cast to any — avoids strict type mismatches on optional fields
    const price = toNumber(q?.regularMarketPrice);
    if (price === null) return null;

    return {
      ticker: t,
      price,
      marketCap: toNumber(q?.marketCap),
      peRatio: toNumber(q?.trailingPE),
      revenue: null,
      profitMargin: toNumber(q?.profitMargins), // will just be null if not present — handled gracefully
    };
  } catch (err) {
    console.error("FINANCIALS ERROR for", t, ":", err);
    return null;
  }
}