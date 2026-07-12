# Investy — AI Investment Research Agent

**Live demo:** https://investy-five.vercel.app/

## Overview

Investy is an AI-powered investment research agent. You give it a company name, and it:

1. Resolves the company to its stock ticker
2. Verifies the company is real and publicly traded (rejects invalid/garbage input instead of fabricating a result)
3. Gathers live financial data (Yahoo Finance) and recent news (Tavily)
4. Uses Google Gemini to analyze the findings and produce an INVEST or PASS verdict, with a confidence score, reasoning, and risks

Built with Next.js, a LangChain.js-style agent pipeline, and Gemini 2.5 Flash.

## How to run it

**Requirements:** Node.js 18+

```bash
git clone https://github.com/shubham7003/INVESTY.git
cd ai-investment-agent
npm install
```

Create a `.env.local` file in the project root:

```
GOOGLE_API_KEY=your_key_from_aistudio.google.com or grok
TAVILY_API_KEY=your_key_from_tavily.com
```

Get keys from:
- Gemini: https://aistudio.google.com/apikey or grok
- Tavily: https://tavily.com (free tier, 1000 searches/month)

Run locally:

```bash
npm run dev
```

Open http://localhost:3000

**Live deployment:** https://investy-five.vercel.app/

## How it works

**Pipeline (runs per request):**

1. **Resolve** — Gemini converts the company name into a stock ticker
2. **Verify** — The ticker is checked against Yahoo Finance; invalid/unknown companies are rejected early with a clean error rather than a fabricated result
3. **Gather (parallel)** — Financial snapshot (price, market cap, P/E ratio, profit margin, revenue) via `yahoo-finance2`; recent news via Tavily search
4. **Decide** — Gemini synthesizes financials + news into a structured verdict: INVEST/PASS, confidence %, summary, reasons, risks
5. **Render** — Frontend shows an animated "researching" state, then the full report with sources

**Architecture:**

```
app/page.tsx              → UI (idle → loading animation → results)
app/api/research/route.ts → thin API route, delegates to agent runner
lib/agent/runner.ts       → orchestrates the pipeline steps
lib/llm/factory.ts        → returns Gemini model by role (fast / reasoning)
lib/tools/finance.ts      → Yahoo Finance ticker verification + snapshot
lib/tools/news.ts         → Tavily news search
types/agent.ts            → Zod schemas — single source of truth for data shapes
```

## Key decisions & trade-offs

| Decision | Why |
|---|---|
| Plain async pipeline instead of a full LangGraph `StateGraph` | Six linear/parallel steps didn't need graph machinery to work correctly; kept build time focused on getting real, working model output rather than orchestration ceremony. Would move to `StateGraph` if adding branching logic (e.g. a bull/bear debate). |
| Switched from Gemini to Groq (Llama 3.1 / 3.3) mid-build | Started with Gemini 2.5 (Flash for resolve, Pro for the final decision). Gemini's free tier proved unreliable for repeated testing — Pro's quota was effectively unusable, and a later attempt to use a newer preview model (`gemini-3.1-pro`) turned out to have zero free-tier allowance at all. Switched both roles to Groq's Llama models, which have a much more generous and predictable free tier, to get consistent real (non-fallback) output while iterating and demoing. |
| Ticker resolution (via LLM) is the sole validity gate, not Yahoo Finance | Originally used Yahoo Finance as a second verification step after ticker resolution. Yahoo's unofficial API (scraped, not a stable REST API) started rate-limiting under repeated testing and returned "Too Many Requests" instead of JSON, which wrongly rejected valid companies like Apple. Decided the LLM's ticker resolution (with strict prompt + regex extraction) is a good enough validity signal on its own; financials are now fetched best-effort and simply show as unavailable if Yahoo is having issues, rather than failing the whole request. |
| No database / persistence | Assignment doesn't require it; the app is stateless by design — one query in, one report out. |
| No brokerage/trading integration | Out of scope — the assignment asks for a research verdict, not trade execution. Avoids unnecessary complexity and risk. |
| Tavily + Yahoo Finance (free tiers) over paid financial APIs | Zero-cost stack sufficient for the assignment's scope; documented as a trade-off vs. richer, more reliable data (e.g. a paid financial data API, or SEC filings) available from paid sources. |

**What was left out:**
- SEC filings / 10-K deep analysis
- Multi-agent bull vs. bear debate
- Historical backtesting
- Persistent research history / caching
- PDF/CSV export
- Reliable real-time financials (Yahoo Finance's free/unofficial API is rate-limit-prone; a paid provider would fix this)

## Challenges faced & how they were resolved

Building this surfaced a number of real integration issues, documented here for transparency (and because working through them was a big part of the actual engineering effort):

1. **Tailwind CSS not rendering at all.** The project was scaffolded with Tailwind v4, which uses a completely different setup than v3 (`@import "tailwindcss";` in one line instead of `@tailwind base/components/utilities;`, and no `tailwind.config.ts` file). Early UI work assumed v3 conventions, so none of the styling applied until this was corrected.

2. **Gemini free-tier quota was unreliable.** `gemini-2.5-pro` frequently hit rate limits during testing, causing the app to silently fall back to a rule-based (non-AI) report instead of a real Gemini decision. A later attempt to reference a newer model (`gemini-3.1-pro`) failed outright with a `limit: 0` quota error — that model has no free-tier access at all. This was the single biggest source of "why does my AI agent not seem to be using AI" confusion during development.

3. **Switching to Groq surfaced a parsing mismatch.** After swapping to Groq's Llama models, the ticker-resolution step started failing validation even for valid companies, because Llama's response format differed slightly from Gemini's (extra text/punctuation around the ticker). Fixed by extracting the ticker with a regex pattern instead of requiring an exact-match response.

4. **`yahoo-finance2` major version mismatch.** The installed version (v3+) changed its API shape entirely (requiring `new YahooFinance()` instantiation instead of calling exported functions directly), which broke financials fetching with confusing "module doesn't exist" errors. Resolved by pinning to the stable `yahoo-finance2@2.13.0` API that matches the original code.

5. **Yahoo Finance rate-limiting during repeated testing.** Because `yahoo-finance2` scrapes Yahoo's website rather than using an official API, repeated local testing eventually triggered a "Too Many Requests" response from Yahoo itself. This was incorrectly causing valid companies to be rejected as "invalid," since financials-fetch failure was originally used as a second validity check. Fixed by decoupling validity (decided by the LLM's ticker resolution) from financials (best-effort; degrades gracefully to "unavailable" instead of failing the request).

**Takeaway documented for the "what I'd improve" section:** a production version of this would use a paid, stable financial data API (rather than an unofficial scraped one) to avoid rate-limit fragility entirely.

## Example runs
Company 1 — e.g. Apple
INVEST
Confidence: 80%

Apple's recent deal with Broadcom to spend $30 billion on chips and its shares approaching a record high indicate a positive outlook for the company. The diversification of its supply chain and investment in US sourcing also suggest a strategic move towards stability and growth. However, potential risks from competitors like SpaceX and legal disputes with OpenAI need to be monitored.

Company 2 — Infosys
PASS
Confidence: 60%

The recent news about Infosys and other Indian IT firms facing pressure due to wage hikes and cautious client spending raises concerns about their profitability. Additionally, the lack of financial data makes it difficult to make an informed investment decision. The news about a retail investor reporting a significant loss in TCS and Infosys holdings also adds to the uncertainty.

Company 3 : TCS
INVEST
Confidence: 80%

TCS has shown steady growth in Q1 2026 with a 3.2% increase in revenue despite macroeconomic headwinds, and the company is investing in artificial intelligence and talent. The recent earnings call transcript indicates a 13.9% rise in revenue from the previous year in rupee terms. Nomura has raised its target price for TCS to Rs 2,590, citing AI growth and a projected recovery by FY27.



Invalid input example
Input: "asdkjfh123" → Output: "Please enter a valid company name."

## What I would improve with more time

- Real LangGraph `StateGraph` implementation with branching (e.g. bull/bear debate agents reaching consensus)
- SEC EDGAR filings integration for deeper fundamental analysis
- Streaming step-by-step progress via SSE (currently a single blocking request)
- Persistent caching layer to avoid re-hitting rate-limited APIs for repeat queries
- Interactive charts for financial metrics instead of raw JSON
- Confidence calibration — test verdict accuracy against real historical outcomes

## LLM chat transcripts

See the `/transcripts` folder for full chat logs used while building this project (bonus section).
