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

    const prompt = `You are an Australian financial adviser preparing a STATEMENT OF ADVICE (SOA) draft for adviser review. The SOA must be designed to meet:
- ASIC Regulatory Guide 175 (RG 175) requirements, including clear, concise and effective disclosure language
- ASIC RG 90 (financial product disclosure principles, where relevant)
- Corporations Act 2001 (Cth) section 947B (content requirements for SOAs)
- Best interests duty under section 961B must be explicitly referenced and explained in the BASIS OF ADVICE section

OUTPUT RULES (CRITICAL):
- PLAIN TEXT ONLY. NO MARKDOWN. Do not use symbols like ##, **, backticks, or markdown-style formatting.
- USE CAPITALS for ALL SECTION HEADINGS (exactly as listed below).
- Include specific numbers ONLY from the client data and meeting notes provided. Do NOT invent amounts, balances, rates, returns, fees, AFSL numbers, licensee details, or product identifiers.
- If a fact or number is missing, write: [Not provided].
- Never invent AFSL numbers or licensee details. Use placeholders exactly as instructed.
- Minimum length: at least 2000 words.
- Use professional Australian adviser language that is clear, concise and effective (RG 175).

CLIENT DATA (USE THESE EXACT DETAILS):
Client full name: ${String(clientName).trim()}
Client email: ${typeof clientEmail === "string" && clientEmail.trim() ? clientEmail.trim() : "[Not provided]"}
Date of birth: ${dobString || "[Not provided]"}
Client age (years): ${typeof ageYears === "number" ? String(ageYears) : "[Not provided]"}
Meeting date: ${typeof meetingDate === "string" && meetingDate.trim() ? meetingDate.trim() : "[Not provided]"}
Date prepared (today): ${preparedOn}
Adviser name: ${adviserName}

MEETING NOTES (SOURCE OF TRUTH FOR CIRCUMSTANCES, GOALS, NUMBERS, PRODUCTS, AND STRATEGIES):
${String(meetingNotes).trim()}

STRUCTURE: Produce the SOA with ALL sections below, in this exact order. Each section heading must be on its own line in CAPITALS. Use clear subheadings (also in capitals) where helpful.

1. COVER PAGE
Include:
- STATEMENT OF ADVICE
- Client full name
- Adviser name
- AFSL/Authorised Representative number: [Insert AFSL Number]
- Date prepared: ${preparedOn}
- DRAFT - FOR ADVISER REVIEW ONLY

2. IMPORTANT INFORMATION AND SCOPE OF ADVICE
Include:
- Scope of advice: clearly state what advice covers and does not cover
- Assumptions and limitations (only those supported by notes; otherwise [Not provided])
- General advice warning IF applicable (only if the notes indicate the advice is not personal or insufficient personal information; otherwise state that this SOA is personal advice based on the information provided)
- How to read this document (plain, practical instructions for the client)

3. YOUR ADVISER'S DETAILS
Include:
- Adviser name: ${adviserName}
- Authorised representative details: [Insert Authorised Representative Details]
- AFS Licensee details: [Insert AFS Licensee Details]
- Contact information: [Insert Contact Details]

4. YOUR PERSONAL CIRCUMSTANCES
Include:
- Personal and family details (dependants, marital status, residency, etc. from notes)
- Employment and income (include exact figures from notes)
- ASSETS AND LIABILITIES TABLE (must be a readable plain-text table; do not use markdown table separators like ---; use aligned columns or a simple row format)
- Current superannuation details (fund names, balances, contributions if provided)
- Insurance currently held (types, sums insured, premiums if provided)
- Centrelink/Government benefits IF applicable (only if mentioned)
- Health considerations (only if mentioned; otherwise [Not provided])

5. YOUR GOALS AND OBJECTIVES
Include:
- Each goal clearly articulated
- Priority (High/Medium/Low) and timeframe (short/medium/long) for each goal
- How goals were identified (based on meeting discussion and information gathered)

6. YOUR CURRENT FINANCIAL POSITION
Include:
- Detailed net worth statement (use numbers only from notes; otherwise [Not provided])
- Cash flow summary (income, expenses, surplus/deficit where numbers provided)
- Current investment portfolio analysis (asset allocation, diversification, concentration risks from notes)
- Superannuation analysis (insurance inside super, fees, investment option suitability if provided)

7. RISK PROFILE
Include:
- Risk profile assessment result (use notes; if not provided, state [Not provided] and recommend completing a risk profile questionnaire)
- Description of the risk profile category in plain language
- Investment time horizon
- Capacity for loss assessment (include reasoning grounded in the notes and numbers provided)

8. MY ADVICE AND RECOMMENDATIONS
Include:
- BASIS OF ADVICE: explicitly address best interests duty under s961B, and explain why the advice is appropriate for the client’s objectives, financial situation, and needs
- Specific product recommendations (ONLY if products are explicitly mentioned; otherwise recommend obtaining product research and explain the selection criteria without naming products)
- Strategy recommendations (step-by-step, implementable, linked to goals)
- Superannuation recommendations
- Insurance recommendations
- Why recommended products/strategies were chosen (link to client goals, risk profile, timeframe, and constraints)
- Alternatives considered and why rejected (include at least 2 plausible alternatives; do not name specific products unless provided; do not invent numbers)

9. ADVANTAGES AND DISADVANTAGES
Include:
- Advantages of the recommended strategy
- Disadvantages and risks (investment risk, product risk, liquidity, legislative/market risk)
- Comparison with status quo (what happens if the client does nothing)

10. FEES, CHARGES AND REMUNERATION
Include:
- Initial advice fee: [Not provided] unless a specific number is in the notes
- Ongoing advice fee: [Not provided] unless a specific number is in the notes
- Product fees: [Not provided] unless provided
- Total cost of advice (if numbers provided; otherwise [Not provided])
- Fee disclosure statement reference (plain statement and where it would be provided)
- Conflict of interest disclosure (including commissions, volume-based benefits, or related-party arrangements; state [Not provided] if not applicable/unknown)

11. AUTHORITY TO PROCEED
Include:
- Client acknowledgement section (plain language)
- Signature blocks for client and adviser
- Date fields for signing

12. IMPORTANT DOCUMENTS CHECKLIST
Include:
- List of documents provided with this SOA (use [Not provided] where unknown)
- Product Disclosure Statements referenced (only if relevant and/or products mentioned; otherwise state that PDS will be provided before implementation)

13. DISCLAIMER
Include this exact disclaimer verbatim:
This Statement of Advice has been prepared as a draft document by AI software. It must be reviewed, verified, and approved by a qualified Australian Financial Services licensee or authorised representative before presentation to any client. This draft does not constitute personal financial advice.
Also include an ASIC regulatory reference line that cites RG 175, RG 90, Corporations Act 2001 (Cth) s947B, and the best interests duty under s961B.`;

    const stream = await anthropic.messages.stream({
      model: process.env.ANTHROPIC_MODEL || "claude-sonnet-4-5",
      max_tokens: 4500,
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
