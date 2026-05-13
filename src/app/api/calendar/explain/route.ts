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
    if (!event.title || !event.date || !event.impact) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const country = typeof event.country === "string" ? event.country : "";
    const description = typeof event.description === "string" ? event.description : "";

    const prompt = `You are an economist. Generate a 150-word adviser-focused insight about the following economic event in plain English for a financial adviser to use with clients.

Do not invent specific event details (like the exact figure, forecast, or outcome). If a description is provided, use it as factual context.

Event: ${event.title}
Country: ${country}
Date: ${event.date}
Impact: ${event.impact}
Description (if provided): ${description}

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
