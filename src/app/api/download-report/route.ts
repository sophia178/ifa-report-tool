import { NextResponse } from "next/server";

import { buildSuitabilityReportDocx } from "@/lib/docx";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const reportId = searchParams.get("id");

    if (!reportId) {
      return NextResponse.json({ error: "Report ID is required." }, { status: 400 });
    }

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data, error } = await supabase
      .from("reports")
      .select("client_name, report_text")
      .eq("id", reportId)
      .eq("user_id", user.id)
      .single();

    if (error || !data) {
      return NextResponse.json({ error: "Report not found." }, { status: 404 });
    }

    const buffer = await buildSuitabilityReportDocx(data.report_text);

    const filename = `${data.client_name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-suitability-report.docx`;

    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected error.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
