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

    const payload = await request.json();
    const { clientName, meetingNotes } = payload;
    
    if (!clientName || !meetingNotes) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const prompt = `You are an Australian financial adviser. Generate a concise Statement of Advice (SOA) for the following client:
    Client Name: ${clientName}
    Meeting Notes: ${meetingNotes}
    
    Ensure you cover exactly these 8 core sections:
    1. Executive Summary
    2. Client Profile and Objectives
    3. Risk Assessment
    4. Suitability Analysis
    5. Recommendation and Rationale
    6. Charges and Value Assessment
    7. Best Interest Duty Analysis
    8. Disclaimer
    
    Return the SOA as plain structured text. Maximum 8 sections.`;

    const soaText = await callClaude(prompt);

    // Save to Supabase
    const { data, error: dbError } = await supabase
      .from("australian_soas")
      .insert({
        user_id: user.id,
        client_name: clientName,
        meeting_notes: meetingNotes,
        soa_text: soaText,
      })
      .select()
      .maybeSingle();

    if (dbError || !data) {
      return NextResponse.json({ error: "Could not save SOA" }, { status: 500 });
    }

    return NextResponse.json({ result: soaText, soaId: data.id });
  } catch (error) {
    console.error("API route error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Generation failed" },
      { status: 500 }
    );
  }
}
