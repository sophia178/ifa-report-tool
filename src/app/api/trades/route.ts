import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { checkSubscription } from "@/lib/subscription";

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

    const { assetName, entryPrice, exitPrice, positionSize, tradeDate, rationale } = await request.json();
    
    if (!assetName || entryPrice === undefined || exitPrice === undefined || positionSize === undefined || !tradeDate || !rationale) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const { data, error: dbError } = await supabase
      .from("trades")
      .insert({
        user_id: user.id,
        asset_name: assetName,
        entry_price: entryPrice,
        exit_price: exitPrice,
        position_size: positionSize,
        trade_date: tradeDate,
        rationale: rationale,
      })
      .select()
      .single();

    if (dbError) throw dbError;

    return NextResponse.json(data);
  } catch (error) {
    console.error("Trade journal error:", error);
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
      .from("trades")
      .select("*")
      .order("trade_date", { ascending: false });

    if (error) throw error;

    return NextResponse.json(data);
  } catch (error) {
    console.error("Trade journal list error:", error);
    const message = error instanceof Error ? error.message : "Unexpected error.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
