import { NextResponse } from "next/server";
import { callClaude } from "@/lib/claude";
import { createClient } from "@/lib/supabase/server";
import { checkSubscription } from "@/lib/subscription";

export const maxDuration = 300;

type Jurisdiction = "uk" | "aus" | "usa";

function normalizeJurisdiction(value: unknown): Jurisdiction {
  const v = typeof value === "string" ? value.trim().toLowerCase() : "uk";
  if (v === "uk" || v === "aus" || v === "usa") return v;
  return "uk";
}

function getKeywords(jurisdiction: Jurisdiction) {
  if (jurisdiction === "aus") return ["ASIC", "RBA", "ASX", "Superannuation", "AFSL"];
  if (jurisdiction === "usa") return ["SEC", "Federal Reserve", "S&P 500", "401k", "FINRA"];
  return ["FCA", "Bank of England", "FTSE", "UK pensions", "Consumer Duty"];
}

function getJurisdictionPrompt(jurisdiction: Jurisdiction) {
  if (jurisdiction === "aus") {
    return [
      "Australia-only adviser news briefing.",
      "Focus on: ASIC regulation, RBA decisions, ASX markets, superannuation industry news, AFSL updates, Australian financial planning, retirement income strategy.",
    ].join("\n");
  }
  if (jurisdiction === "usa") {
    return [
      "USA-only adviser news briefing.",
      "Focus on: SEC regulation, Federal Reserve, S&P 500, 401k and IRA news, CFP Board updates, FINRA, US financial planning developments, Social Security updates.",
    ].join("\n");
  }
  return [
    "UK-only adviser news briefing.",
    "Focus on: FCA regulation, Bank of England, FTSE markets, UK pension news, Consumer Duty, UK financial planning developments.",
  ].join("\n");
}

function looksLikeMissingColumn(err: unknown) {
  const m = err && typeof err === "object" && "message" in err ? String((err as any).message) : "";
  return m.includes("column") && (m.includes("does not exist") || m.includes("not found"));
}

function getFallbackNews(jurisdiction: Jurisdiction) {
  const prefix = jurisdiction === "uk" ? "UK" : jurisdiction === "aus" ? "Australia" : "USA";

  return [
    {
      topic: `${prefix} markets snapshot`,
      developments: "Markets are mixed as investors weigh inflation, rates and growth data.",
      implications: "Clients may react emotionally to short-term volatility; reinforce long-term plan discipline.",
      adviserAdvice: "Reconfirm objectives, time horizon and cash needs before making allocation changes.",
      riskFlags: "Chasing performance; selling into drawdowns.",
    },
    {
      topic: "Rates and inflation watch",
      developments: "Policy expectations remain sensitive to inflation prints and central bank commentary.",
      implications: "Bond duration and equity valuations can move quickly as rate expectations shift.",
      adviserAdvice: "Stress-test portfolios for rate shocks and review diversification across asset classes.",
      riskFlags: "Over-concentration in a single duration profile.",
    },
    {
      topic: "Regulatory and compliance headlines",
      developments: "Regulators continue to scrutinize advice processes, disclosures and product governance.",
      implications: "Documentation and suitability rationale remain critical for adviser defensibility.",
      adviserAdvice: "Ensure file notes, disclosures and client communications are complete and consistent.",
      riskFlags: "Gaps in disclosure; inconsistent advice records.",
    },
    {
      topic: "Client communication opportunities",
      developments: "High-profile headlines are driving increased client questions and inbound messages.",
      implications: "Proactive communication reduces anxiety and improves retention.",
      adviserAdvice: "Send a short client note explaining what matters, what doesn’t, and your next review cadence.",
      riskFlags: "Clients acting on headlines without context.",
    },
  ];
}

async function generateNews(jurisdiction: Jurisdiction) {
  const jurisdictionPrompt = getJurisdictionPrompt(jurisdiction);
  const prompt = `You are a financial news editor writing for professional financial advisers.

${jurisdictionPrompt}

Generate exactly 4 items. Each item must be specific to this jurisdiction (do not mention or summarize other regions).

Return a JSON array of exactly 4 objects, each with:
- topic
- developments
- implications
- adviserAdvice
- riskFlags

Return ONLY the raw JSON array. Do not use markdown code fences.`;

  const rawResult = await callClaude(prompt);
  const text = rawResult
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/```\s*$/i, "")
    .trim();

  const firstBracket = Math.min(
    text.indexOf("[") === -1 ? Infinity : text.indexOf("["),
    text.indexOf("{") === -1 ? Infinity : text.indexOf("{")
  );
  const cleanText = firstBracket < Infinity ? text.slice(firstBracket) : text;

  return JSON.parse(cleanText);
}

export async function POST(request: Request) {
  try {
    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json(
        { error: "API key not configured" },
        { status: 500 }
      );
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const isSubscribed = await checkSubscription(user.id);
    if (!isSubscribed) {
      return NextResponse.json({ error: "Subscription required" }, { status: 403 });
    }

    const body = await request.json().catch(() => ({}));
    const jurisdiction = normalizeJurisdiction(body?.jurisdiction);
    const cacheKey = `news_briefing_${jurisdiction}`;
    const keywords = getKeywords(jurisdiction);
    let briefingJson: any;
    try {
      briefingJson = await generateNews(jurisdiction);
    } catch (e) {
      console.error("News generation failed (POST):", e);
      briefingJson = getFallbackNews(jurisdiction);
    }

    const insertWithKey = await supabase
      .from("news_briefings")
      .insert({
        user_id: user.id,
        keywords,
        briefing_json: briefingJson,
        cache_key: cacheKey,
        jurisdiction,
      } as any)
      .select()
      .maybeSingle();

    const insertWithJurisdiction = looksLikeMissingColumn(insertWithKey.error)
      ? await supabase
          .from("news_briefings")
          .insert({
            user_id: user.id,
            keywords,
            briefing_json: briefingJson,
            jurisdiction,
          } as any)
          .select()
          .maybeSingle()
      : insertWithKey;

    const insertResult = insertWithJurisdiction.error
      ? await supabase
          .from("news_briefings")
          .insert({
            user_id: user.id,
            keywords,
            briefing_json: briefingJson,
          } as any)
          .select()
          .maybeSingle()
      : insertWithJurisdiction;

    const { data, error: dbError } = insertResult;

    if (dbError || !data) {
      console.error("DB Error:", dbError);
    }

    return NextResponse.json({ result: briefingJson, lastUpdated: data?.created_at || new Date().toISOString(), cached: false });
  } catch (error) {
    console.error("API route error (POST /api/news):", error);
    return NextResponse.json({ result: getFallbackNews("uk"), lastUpdated: new Date().toISOString(), cached: false, fallback: true });
  }
}

export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const isSubscribed = await checkSubscription(user.id);
    if (!isSubscribed) {
      return NextResponse.json({ error: "Subscription required" }, { status: 403 });
    }

    const sixHoursMs = 6 * 60 * 60 * 1000;

    const { searchParams } = new URL(request.url);
    const jurisdiction = normalizeJurisdiction(searchParams.get("jurisdiction") || "uk");
    const cacheKey = `news_briefing_${jurisdiction}`;

    const attemptByKey = await supabase
      .from("news_briefings")
      .select("id, created_at, briefing_json, cache_key")
      .eq("user_id", user.id)
      .eq("cache_key", cacheKey as any)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    const attemptByJurisdiction = looksLikeMissingColumn(attemptByKey.error)
      ? await supabase
          .from("news_briefings")
          .select("id, created_at, briefing_json, jurisdiction")
          .eq("user_id", user.id)
          .eq("jurisdiction", jurisdiction)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle()
      : null;

    const latest = attemptByKey.data || attemptByJurisdiction?.data || null;
    const createdAt = latest?.created_at ? new Date(latest.created_at) : null;
    const isFresh = createdAt ? Date.now() - createdAt.getTime() < sixHoursMs : false;

    if (latest?.briefing_json && isFresh) {
      return NextResponse.json({ result: latest.briefing_json, lastUpdated: latest.created_at, cached: true });
    }

    if (!process.env.ANTHROPIC_API_KEY) {
      if (latest?.briefing_json) {
        return NextResponse.json({ result: latest.briefing_json, lastUpdated: latest.created_at, cached: true, stale: true });
      }
      return NextResponse.json({ error: "API key not configured" }, { status: 500 });
    }

    const keywords = getKeywords(jurisdiction);
    let briefingJson: any;
    try {
      briefingJson = await generateNews(jurisdiction);
    } catch (e) {
      console.error("News generation failed (GET):", e);
      return NextResponse.json({
        result: latest?.briefing_json || getFallbackNews(jurisdiction),
        lastUpdated: latest?.created_at || new Date().toISOString(),
        cached: Boolean(latest?.briefing_json),
        fallback: true,
      });
    }

    const insertWithKey = await supabase
      .from("news_briefings")
      .insert({ user_id: user.id, keywords, briefing_json: briefingJson, cache_key: cacheKey, jurisdiction } as any)
      .select()
      .maybeSingle();

    const insertWithJurisdiction = looksLikeMissingColumn(insertWithKey.error)
      ? await supabase
          .from("news_briefings")
          .insert({ user_id: user.id, keywords, briefing_json: briefingJson, jurisdiction } as any)
          .select()
          .maybeSingle()
      : insertWithKey;

    const insertResult = insertWithJurisdiction.error
      ? await supabase
          .from("news_briefings")
          .insert({ user_id: user.id, keywords, briefing_json: briefingJson } as any)
          .select()
          .maybeSingle()
      : insertWithJurisdiction;

    const { data, error } = insertResult;
    if (error || !data) throw error || new Error("Could not save briefing");

    return NextResponse.json({ result: briefingJson, lastUpdated: data.created_at, cached: false });
  } catch (error) {
    console.error("API route error (GET /api/news):", error);
    return NextResponse.json({ result: getFallbackNews("uk"), lastUpdated: new Date().toISOString(), cached: false, fallback: true });
  }
}
