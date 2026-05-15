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

    const { holdings } = await request.json();
    if (!holdings || !Array.isArray(holdings) || holdings.length === 0) {
      return NextResponse.json({ error: "Holdings are required" }, { status: 400 });
    }

    const prompt = `You are a portfolio risk analyst. Analyse the following portfolio holdings for professional adviser use.
Holdings: ${JSON.stringify(holdings)}

Return a JSON object with:
- overallRiskScore: number 1-10
- diversificationAssessment: string
- concentrationRisk: string
- correlationAnalysis: string
- recommendations: string[] (actionable, specific)

Return ONLY the raw JSON object. Do not use markdown code fences.`;

    const rawResult = await callClaude(prompt);
    
    // Clean and parse JSON safely
    const cleanJson = rawResult.replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/```\s*$/i, "").trim();
    const result = JSON.parse(cleanJson);

    // Save to Supabase
    const { error: dbError } = await supabase
      .from("portfolio_risk_analyses")
      .insert({
        user_id: user.id,
        holdings,
        analysis_result: result,
      });

    if (dbError) {
      console.error("DB Error:", dbError);
    }

    return NextResponse.json({ result });
  } catch (error) {
    console.error("API route error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Generation failed" },
      { status: 500 }
    );
  }
}
