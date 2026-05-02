import { NextResponse } from "next/server";
import { generateAustralianSOA } from "@/lib/claude";
import { createClient } from "@/lib/supabase/server";
import { checkSubscription } from "@/lib/subscription";

export const maxDuration = 300;

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

    const soaText = await generateAustralianSOA({ 
      clientName, 
      meetingNotes: JSON.stringify(payload, null, 2) // Pass the full payload as context
    });

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
      .single();

    if (dbError) throw dbError;

    return NextResponse.json({ soaText, soaId: data.id });
  } catch (error) {
    console.error("SOA generator error:", error);
    const message = error instanceof Error ? error.message : "Unexpected error.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
