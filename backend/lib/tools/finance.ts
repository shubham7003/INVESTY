import yahooFinance from "yahoo-finance2";
import type { FinancialSnapshot } from "../../types/agent";

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
    const q: any = await yahooFinance.quote(t);
    const name = q?.shortName ?? q?.longName;
    const price = toNumber(q?.regularMarketPrice);
    return Boolean(name && price !== null);
  } catch (err) {
    console.error("VERIFY TICKER ERROR for", t, ":", err);
    return false;
  }
}

export async function searchTickerByName(name: string): Promise<string | null> {
  const q = String(name || "").trim();
  if (!q) return null;
  try {
    const res: any = await (yahooFinance as any).search(q);
    const quotes = Array.isArray(res) ? res : res?.quotes ?? res?.ResultSet?.Result ?? null;
    const first = Array.isArray(quotes) && quotes.length > 0 ? quotes[0] : null;
    const symbol = first?.symbol ?? first?.ticker ?? null;
    return symbol ? String(symbol).toUpperCase() : null;
  } catch (err) {
    console.error("searchTickerByName ERROR for", q, ":", err);
    return null;
  }
}

export async function getFinancials(ticker: string): Promise<FinancialSnapshot | null> {
  const t = String(ticker || "").trim().toUpperCase();
  if (!t) return null;
  try {
    const q: any = await yahooFinance.quote(t);
    const price = toNumber(q?.regularMarketPrice);
    if (price === null) return null;

    return {
      ticker: t,
      price,
      marketCap: toNumber(q?.marketCap),
      peRatio: toNumber(q?.trailingPE),
      revenue: null,
      profitMargin: toNumber(q?.profitMargins),
    };
  } catch (err) {
    console.error("FINANCIALS ERROR for", t, ":", err);
    return null;
  }
}