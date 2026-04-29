import { NextResponse } from "next/server";

import { generateSuitabilityReport } from "@/lib/claude";
import { generateReportInputSchema } from "@/lib/report-schema";
import { createClient } from "@/lib/supabase/server";

function getNextReviewDate(meetingDate: string) {
  const date = new Date(`${meetingDate}T00:00:00Z`);
  date.setUTCFullYear(date.getUTCFullYear() + 1);
  return date.toISOString().slice(0, 10);
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      clientName,
      clientEmail,
      dateOfBirth,
      adviserName,
      adviserFirm,
      platformName,
      fundName,
      fundSrriRiskRating,
      fundIsinNumber,
      meetingDate,
      objectives,
      sourceType,
      meetingNotes,
      transcript,
      audioPath,
    } = body;
    const input = generateReportInputSchema.parse({
      clientName,
      clientEmail,
      dateOfBirth,
      adviserName,
      adviserFirm,
      platformName,
      fundName,
      fundSrriRiskRating,
      fundIsinNumber,
      meetingDate,
      objectives,
      sourceType,
      meetingNotes,
      transcript,
      audioPath,
    });
    const nextReviewDate = getNextReviewDate(input.meetingDate);

    let report;

    try {
      report = await generateSuitabilityReport(input);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unexpected generation error.";
      return NextResponse.json(
        {
          error: `Could not generate report. ${message}`,
        },
        { status: 502 },
      );
    }

    const { data, error } = await supabase
      .from("reports")
      .insert({
        user_id: user.id,
        client_name: input.clientName,
        client_email: input.clientEmail,
        source_type: input.sourceType,
        meeting_date: input.meetingDate,
        next_review_date: nextReviewDate,
        audio_path: input.audioPath ?? null,
        meeting_notes: input.meetingNotes ?? null,
        transcript: input.transcript ?? null,
        report_text: report,
      })
      .select("id")
      .single();

    if (error || !data) {
      return NextResponse.json(
        { error: error?.message || "Could not save report." },
        { status: 500 },
      );
    }

    return NextResponse.json({
      report,
      reportId: data.id,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected error.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
