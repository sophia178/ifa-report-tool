import { NextResponse } from "next/server";
import { callClaude } from "@/lib/claude";
import { createClient } from "@/lib/supabase/server";

export const maxDuration = 60;
export const dynamic = "force-dynamic";

const REPORT_DISCLAIMER =
  "IMPORTANT DISCLAIMER: This report has been drafted by Suitance AI software as a working draft only. It must be reviewed, verified, and approved by a suitably qualified FCA-authorised financial adviser before being provided to any client. The generating software is not FCA regulated. The adviser firm and individual adviser named in this report are solely responsible for the suitability, accuracy and compliance of all advice given to clients. This draft does not constitute regulated financial advice.";

export async function POST(request: Request) {
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
    
    const prompt = `You are a Chartered Financial Planner. Write a full FCA-compliant suitability report as plain text.
    
    Client: ${clientName}
    Meeting Date: ${meetingDate}
    Adviser: ${adviserName}
    
    Context:
    ${meetingContext}
    
    Objectives: ${primaryObjective}
    Recommendation: ${recommendedProduct}
    
    ${templateContent ? `Use this template structure: ${templateContent}` : ""}
    
    Ensure you cover all 9 standard sections:
    1. Cover Summary
    2. Client Details and Objectives
    3. Financial Situation Analysis
    4. Attitude to Risk
    5. Capacity for Loss
    6. Recommendation and Suitability Justification
    7. Charges Disclosure
    8. Risks and Warnings
    9. Next Steps
    
    Append this disclaimer at the end: ${REPORT_DISCLAIMER}`;

    const report = await callClaude(prompt);

    // Save to Supabase
    const { data, error: dbError } = await supabase
      .from("reports")
      .insert({
        user_id: user.id,
        client_name: clientName,
        client_email: clientEmail,
        source_type: sourceType,
        meeting_date: meetingDate,
        report_text: report,
      })
      .select("id")
      .maybeSingle();

    if (dbError || !data) {
      return NextResponse.json(
        { error: dbError?.message || "Could not save report" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      report,
      reportId: data.id,
    });
  } catch (error) {
    console.error("API route error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Generation failed" },
      { status: 500 }
    );
  }
}
