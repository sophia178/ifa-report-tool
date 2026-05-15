import { NextResponse } from "next/server";
import { anthropic } from "@/lib/claude";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const REPORT_DISCLAIMER =
  "IMPORTANT DISCLAIMER: This report has been drafted by Suitance AI software as a working draft only. It must be reviewed, verified, and approved by a suitably qualified FCA-authorised financial adviser before being provided to any client. The generating software is not FCA regulated. The adviser firm and individual adviser named in this report are solely responsible for the suitability, accuracy and compliance of all advice given to clients. This draft does not constitute regulated financial advice.";

export async function POST(request: Request) {
  console.log("ROUTE HIT: /api/generate-report");
  try {
    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json(
        { error: "API key not configured" },
        { status: 500 }
      );
    }

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { 
      clientName, clientEmail, clientAge, meetingDate, adviserName,
      annualIncome, totalAssets, existingInvestments, outstandingDebts,
      propertyOwned, riskScore, riskCategory, attitudeToLoss,
      primaryObjective, timeHorizon, specificGoals,
      recommendedProduct, initialAdviceCharge, ongoingAdviceCharge,
      productCharge, totalOngoingCharge,
      isVulnerable, vulnerabilityDetails, isPensionTransfer, isIhtPlanning,
      consumerDutyNotes, sourceType, meetingNotes, transcript, audioPath,
      templateContent 
    } = body;

    // Validate required fields
    if (!clientName || !meetingDate || !adviserName) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const meetingContext = sourceType === "audio" ? transcript : meetingNotes;
    
    const prompt = `You are a Chartered Financial Planner. Write a comprehensive, detailed, and full FCA-compliant suitability report as plain text. 
    Be extremely thorough and professional.
    Write each section concisely but completely. 
    You MUST reach and complete the final disclaimer 
    section. Never stop early.
    
    Client Details:
    - Name: ${clientName}
    - Age: ${clientAge}
    - Meeting Date: ${meetingDate}
    - Adviser: ${adviserName}
    
    Financial Profile:
    - Annual Income: ${annualIncome}
    - Total Assets: ${totalAssets}
    - Existing Investments: ${existingInvestments}
    - Outstanding Debts: ${outstandingDebts}
    - Property Owned: ${propertyOwned ? "Yes" : "No"}
    
    Risk Profile:
    - Risk Score: ${riskScore}/10
    - Risk Category: ${riskCategory}
    - Attitude to Loss: ${attitudeToLoss}
    
    Objectives & Recommendation:
    - Primary Objective: ${primaryObjective}
    - Time Horizon: ${timeHorizon}
    - Specific Goals: ${specificGoals}
    - Recommended Product: ${recommendedProduct}
    
    Charges:
    - Initial Advice Charge: ${initialAdviceCharge}
    - Ongoing Advice Charge: ${ongoingAdviceCharge}
    - Product Charge: ${productCharge}
    - Total Ongoing Charge: ${totalOngoingCharge}
    
    Special Considerations:
    - Vulnerable Client: ${isVulnerable ? "Yes (" + vulnerabilityDetails + ")" : "No"}
    - Pension Transfer: ${isPensionTransfer ? "Yes" : "No"}
    - IHT Planning: ${isIhtPlanning ? "Yes" : "No"}
    - Consumer Duty Notes: ${consumerDutyNotes}
    
    Context from Meeting:
    ${meetingContext}
    
    ${templateContent ? `Use this template structure: ${templateContent}` : ""}
    
    Ensure you cover all 14 standard sections in depth:
    1. Executive Summary
    2. Client Personal Circumstances & Objectives
    3. Current Financial Situation Analysis
    4. Attitude to Investment Risk & Capacity for Loss
    5. Investment Strategy & Asset Allocation
    6. Recommendation & Suitability Justification
    7. Product Features & Benefits
    8. Alternative Options Considered & Discarded
    9. Detailed Charges & Value for Money Assessment
    10. Consumer Duty: Good Outcomes Assessment
    11. Tax Implications & Planning
    12. Risk Warnings & Disclosures
    13. Implementation & Next Steps
    14. Formal FCA Disclaimer: ${REPORT_DISCLAIMER}`;

    const stream = await anthropic.messages.stream({
      model: process.env.ANTHROPIC_MODEL || "claude-sonnet-4-5",
      max_tokens: 8000,
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

          // Save to Supabase after stream is finished
          try {
            await supabase
              .from("reports")
              .insert({
                user_id: user.id,
                client_name: clientName,
                client_email: clientEmail,
                source_type: sourceType,
                meeting_date: meetingDate,
                report_text: fullText,
              });
          } catch (dbError) {
            console.error("Failed to save report to DB:", dbError);
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
