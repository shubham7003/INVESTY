import { NextRequest, NextResponse } from "next/server";
import { runResearchAgent } from "../../lib/agent/runner";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  const { companyName } = await req.json();
  if (!companyName || typeof companyName !== "string") {
    return NextResponse.json({ error: "companyName is required" }, { status: 400 });
  }
  try {
    const report = await runResearchAgent(companyName);
    return NextResponse.json(report);
  } catch (err) {
    const e = err as any;
    if (e && e.name === "InvalidCompanyException") {
      return NextResponse.json({ error: "INVALID_COMPANY", message: e.message }, { status: 422 });
    }
    console.error(err);
    return NextResponse.json({ error: "Agent failed", detail: String(err) }, { status: 500 });
  }
}