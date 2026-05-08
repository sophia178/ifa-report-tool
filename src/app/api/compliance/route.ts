import { NextResponse } from "next/server";
import { checkCompliance } from "@/lib/claude";
import { createClient } from "@/lib/supabase/server";
import { checkSubscription } from "@/lib/subscription";

export const maxDuration = 60;

export async function POST(request: Request) {
  try {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "Anthropic API key is not configured" }, { status: 500 });
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

    const result = await checkCompliance(text);

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

    if (dbError) throw dbError;

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("Compliance API error:", error);
    return NextResponse.json({ error: error.message || "Failed to check compliance" }, { status: 500 });
  }
}
