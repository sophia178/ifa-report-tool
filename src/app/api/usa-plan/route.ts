import { NextResponse } from "next/server";
import { anthropic } from "@/lib/claude";
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
    const { clientName, clientEmail, dateOfBirth, meetingDate, meetingNotes } = payload;
    
    if (!clientName || !meetingNotes) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("display_name")
      .eq("id", user.id)
      .maybeSingle();

    const adviserName =
      (profile?.display_name && String(profile.display_name).trim()) || "Your Financial Adviser";

    const now = new Date();
    const year = now.getFullYear();
    const preparedOn = now.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });

    const prompt = `You are a US financial planner. Write a professional US Financial Plan draft as plain text (no markdown).

Use today's date: ${preparedOn} (${year}).

Use this exact header block at the top of the plan:
USA FINANCIAL PLAN
Prepared on: ${preparedOn}
Prepared by: ${adviserName}
Client: ${clientName}
${clientEmail ? `Client email: ${clientEmail}` : ""}
${dateOfBirth ? `Client date of birth: ${dateOfBirth}` : ""}
${meetingDate ? `Meeting date: ${meetingDate}` : ""}

Do NOT invent or guess any firm name. If a firm name is not provided, omit it entirely.
Do NOT use markdown symbols like ##, **, *, _, or --- anywhere. Use plain text with clear section headings only.

Meeting notes (verbatim):
${meetingNotes}

Write exactly these 8 sections with clear headings:
1. Executive Summary
2. Client Profile and Objectives
3. Risk Assessment
4. Suitability Analysis
5. Recommendation and Rationale
6. Charges and Value Assessment
7. Fiduciary Duty Outcomes
8. Disclaimer

Keep the writing concise, clear, and client-ready.`;

    const stream = await anthropic.messages.stream({
      model: process.env.ANTHROPIC_MODEL || "claude-sonnet-4-5",
      max_tokens: 1500,
      messages: [{ role: "user", content: prompt }],
    });

    return new Response(
      new ReadableStream({
        async start(controller) {
          let fullText = "";
          for await (const chunk of stream) {
            if (chunk.type === "content_block_delta" && chunk.delta.type === "text_delta") {
              const text = chunk.delta.text;
              fullText += text;
              controller.enqueue(new TextEncoder().encode(text));
            }
          }

          // Save to Supabase in the background
          try {
            await supabase
              .from("usa_financial_plans")
              .insert({
                user_id: user.id,
                client_name: clientName,
                meeting_notes: meetingNotes,
                plan_text: fullText,
              });
          } catch (dbError) {
            console.error("Failed to save plan to DB:", dbError);
          }

          controller.close();
        },
      }),
      {
        headers: {
          "Content-Type": "text/plain; charset=utf-8",
          "Transfer-Encoding": "chunked",
          "X-Accel-Buffering": "no",
        },
      }
    );
  } catch (error) {
    console.error("API route error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Generation failed" },
      { status: 500 }
    );
  }
}
