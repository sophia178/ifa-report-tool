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

    const { trades } = await request.json();
    if (!trades || !Array.isArray(trades) || trades.length === 0) {
      return NextResponse.json({ error: "Trades are required" }, { status: 400 });
    }

    const prompt = `You are a trading performance coach. Analyse the following trade journal entries and return clear insights suitable for a trading journal review.
Trades: ${JSON.stringify(trades)}

Return a JSON object with:
- winRate: string (percentage)
- avgProfitLoss: string (e.g. "+$123.45" or "-$45.10")
- bestAssets: string[] (tickers/symbols)
- worstAssets: string[] (tickers/symbols)
- patterns: string (key behavioral/technical patterns, concise)
- recommendations: string[] (actionable improvements)

Return ONLY the raw JSON object. Do not use markdown code fences.`;

    const rawResult = await callClaude(prompt);
    
    // Clean and parse JSON safely
    const cleanJson = rawResult.replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/```\s*$/i, "").trim();
    const result = JSON.parse(cleanJson);

    return NextResponse.json({ result });
  } catch (error) {
    console.error("API route error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Generation failed" },
      { status: 500 }
    );
  }
}
