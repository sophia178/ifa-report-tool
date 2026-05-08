import { NextResponse } from "next/server";
import { callClaude } from "@/lib/claude";
import { createClient } from "@/lib/supabase/server";
import { checkSubscription } from "@/lib/subscription";

export const maxDuration = 300;

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

    const prompt = `You are a specialist research analyst for UK financial advisers. 
    Analyse the provided text and return a JSON object with:
    - summary: A exactly 3-sentence plain English summary.
    - keyPoints: Exactly 5 key bullet points as an array of strings.
    - risks: Any risks or concerns flagged for advisers or clients.
    - relevanceRating: A rating from 1 to 10 for how relevant this is to a UK financial adviser.

    Text: ${text}

    Return ONLY the raw JSON object. Do not use markdown code fences.`;

    const rawResult = await callClaude(prompt);
    
    // Clean and parse JSON safely
    const cleanJson = rawResult.replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/```\s*$/i, "").trim();
    const result = JSON.parse(cleanJson);

    // Save to Supabase
    const { error: dbError } = await supabase
      .from("research_summaries")
      .insert({
        user_id: user.id,
        input_text: text,
        summary: result.summary,
        key_points: result.keyPoints,
        risks: result.risks,
        relevance_rating: result.relevanceRating,
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
