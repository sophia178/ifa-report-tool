import { NextResponse } from "next/server";
import { explainEconomicEvent } from "@/lib/claude";
import { createClient } from "@/lib/supabase/server";
import { checkSubscription } from "@/lib/subscription";

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

    const event = await request.json();
    if (!event.title || !event.date || !event.impact) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const explanation = await explainEconomicEvent(event);

    return NextResponse.json({ explanation });
  } catch (error) {
    console.error("Economic event explanation error:", error);
    const message = error instanceof Error ? error.message : "Unexpected error.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
