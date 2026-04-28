import { NextResponse } from "next/server";

import { generateSuitabilityReport } from "@/lib/claude";
import { generateReportInputSchema } from "@/lib/report-schema";
import { createClient } from "@/lib/supabase/server";

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
    const input = generateReportInputSchema.parse(body);
    const report = await generateSuitabilityReport(input);

    const { data, error } = await supabase
      .from("reports")
      .insert({
        user_id: user.id,
        client_name: input.clientName,
        client_email: input.clientEmail,
        source_type: input.sourceType,
        meeting_date: input.meetingDate,
        next_review_date: report.nextReviewDate,
        audio_path: input.audioPath ?? null,
        meeting_notes: input.meetingNotes ?? null,
        transcript: input.transcript ?? null,
        report_json: report,
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
