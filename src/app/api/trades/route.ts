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

    const body = await request.json().catch(() => ({}));
    const symbol =
      (typeof body?.symbol === "string" && body.symbol.trim()) ||
      (typeof body?.asset_name === "string" && body.asset_name.trim()) ||
      (typeof body?.assetName === "string" && body.assetName.trim()) ||
      "";
    const directionRaw = typeof body?.direction === "string" ? body.direction.trim().toLowerCase() : "";
    const direction = directionRaw === "short" ? "short" : directionRaw === "long" ? "long" : null;
    const entryPrice = Number(body?.entry_price ?? body?.entryPrice);
    const exitPrice = Number(body?.exit_price ?? body?.exitPrice);
    const quantity = Number(body?.quantity ?? body?.position_size ?? body?.positionSize);
    const tradeDate = typeof body?.trade_date === "string" ? body.trade_date : typeof body?.tradeDate === "string" ? body.tradeDate : "";
    const notes =
      (typeof body?.notes === "string" && body.notes.trim()) ||
      (typeof body?.rationale === "string" && body.rationale.trim()) ||
      "";

    if (!symbol || !Number.isFinite(entryPrice) || !Number.isFinite(exitPrice) || !Number.isFinite(quantity) || !tradeDate || !notes) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const insertNewSchema = {
      user_id: user.id,
      symbol,
      entry_price: entryPrice,
      exit_price: exitPrice,
      quantity,
      direction: direction || "long",
      notes,
      trade_date: tradeDate,
    };

    const insertLegacySchema = {
      user_id: user.id,
      asset_name: symbol,
      entry_price: entryPrice,
      exit_price: exitPrice,
      position_size: quantity,
      trade_date: tradeDate,
      rationale: notes,
    };

    let data: any = null;
    let dbError: any = null;

    const attemptNew = await supabase.from("trades").insert(insertNewSchema as any).select().single();
    if (attemptNew.error) {
      const message = String(attemptNew.error.message || "");
      const looksLikeSchemaMismatch =
        message.toLowerCase().includes("column") ||
        message.toLowerCase().includes("schema cache") ||
        message.toLowerCase().includes("unknown") ||
        message.toLowerCase().includes("could not find");

      if (looksLikeSchemaMismatch) {
        const attemptLegacy = await supabase
          .from("trades")
          .insert(insertLegacySchema as any)
          .select()
          .single();
        data = attemptLegacy.data;
        dbError = attemptLegacy.error;
      } else {
        data = attemptNew.data;
        dbError = attemptNew.error;
      }
    } else {
      data = attemptNew.data;
      dbError = attemptNew.error;
    }

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
      .eq("user_id", user.id)
      .order("trade_date", { ascending: false });

    if (error) throw error;

    return NextResponse.json(data);
  } catch (error) {
    console.error("Trade journal list error:", error);
    const message = error instanceof Error ? error.message : "Unexpected error.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
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

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id") || "";
    if (!id) {
      return NextResponse.json({ error: "Trade id is required" }, { status: 400 });
    }

    const { error } = await supabase
      .from("trades")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id);

    if (error) throw error;

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Trade journal delete error:", error);
    const message = error instanceof Error ? error.message : "Unexpected error.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
