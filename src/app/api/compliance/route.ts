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

    const { text } = await request.json();
    if (!text) {
      return NextResponse.json({ error: "Text is required" }, { status: 400 });
    }

    const prompt = `You are a compliance officer. Analyse the following text for compliance with FCA Consumer Duty and COBS 9 rules.
    Text: ${text}
    
    Return a JSON object with:
    - score: A number from 1 to 100.
    - issues: An array of objects with { issue, rule, fix }.
    - recommendation: Either "Pass" or "Fail".
    
    Return ONLY the raw JSON object. Do not use markdown code fences. Maximum 500 word analysis total.`;

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
              const textChunk = chunk.delta.text;
              fullText += textChunk;
              controller.enqueue(new TextEncoder().encode(textChunk));
            }
          }

          // After streaming, try to parse and save to DB
          try {
            const cleanJson = fullText.replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/```\s*$/i, "").trim();
            const result = JSON.parse(cleanJson);
            await supabase
              .from("compliance_checks")
              .insert({
                user_id: user.id,
                input_text: text,
                score: result.score,
                issues: result.issues,
                recommendation: result.recommendation,
              });
          } catch (err) {
            console.error("Failed to parse/save compliance result:", err);
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
