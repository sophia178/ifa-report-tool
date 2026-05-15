import { NextResponse } from "next/server";
import { callClaude } from "@/lib/claude";
import { createClient } from "@/lib/supabase/server";
import { checkSubscription } from "@/lib/subscription";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

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

    const { idea } = await request.json();
    if (!idea) {
      return NextResponse.json({ error: "Idea is required" }, { status: 400 });
    }

    const prompt = `You are an expert trading strategist. The user has described a trading concept. Generate a complete, detailed, actionable trading strategy document with these exact sections:
    
    STRATEGY NAME: [Create a professional name]
    VIABILITY SCORE: [X/10 with brief justification]
    EXECUTIVE SUMMARY: [2-3 sentences describing the strategy]
    MARKET CONDITIONS: [When this strategy works best]
    ENTRY RULES: [Specific, numbered entry criteria]
    EXIT RULES: [Specific take profit and stop loss rules]
    POSITION SIZING: [How to size positions]
    RISK MANAGEMENT: [Maximum drawdown, daily loss limits]
    TIMEFRAME: [Best timeframes for this strategy]
    INSTRUMENTS: [Best markets/instruments to apply this to]
    BACKTESTING NOTES: [What to look for when backtesting]
    ADVISER CONSIDERATIONS: [Regulatory and suitability notes]
    
    User concept: ${idea}
    
    Be specific and actionable. No vague advice. Real numbers and rules where possible.
    
    Return ONLY a JSON object with these keys:
    - strategyName
    - viabilityRating (just the number X)
    - viabilityJustification
    - summary
    - marketConditions
    - entryRules
    - exitRules
    - positionSizing
    - riskManagement
    - timeframe
    - instruments
    - backtestingNotes
    - adviserConsiderations
    
    Return ONLY the raw JSON object. Do not use markdown code fences.`;

    const rawResult = await callClaude(prompt, 3000);
    
    // Clean and parse JSON safely
    const cleanJson = rawResult.replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/```\s*$/i, "").trim();
    const strategyJson = JSON.parse(cleanJson);

    // Save to Supabase
    const { data, error: dbError } = await supabase
      .from("trade_strategies")
      .insert({
        user_id: user.id,
        idea,
        strategy_json: strategyJson,
      })
      .select()
      .maybeSingle();

    if (dbError || !data) {
      console.error("DB Error:", dbError);
    }

    return NextResponse.json({ result: strategyJson });
  } catch (error) {
    console.error("API route error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Generation failed" },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data, error } = await supabase
      .from("trade_strategies")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;

    return NextResponse.json(data);
  } catch (error) {
    console.error("API route error:", error);
    return NextResponse.json({ error: "Failed to fetch strategies" }, { status: 500 });
  }
}
