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

    const body = await request.json().catch(() => ({}));
    const jurisdictionRaw = typeof body?.jurisdiction === "string" ? body.jurisdiction : "global";
    const jurisdiction: "uk" | "aus" | "usa" | "global" =
      jurisdictionRaw === "uk" || jurisdictionRaw === "aus" || jurisdictionRaw === "usa" || jurisdictionRaw === "global"
        ? jurisdictionRaw
        : "global";

    const today = new Date().toLocaleDateString("en-GB", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });

    const focus =
      jurisdiction === "uk"
        ? "UK markets (FTSE), Bank of England, FCA focus"
        : jurisdiction === "aus"
          ? "Australian markets (ASX), RBA, Australian dollar, ASIC focus"
          : jurisdiction === "usa"
            ? "US markets (NYSE), Federal Reserve, S&P 500, SEC focus"
            : "UK, Australian, and US markets, including key regulators and central banks";

    const preparedFor =
      jurisdiction === "uk"
        ? `Prepared for UK Financial Advisers | ${today}`
        : jurisdiction === "aus"
          ? `Prepared for Australian Financial Advisers | ${today}`
          : jurisdiction === "usa"
            ? `Prepared for US Financial Advisers | ${today}`
            : `Prepared for Financial Advisers | ${today}`;

    const sections =
      jurisdiction === "uk"
        ? ["UK Market Overview (FTSE)", "Global Markets", "BoE & FCA Highlights", "Key UK Economic Events"]
        : jurisdiction === "aus"
          ? ["Australian Market Overview (ASX)", "Global Markets", "RBA & ASIC Highlights", "Key Australian Economic Events"]
          : jurisdiction === "usa"
            ? ["US Market Overview (S&P 500)", "Global Markets", "Fed & SEC Highlights", "Key US Economic Events"]
            : ["UK Market Overview", "Australian Market Overview", "US Market Overview", "Global Markets", "Regulatory Highlights", "Key Economic Events"];

    const prompt = `You are a market analyst. Generate a professional daily market briefing focused on: ${focus}.

${preparedFor}

Write a title line at the top (e.g. "DAILY MARKET BRIEFING") and then use "##" for section headings.

Include sections on:
${sections.map((s) => `- ${s}`).join("\n")}

Do not use placeholders like {DATE}. Use the date provided above.
Return plain text only. Maximum 600 words.`;

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
