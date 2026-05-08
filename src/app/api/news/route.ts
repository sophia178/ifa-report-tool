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

    const { keywords } = await request.json();
    if (!keywords || !Array.isArray(keywords) || keywords.length === 0) {
      return NextResponse.json({ error: "Keywords are required" }, { status: 400 });
    }

    const prompt = `You are a financial news editor. Generate a concise daily briefing based on the following keywords: ${keywords.join(", ")}.
    Return a JSON array of objects, where each object has:
    - topic: The news topic
    - developments: Key news developments
    - implications: Implications for financial advisers
    - adviserAdvice: Specific advice for client conversations
    - riskFlags: Any risks to flag
    
    Return ONLY the raw JSON array. Do not use markdown code fences.`;

    const rawResult = await callClaude(prompt);
    
    // Clean and parse JSON safely
    const cleanJson = rawResult.replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/```\s*$/i, "").trim();
    const briefingJson = JSON.parse(cleanJson);

    // Save to Supabase
    const { data, error: dbError } = await supabase
      .from("news_briefings")
      .insert({
        user_id: user.id,
        keywords,
        briefing_json: briefingJson,
      })
      .select()
      .maybeSingle();

    if (dbError || !data) {
      console.error("DB Error:", dbError);
    }

    return NextResponse.json({ result: briefingJson });
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
      .from("news_briefings")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;

    return NextResponse.json(data);
  } catch (error) {
    console.error("API route error:", error);
    return NextResponse.json({ error: "Failed to fetch briefings" }, { status: 500 });
  }
}
