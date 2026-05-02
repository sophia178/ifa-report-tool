import { NextResponse } from "next/server";
import { analysePortfolioRisk } from "@/lib/claude";
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

    const { holdings } = await request.json();
    if (!holdings || !Array.isArray(holdings) || holdings.length === 0) {
      return NextResponse.json({ error: "Holdings are required" }, { status: 400 });
    }

    const result = await analysePortfolioRisk(holdings);

    // Save to Supabase
    const { error: dbError } = await supabase
      .from("portfolio_risk_analyses")
      .insert({
        user_id: user.id,
        holdings,
        analysis_result: result,
      });

    if (dbError) throw dbError;

    return NextResponse.json(result);
  } catch (error) {
    console.error("Portfolio risk analysis error:", error);
    const message = error instanceof Error ? error.message : "Unexpected error.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
