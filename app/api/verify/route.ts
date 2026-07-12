import { NextRequest, NextResponse } from "next/server";
import { getModel } from "@/lib/llm/factory";
import { verifyTicker, searchTickerByName } from "@/lib/tools/finance";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const { companyName } = await req.json();
  if (!companyName || typeof companyName !== "string") {
    return NextResponse.json({ error: "companyName is required" }, { status: 400 });
  }

  const fast = getModel("fast");
  // First try a Yahoo search by company name to avoid LLM calls when possible
  try {
    const fromSearch = await searchTickerByName(companyName);
    if (fromSearch) {
      const ok = await verifyTicker(fromSearch);
      if (ok) return NextResponse.json({ valid: true, ticker: fromSearch });
    }
  } catch (e) {
    // ignore search failures and fall back to LLM
    console.warn("searchTickerByName failed", e);
  }

  try {
    const resolveRes = await fast.invoke(
      `What is the stock ticker symbol for "${companyName}"? Reply with ONLY the ticker symbol in uppercase letters, with no punctuation, no explanation, and no extra words. If this is not a real, publicly traded company, reply with exactly: UNKNOWN`
    );

    const raw = resolveRes?.content?.toString?.() ?? String(resolveRes ?? "");
    const m = raw.match(/\b([A-Z]{1,6}(?:\.[A-Z]{1,4})?)\b/);
    const ticker = m ? m[1] : raw.trim().toUpperCase().replace(/[^A-Z.]/g, "").slice(0, 6);

    if (!ticker || ticker === "UNKNOWN" || ticker.length > 6 || !/^[A-Z.]+$/.test(ticker)) {
      return NextResponse.json({ error: "INVALID_COMPANY", message: "Please enter a valid company name." }, { status: 422 });
    }

    const ok = await verifyTicker(ticker);
    if (!ok) {
      return NextResponse.json({ error: "INVALID_COMPANY", message: "Please enter a valid company name." }, { status: 422 });
    }

    return NextResponse.json({ valid: true, ticker });
  } catch (err: any) {
    console.error(err);
    const msg = String(err?.message ?? err ?? "");
    if (msg.toLowerCase().includes("quota") || msg.toLowerCase().includes("too many requests") || err?.status === 429) {
      return NextResponse.json({ error: "llm_quota_exhausted", message: "LLM quota exhausted — please try again later." }, { status: 429 });
    }
    return NextResponse.json({ error: "verify_failed", detail: String(err) }, { status: 500 });
  }
}
