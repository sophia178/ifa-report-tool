import { NextResponse } from "next/server";
import { analyseTrades } from "@/lib/claude";
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

    const { data: trades, error } = await supabase
      .from("trades")
      .select("*")
      .order("trade_date", { ascending: false });

    if (error) throw error;
    if (!trades || trades.length === 0) {
      return NextResponse.json({ error: "No trades found to analyse." }, { status: 400 });
    }

    const result = await analyseTrades(trades);

    return NextResponse.json(result);
  } catch (error) {
    console.error("Trade analysis error:", error);
    const message = error instanceof Error ? error.message : "Unexpected error.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
