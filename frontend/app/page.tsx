"use client";
import { useState } from "react";

type Phase = "idle" | "loading" | "results";

type ResearchReport = {
  companyName: string;
  ticker: string | null;
  financials: {
    ticker: string;
    price: number | null;
    marketCap: number | null;
    peRatio: number | null;
    revenue: number | null;
    profitMargin: number | null;
  } | null;
  news: { title: string; url: string; snippet: string }[];
  decision: {
    verdict: "INVEST" | "PASS";
    confidence: number;
    summary: string;
    reasons: string[];
    risks: string[];
  };
};

const RESEARCH_STAGES = ["Resolving company", "Gathering financials", "Scanning news", "Analyzing & deciding"];

export default function Home() {
  const [companyName, setCompanyName] = useState("");
  const [phase, setPhase] = useState<Phase>("idle");
  const [report, setReport] = useState<ResearchReport | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleResearch() {
    if (!companyName.trim()) return;
    setError(null);

    setPhase("loading");
    setReport(null);
    try {
      const res = await fetch("/api/research", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ companyName }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      setReport(data);
      setPhase("results");
    } catch (e) {
      setError(String(e));
      setPhase("idle");
    }
  }

  function reset() {
    setPhase("idle");
    setReport(null);
    setCompanyName("");
  }

  return (
    <main className="min-h-screen flex flex-col items-center px-6 py-8">
      {phase !== "results" && (
        <div className="flex-1 flex flex-col items-center justify-center w-full max-w-2xl gap-8">
          <div className="w-full grid lg:grid-cols-2 gap-6 items-center">
            <div className="animate-fade-in-up">
              <h1 className="text-3xl font-bold mb-2">Hey, I'm Investy 👋</h1>
              <p className="text-gray-500">Tell me a company and I'll research whether it's worth investing in.</p>
              <p className="text-sm text-gray-400 mt-3">Quick tips: try "Apple" or "Microsoft".</p>
            </div>

            <div className="animate-fade-in-up">
              {phase === "idle" && (
                <div className="flex gap-3 w-full">
                  <input
                    autoFocus
                    aria-label="Company name"
                    className="flex-1 px-4 py-3 rounded-lg border focus:ring-2 focus:ring-[rgba(var(--accent),0.2)] outline-none"
                    placeholder="Enter a company name (e.g. Apple)"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleResearch()}
                  />
                  <button
                    className="btn"
                    onClick={handleResearch}
                    disabled={!companyName.trim()}
                    aria-disabled={!companyName.trim()}
                  >
                    Research
                  </button>
                </div>
              )}

              {phase === "loading" && (
                <div className="card w-full">
                  <div className="skeleton h-8 w-3/4 mb-3" />
                  <div className="skeleton h-6 w-full mb-2" />
                  <div className="skeleton h-6 w-full" />
                </div>
              )}
            </div>
          </div>

          {phase === "idle" && (
            <div className="w-full card text-center">
              <h2 className="font-semibold">New here?</h2>
              <p className="text-sm text-gray-500">Start with a company name or try the demo queries.</p>
              <div className="mt-4 flex justify-center gap-3">
                <button
                  className="btn secondary"
                  onClick={() => {
                    setCompanyName("Apple");
                    window.dispatchEvent(new CustomEvent("toast", { detail: { message: "Try 'Apple' — then press Research", type: "success" } }));
                  }}
                >
                  Try Apple
                </button>
              </div>
            </div>
          )}

          {phase === "loading" && <ResearchAnimation companyName={companyName} />}

          {error && (
            <p className="text-red-500 text-sm" role="alert">
              {error}
            </p>
          )}
        </div>
      )}

      {phase === "results" && report && (
        <div className="w-full max-w-3xl py-10 animate-fade-in-up">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6 gap-4">
            <div>
              <h1 className="text-xl font-bold">Investy's take on {report.companyName}</h1>
              <p className="text-sm text-gray-500">{report.ticker}</p>
            </div>
            <div className="flex gap-3">
              <button onClick={reset} className="btn secondary">New search</button>
            </div>
          </div>

          <div className="p-5 rounded-xl border mb-6 card" role="region" aria-labelledby="verdict-heading">
            <h2 id="verdict-heading" className="text-2xl font-bold">{report.decision.verdict}</h2>
            <p className="text-sm text-gray-500 mb-2">Confidence: {report.decision.confidence}%</p>
            <p>{report.decision.summary}</p>
          </div>

          <div className="grid sm:grid-cols-2 gap-6">
            <div className="card">
              <h3 className="font-semibold mb-2">Reasons</h3>
              <ul className="list-disc pl-5 text-gray-700 space-y-1">
                {report.decision.reasons.map((r, i) => (
                  <li key={i}>{r}</li>
                ))}
              </ul>
            </div>

            <div className="card">
              <h3 className="font-semibold mb-2">Risks</h3>
              <ul className="list-disc pl-5 text-gray-700 space-y-1">
                {report.decision.risks.map((r, i) => (
                  <li key={i}>{r}</li>
                ))}
              </ul>
            </div>

            {report.financials && (
              <div className="card sm:col-span-2">
                <h3 className="font-semibold mb-2">Financials</h3>
                <pre className="bg-[rgba(var(--muted),0.04)] p-3 rounded-lg text-sm overflow-x-auto">
                  {JSON.stringify(report.financials, null, 2)}
                </pre>
              </div>
            )}

            <div className="card sm:col-span-2">
              <h3 className="font-semibold mb-2">Sources</h3>
              <ul className="list-disc pl-5 text-sm space-y-1">
                {report.news.map((n, i) => (
                  <li key={i}>
                    <a className="text-[rgb(var(--accent))] underline" href={n.url} target="_blank" rel="noreferrer">
                      {n.title}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

function ResearchAnimation({ companyName }: { companyName: string }) {
  const nodes = [
    { label: "Financials", x: 60, y: 30 },
    { label: "News", x: 240, y: 30 },
    { label: "Competitors", x: 60, y: 150 },
    { label: "Decision", x: 240, y: 150 },
  ];
  const center = { x: 150, y: 90 };

  return (
    <div className="flex flex-col items-center gap-4 animate-fade-in-up">
      <svg viewBox="0 0 300 180" className="w-72 h-44">
        {nodes.map((n, i) => (
          <line
            key={i}
            x1={center.x}
            y1={center.y}
            x2={n.x}
            y2={n.y}
            stroke="#4b5563"
            strokeWidth="1.5"
            strokeDasharray="6 4"
            style={{
              animation: `draw-line 1.2s ease-out ${i * 0.15}s infinite alternate`,
            }}
          />
        ))}
        <circle cx={center.x} cy={center.y} r="10" fill="#ffffff" />
        {nodes.map((n, i) => (
          <g key={i}>
            <circle
              cx={n.x}
              cy={n.y}
              r="7"
              fill="#60a5fa"
              style={{ animation: `pulse-node 1.4s ease-in-out ${i * 0.2}s infinite` }}
            />
            <text x={n.x} y={n.y - 14} textAnchor="middle" fontSize="10" fill="#9ca3af">
              {n.label}
            </text>
          </g>
        ))}
      </svg>
      <p className="text-gray-400 text-sm">Researching {companyName}...</p>
    </div>
  );
}