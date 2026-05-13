import { NextResponse } from "next/server";
import { callClaude } from "@/lib/claude";
import { createClient } from "@/lib/supabase/server";
import { checkSubscription } from "@/lib/subscription";

export const dynamic = "force-dynamic";

export async function POST() {
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

    const todayStr = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
    const prompt = `You are a market analyst. Generate a professional daily market briefing for a UK financial adviser. 
    The current date is ${todayStr}.
    
    Include sections on:
    - UK Market Overview
    - Global Markets
    - Regulatory Highlights
    - Key Economic Events
    
    Return the briefing as plain structured text with clear headings. Use "##" for main section headings. Do not use a single "#" for the title. 
    Maximum 600 words.`;

    const briefingText = await callClaude(prompt);

    // Save to Supabase
    const { data, error: dbError } = await supabase
      .from("market_briefings")
      .insert({
        user_id: user.id,
        briefing_text: briefingText,
      })
      .select()
      .maybeSingle();

    if (dbError || !data) {
      return NextResponse.json({ error: "Could not save briefing" }, { status: 500 });
    }

    return NextResponse.json({ result: briefingText, id: data.id });
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
      .from("market_briefings")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;

    return NextResponse.json(data);
  } catch (error) {
    console.error("API route error:", error);
    return NextResponse.json({ error: "Failed to fetch briefings" }, { status: 500 });
  }
}
