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

    const today = new Date().toLocaleDateString("en-GB", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });

    const prompt = `You are a market analyst. Generate a professional daily market briefing.\n\nPrepared for UK Financial Advisers | ${today}\n\nWrite a title line at the top (e.g. \"DAILY MARKET BRIEFING\") and then use \"##\" for section headings.\n\nInclude sections on:\n- UK Market Overview\n- Global Markets\n- Regulatory Highlights\n- Key Economic Events\n\nDo not use placeholders like {DATE}. Use the date provided above.\nReturn plain text only. Maximum 600 words.`;

    const briefingText = await callClaude(prompt);
    const finalBriefingText = briefingText.replace(/\{DATE\}/g, today);

    // Save to Supabase
    const { data, error: dbError } = await supabase
      .from("market_briefings")
      .insert({
        user_id: user.id,
        briefing_text: finalBriefingText,
      })
      .select()
      .maybeSingle();

    if (dbError || !data) {
      return NextResponse.json({ error: "Could not save briefing" }, { status: 500 });
    }

    return NextResponse.json({ result: finalBriefingText, id: data.id });
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
