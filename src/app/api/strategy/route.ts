import { NextResponse } from "next/server";
import { buildTradeStrategy } from "@/lib/claude";
import { createClient } from "@/lib/supabase/server";
import { checkSubscription } from "@/lib/subscription";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function POST(request: Request) {
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

    const { idea } = await request.json();
    if (!idea) {
      return NextResponse.json({ error: "Idea is required" }, { status: 400 });
    }

    const strategyJson = await buildTradeStrategy(idea);

    // Save to Supabase
    const { data, error: dbError } = await supabase
      .from("trade_strategies")
      .insert({
        user_id: user.id,
        idea,
        strategy_json: strategyJson,
      })
      .select()
      .maybeSingle();

    if (dbError) throw dbError;
    if (!data) throw new Error("Could not save strategy.");

    return NextResponse.json(data);
  } catch (error) {
    console.error("Trade strategy error:", error);
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
      .from("trade_strategies")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;

    return NextResponse.json(data);
  } catch (error) {
    console.error("Strategy fetch error:", error);
    return NextResponse.json({ error: "Failed to fetch strategies" }, { status: 500 });
  }
}
