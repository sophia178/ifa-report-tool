import { NextResponse } from "next/server";
import { draftClientEmail } from "@/lib/claude";
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

    const { clientName, purpose, keyPoints, tone } = await request.json();
    if (!clientName || !purpose || !keyPoints || !tone) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const emailContent = await draftClientEmail({ clientName, purpose, keyPoints, tone });

    // Save to Supabase
    const { error: dbError } = await supabase
      .from("client_emails")
      .insert({
        user_id: user.id,
        client_name: clientName,
        purpose,
        key_points: keyPoints,
        tone,
        email_content: emailContent,
      });

    if (dbError) throw dbError;

    return NextResponse.json({ emailContent });
  } catch (error) {
    console.error("Email drafter error:", error);
    const message = error instanceof Error ? error.message : "Unexpected error.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
