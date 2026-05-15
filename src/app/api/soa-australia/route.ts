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
    const {
      clientName,
      clientEmail,
      dateOfBirth,
      meetingDate,
      meetingNotes,
      superFundName,
      currentSuperBalance,
      employerSuperContributionPercent,
    } = payload;
    
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
    const preparedOn = now.toLocaleDateString("en-AU", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    const dobString = typeof dateOfBirth === "string" ? dateOfBirth.trim() : "";
    const dobDate = dobString ? new Date(`${dobString}T00:00:00`) : null;
    const ageYears =
      dobDate && !Number.isNaN(dobDate.getTime())
        ? Math.max(
            0,
            now.getFullYear() -
              dobDate.getFullYear() -
              (now < new Date(now.getFullYear(), dobDate.getMonth(), dobDate.getDate()) ? 1 : 0)
          )
        : null;

    const prompt = `You are an expert Australian financial adviser.
Generate a complete ASIC RG175 compliant
Statement of Advice (SOA) in plain English.
Use ONLY Australian financial terminology:
superannuation (never 401k or pension),
concessional and non-concessional contributions,
preservation age, account-based pension,
AFSL, TFN, Medicare, Centrelink, ASX, AUD.
Never use American terms.

Write ALL of these sections in full:
1. COVER PAGE (client name, adviser name,
   date, DRAFT watermark, AFSL placeholder)
2. SCOPE OF ADVICE
3. YOUR ADVISER DETAILS
4. YOUR PERSONAL CIRCUMSTANCES
5. YOUR GOALS AND OBJECTIVES
6. YOUR CURRENT FINANCIAL POSITION
7. RISK PROFILE
8. MY ADVICE AND RECOMMENDATIONS
   (reference s961B best interests duty)
9. ADVANTAGES AND DISADVANTAGES
10. FEES AND CHARGES
11. AUTHORITY TO PROCEED
12. DISCLAIMER

Use plain text only. NO markdown symbols
(no ## ** --- or *). Use CAPITALS for
section headings. Write minimum 2500 words.
Complete every section. Never stop early.

Client data:
Client full name: ${String(clientName).trim()}
Client email: ${typeof clientEmail === "string" && clientEmail.trim() ? clientEmail.trim() : "[Not provided]"}
Date of birth: ${dobString || "[Not provided]"}
Client age (years): ${typeof ageYears === "number" ? String(ageYears) : "[Not provided]"}
Meeting date: ${typeof meetingDate === "string" && meetingDate.trim() ? meetingDate.trim() : "[Not provided]"}
Date prepared (today): ${preparedOn}
Adviser name: ${adviserName}
AFSL/Authorised Representative number: [Insert AFSL Number]
Superannuation fund name: ${typeof superFundName === "string" && superFundName.trim() ? superFundName.trim() : "[Not provided]"}
Current super balance (AUD): ${typeof currentSuperBalance === "string" && currentSuperBalance.trim() ? currentSuperBalance.trim() : "[Not provided]"}
Employer super contribution %: ${typeof employerSuperContributionPercent === "string" && employerSuperContributionPercent.trim() ? employerSuperContributionPercent.trim() : "[Not provided]"}

Meeting notes:
${String(meetingNotes).trim()}`;

    const stream = await anthropic.messages.stream({
      model: process.env.ANTHROPIC_MODEL || "claude-sonnet-4-5",
      max_tokens: 4000,
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
              .from("australian_soas")
              .insert({
                user_id: user.id,
                client_name: clientName,
                meeting_notes: meetingNotes,
                soa_text: fullText,
              });
          } catch (dbError) {
            console.error("Failed to save SOA to DB:", dbError);
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
