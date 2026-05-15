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
      k401Provider,
      current401kBalance,
      annual401kContribution,
      rothIraBalance,
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
    const preparedOn = now.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });

    const prompt = `You are an expert CFP professional. Generate
a complete comprehensive financial plan
following CFP Board 7-step process in plain
English. Use ONLY US financial terminology:
401k, Roth IRA, IRA, 529 plan, Social Security,
Medicare, Medicaid, federal tax brackets,
fiduciary duty, SEC, FINRA, CFP Board standards.

Write ALL of these sections in full:
1. COVER PAGE (client name, adviser name,
   date, DRAFT watermark)
2. EXECUTIVE SUMMARY
3. CLIENT PROFILE AND CIRCUMSTANCES
4. GOALS AND OBJECTIVES
5. FINANCIAL POSITION ANALYSIS
   (include net worth table, cash flow)
6. RISK PROFILE AND INVESTMENT STRATEGY
7. RETIREMENT PLANNING
   (401k projections, Social Security analysis,
   Medicare gap planning ages 62-65,
   safe withdrawal rate, RMD planning)
8. EDUCATION FUNDING (529 plan analysis,
   timeline per child, funding projections)
9. TAX PLANNING (Roth conversion analysis,
   current bracket, tax-loss harvesting)
10. RISK MANAGEMENT AND INSURANCE
    (life insurance needs, disability,
    long-term care insurance)
11. ESTATE PLANNING (will, trust, POA,
    beneficiary designations)
12. IMPLEMENTATION PLAN
    (immediate 0-30 days, short term 1-6 months,
    long term 6+ months with specific actions)
13. MONITORING AND REVIEW
14. DISCLOSURES AND DISCLAIMER

Use plain text only. NO markdown symbols.
Use CAPITALS for section headings.
Write minimum 2500 words. Complete every
section fully. Include specific numbers
and projections based on client data.
Never stop early.

Client data:
Client name: ${String(clientName).trim()}
Client email: ${typeof clientEmail === "string" && clientEmail.trim() ? clientEmail.trim() : "[Not provided]"}
Date of birth: ${typeof dateOfBirth === "string" && dateOfBirth.trim() ? dateOfBirth.trim() : "[Not provided]"}
Meeting date: ${typeof meetingDate === "string" && meetingDate.trim() ? meetingDate.trim() : "[Not provided]"}
Date prepared (today): ${preparedOn}
Adviser name: ${adviserName}
401k Provider: ${typeof k401Provider === "string" && k401Provider.trim() ? k401Provider.trim() : "[Not provided]"}
Current 401k Balance (USD): ${typeof current401kBalance === "string" && current401kBalance.trim() ? current401kBalance.trim() : "[Not provided]"}
Annual 401k Contribution (USD): ${typeof annual401kContribution === "string" && annual401kContribution.trim() ? annual401kContribution.trim() : "[Not provided]"}
Roth IRA Balance (USD): ${typeof rothIraBalance === "string" && rothIraBalance.trim() ? rothIraBalance.trim() : "[Not provided]"}

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
