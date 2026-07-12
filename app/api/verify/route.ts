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
    const ticker = resolveRes.content.toString().trim().toUpperCase();

    if (ticker === "UNKNOWN" || ticker.length > 6 || !/^[A-Z.]+$/.test(ticker)) {
      return NextResponse.json({ error: "INVALID_COMPANY", message: "Please enter a valid company name." }, { status: 422 });
    }

    const ok = await verifyTicker(ticker);
    if (!ok) {
      return NextResponse.json({ error: "INVALID_COMPANY", message: "Please enter a valid company name." }, { status: 422 });
    }

    return NextResponse.json({ valid: true, ticker });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "verify_failed", detail: String(err) }, { status: 500 });
  }
}
