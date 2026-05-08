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

    const body = await request.json();
    const { clientName, purpose, keyPoints, tone } = body;
    
    if (!clientName || !purpose || !keyPoints || !tone) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const prompt = `You are a professional financial adviser drafting an email to a client.
    Client: ${clientName}
    Purpose: ${purpose}
    Key Points: ${keyPoints}
    Tone: ${tone}
    
    Return the email content as plain text. Maximum 300 words.`;

    const emailContent = await callClaude(prompt);

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

    if (dbError) {
      console.error("DB Error:", dbError);
    }

    return NextResponse.json({ result: emailContent });
  } catch (error) {
    console.error("API route error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Generation failed" },
      { status: 500 }
    );
  }
}
