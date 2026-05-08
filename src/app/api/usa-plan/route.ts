import { NextResponse } from "next/server";
import { generateUSAPlan } from "@/lib/claude";
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

    const payload = await request.json();
    const { clientName, meetingNotes } = payload;
    
    if (!clientName || !meetingNotes) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const planText = await generateUSAPlan({ 
      clientName, 
      meetingNotes: JSON.stringify(payload, null, 2)
    });

    // Save to Supabase
    const { data, error: dbError } = await supabase
      .from("usa_financial_plans")
      .insert({
        user_id: user.id,
        client_name: clientName,
        meeting_notes: meetingNotes,
        plan_text: planText,
      })
      .select()
      .maybeSingle();

    if (dbError) throw dbError;
    if (!data) throw new Error("Could not save plan.");

    return NextResponse.json({ planText, planId: data.id });
  } catch (error) {
    console.error("USA plan generator error:", error);
    const message = error instanceof Error ? error.message : "Unexpected error.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
