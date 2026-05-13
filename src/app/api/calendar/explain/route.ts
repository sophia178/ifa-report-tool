import { NextResponse } from "next/server";
import { callClaude } from "@/lib/claude";
import { createClient } from "@/lib/supabase/server";
import { checkSubscription } from "@/lib/subscription";

export const maxDuration = 60;
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

    const event = await request.json();
    if (!event.title || !event.date || !event.impact || !event.description) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const prompt = `You are an economist. Generate a 150-word adviser-focused insight about the following economic event in plain English for a financial adviser to use with clients.

Use the description as the factual context for what the event is. Do not invent or assume additional event details beyond what is provided. You may discuss general market sensitivity and typical channels of impact, but keep event-specific details grounded in the description.

Event: ${event.title}
Date: ${event.date}
Impact: ${event.impact}
Description: ${event.description}

Return the explanation as plain text. The length should be approximately 150 words.`;

    const explanation = await callClaude(prompt);

    return NextResponse.json({ result: explanation });
  } catch (error) {
    console.error("API route error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Generation failed" },
      { status: 500 }
    );
  }
}
