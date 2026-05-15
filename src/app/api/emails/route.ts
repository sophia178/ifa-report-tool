import { NextResponse } from "next/server";
import { anthropic } from "@/lib/claude";
import { createClient } from "@/lib/supabase/server";
import { checkSubscription, getUserPlan } from "@/lib/subscription";

export const dynamic = "force-dynamic";

async function enforceStarterMonthlyLimit(params: {
  supabase: Awaited<ReturnType<typeof createClient>>;
  userId: string;
  route: string;
  limit: number;
}): Promise<{ allowed: boolean }> {
  const now = new Date();
  const periodStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  const resetDateIso = periodStart.toISOString();

  const existing = await params.supabase
    .from("usage_tracking")
    .select("count, reset_date")
    .eq("user_id", params.userId)
    .eq("route", params.route)
    .maybeSingle();

  if (existing.error) {
    console.error("Usage tracking read error:", existing.error);
    return { allowed: true };
  }

  const currentCount = typeof existing.data?.count === "number" ? existing.data.count : 0;
  const existingReset = typeof existing.data?.reset_date === "string" ? new Date(existing.data.reset_date) : null;
  const needsReset =
    !existingReset ||
    existingReset.getUTCFullYear() !== periodStart.getUTCFullYear() ||
    existingReset.getUTCMonth() !== periodStart.getUTCMonth();

  if (needsReset) {
    if (existing.data) {
      const updated = await params.supabase
        .from("usage_tracking")
        .update({ count: 1, reset_date: resetDateIso } as any)
        .eq("user_id", params.userId)
        .eq("route", params.route);
      if (updated.error) console.error("Usage tracking reset error:", updated.error);
    } else {
      const inserted = await params.supabase
        .from("usage_tracking")
        .insert({ user_id: params.userId, route: params.route, count: 1, reset_date: resetDateIso } as any);
      if (inserted.error) console.error("Usage tracking insert error:", inserted.error);
    }
    return { allowed: true };
  }

  if (currentCount >= params.limit) {
    return { allowed: false };
  }

  const updated = await params.supabase
    .from("usage_tracking")
    .update({ count: currentCount + 1 } as any)
    .eq("user_id", params.userId)
    .eq("route", params.route);

  if (updated.error) {
    console.error("Usage tracking increment error:", updated.error);
  }

  return { allowed: true };
}

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

    const plan = (await getUserPlan(user.id)) || "starter";
    if (plan === "starter") {
      const { allowed } = await enforceStarterMonthlyLimit({
        supabase,
        userId: user.id,
        route: "emails",
        limit: 20,
      });
      if (!allowed) {
        return NextResponse.json(
          { error: "You have reached your monthly limit. Upgrade to Plus for unlimited reports." },
          { status: 429 }
        );
      }
    }

    const prompt = `You are a professional financial adviser drafting an email to a client.
    Client: ${clientName}
    Purpose: ${purpose}
    Key Points: ${keyPoints}
    Tone: ${tone}
    
    Return the email content as plain text. Maximum 300 words.`;

    const stream = await anthropic.messages.stream({
      model: process.env.ANTHROPIC_MODEL || "claude-sonnet-4-5",
      max_tokens: 2000,
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

          // After streaming, save to DB
          try {
            await supabase
              .from("client_emails")
              .insert({
                user_id: user.id,
                client_name: clientName,
                purpose,
                key_points: keyPoints,
                tone,
                email_content: fullText,
              });
          } catch (err) {
            console.error("Failed to save email result:", err);
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
