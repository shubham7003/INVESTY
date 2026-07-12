import { NextRequest, NextResponse } from "next/server";
import { getModel } from "@/lib/llm/factory";
import { verifyTicker } from "@/lib/tools/finance";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const { companyName } = await req.json();
  if (!companyName || typeof companyName !== "string") {
    return NextResponse.json({ error: "companyName is required" }, { status: 400 });
  }

  const fast = getModel("fast");
  try {
    const resolveRes = await fast.invoke(
      `What is the stock ticker symbol for "${companyName}"? Reply with ONLY the ticker, nothing else. If this is not a real, publicly traded company, reply \"UNKNOWN\".`
    );

    const raw = resolveRes?.content?.toString?.() ?? String(resolveRes ?? "");
    // Try to extract a ticker-like token (e.g. AAPL, BRK.B)
    const m = raw.match(/([A-Z]{1,6}(?:\.[A-Z]{1,4})?)/);
    let ticker = m ? m[1] : raw.trim().toUpperCase().replace(/[^A-Z.]/g, "").slice(0, 6);

    if (!ticker) {
      return NextResponse.json({ error: "INVALID_COMPANY", message: "Please enter a valid company name." }, { status: 422 });
    }

    if (ticker === "UNKNOWN" || ticker.length > 6 || !/^[A-Z.]+$/.test(ticker)) {
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
