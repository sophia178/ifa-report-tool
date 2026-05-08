import { NextResponse } from "next/server";
import { callClaude } from "@/lib/claude";
import { createClient } from "@/lib/supabase/server";
import { checkSubscription } from "@/lib/subscription";

export const dynamic = "force-dynamic";

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

    const { text } = await request.json();
    if (!text) {
      return NextResponse.json({ error: "Text is required" }, { status: 400 });
    }

    const prompt = `You are a compliance officer. Analyse the following text for compliance with FCA Consumer Duty and COBS 9 rules.
    Text: ${text}
    
    Return a JSON object with:
    - score: A number from 1 to 100.
    - issues: An array of objects with { issue, rule, fix }.
    - recommendation: Either "Pass" or "Fail".
    
    Return ONLY the raw JSON object. Do not use markdown code fences. Maximum 500 word analysis total.`;

    const rawResult = await callClaude(prompt);
    
    // Clean and parse JSON safely
    const cleanJson = rawResult.replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/```\s*$/i, "").trim();
    const result = JSON.parse(cleanJson);

    // Save to Supabase
    const { error: dbError } = await supabase
      .from("compliance_checks")
      .insert({
        user_id: user.id,
        input_text: text,
        score: result.score,
        issues: result.issues,
        recommendation: result.recommendation,
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
