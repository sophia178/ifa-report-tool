import { NextResponse } from "next/server";
import { generateMarketBriefing } from "@/lib/claude";
import { createClient } from "@/lib/supabase/server";
import { checkSubscription } from "@/lib/subscription";

export const maxDuration = 60;

export async function POST() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const isSubscribed = await checkSubscription(user.id);
    if (!isSubscribed) {
      return NextResponse.json({ error: "Subscription required" }, { status: 403 });
    }

    const briefingText = await generateMarketBriefing();

    // Save to Supabase
    const { data, error: dbError } = await supabase
      .from("market_briefings")
      .insert({
        user_id: user.id,
        briefing_text: briefingText,
      })
      .select()
      .maybeSingle();

    if (dbError) throw dbError;
    if (!data) throw new Error("Could not save briefing.");

    return NextResponse.json({ briefingText, id: data.id });
  } catch (error) {
    console.error("Market briefing error:", error);
    const message = error instanceof Error ? error.message : "Unexpected error.";
    return NextResponse.json({ error: message }, { status: 500 });
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
    console.error("Market briefing list error:", error);
    return NextResponse.json({ error: "Failed to fetch briefings" }, { status: 500 });
  }
}
