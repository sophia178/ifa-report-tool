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

    const { jurisdictions } = await request.json();
    if (!jurisdictions || !Array.isArray(jurisdictions) || jurisdictions.length === 0) {
      return NextResponse.json({ error: "Jurisdictions are required" }, { status: 400 });
    }

    const prompt = `You are a regulatory compliance expert. Generate 3 realistic regulatory updates for the following jurisdictions: ${jurisdictions.join(", ")}.
    
    For UK, focus on FCA Consumer Duty, COBS, or MiFID.
    For Australia, focus on ASIC regulatory guides or design and distribution obligations.
    For USA, focus on SEC or FINRA rule changes.
    
    Return the response as a JSON array of objects with these exact keys:
    - title: Professional name of the update
    - summary: Detailed summary of what changed
    - effectiveDate: Date in format "DD Month YYYY"
    - actionRequired: Specific steps the adviser needs to take
    - jurisdiction: The jurisdiction code (uk, aus, or usa)
    - impact: "High", "Medium", or "Low"
    
    Return ONLY the raw JSON array. Do not use markdown code fences.`;

    const rawResult = await callClaude(prompt);
    const cleanJson = rawResult.replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/```\s*$/i, "").trim();
    const updates = JSON.parse(cleanJson);

    return NextResponse.json({ updates });
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
      .from("regulatory_summaries")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;

    return NextResponse.json(data);
  } catch (error) {
    console.error("API route error:", error);
    return NextResponse.json({ error: "Failed to fetch updates" }, { status: 500 });
  }
}
