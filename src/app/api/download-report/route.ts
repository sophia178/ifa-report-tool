import { NextResponse } from "next/server";

import { buildReportDocx } from "@/lib/docx";
import { createClient } from "@/lib/supabase/server";

type DownloadBody = {
  clientName?: string;
  reportText?: string;
};

function normalizeMarkdownForDocx(text: string) {
  return text
    .replace(/\r/g, "")
    .replace(/^(#{1,6})\s+/gm, (_m, hashes: string) => `__MD_H${hashes.length}__ `)
    .replace(/\*\*(.*?)\*\*/g, "$1")
    .replace(/\*(.*?)\*/g, "$1")
    .replace(/^---+$/gm, "")
    .replace(/^[*-]\s+/gm, "")
    .replace(/^>\s+/gm, "")
    .trim();
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const reportId = searchParams.get("id");
    const type = searchParams.get("type") || "fca"; // fca, soa, usa

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

    let tableName = "reports";
    let textField = "report_text";
    let title = "FCA SUITABILITY REPORT";

    if (type === "soa") {
      tableName = "australian_soas";
      textField = "soa_text";
      title = "AUSTRALIAN STATEMENT OF ADVICE";
    } else if (type === "usa") {
      tableName = "usa_financial_plans";
      textField = "plan_text";
      title = "USA FINANCIAL PLAN";
    }

    const { data, error } = await supabase
      .from(tableName)
      .select(`client_name, ${textField}`)
      .eq("id", reportId)
      .eq("user_id", user.id)
      .single();

    if (error || !data) {
      return NextResponse.json({ error: "Report not found." }, { status: 404 });
    }

    // Check for white label settings
    const { data: whiteLabel } = await supabase
      .from("white_label_settings")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();

    const { data: profile } = await supabase
      .from("profiles")
      .select("display_name")
      .eq("id", user.id)
      .maybeSingle();

    const preparedBy =
      (profile?.display_name && String(profile.display_name).trim()) || "Your Financial Adviser";

    const reportData = data as any;
    const reportText = normalizeMarkdownForDocx(String(reportData[textField] || ""));
    const clientName = reportData.client_name as string;
    const buffer = await buildReportDocx(reportText, title, whiteLabel, { preparedBy, preparedAt: new Date(), clientName });

    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "Content-Disposition": `attachment; filename="Report.docx"`,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected error.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
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

    const payload = (await request.json().catch(() => ({}))) as DownloadBody;
    const reportText = typeof payload.reportText === "string" ? normalizeMarkdownForDocx(payload.reportText) : "";
    const clientName = typeof payload.clientName === "string" ? payload.clientName.trim() : "";

    if (!reportText.trim() || !clientName) {
      return NextResponse.json({ error: "Missing required fields." }, { status: 400 });
    }

    const { data: whiteLabel } = await supabase
      .from("white_label_settings")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();

    const { data: profile } = await supabase
      .from("profiles")
      .select("display_name")
      .eq("id", user.id)
      .maybeSingle();

    const preparedBy =
      (profile?.display_name && String(profile.display_name).trim()) || "Your Financial Adviser";

    const buffer = await buildReportDocx(reportText, "FCA SUITABILITY REPORT", whiteLabel, {
      preparedBy,
      preparedAt: new Date(),
      clientName,
    });

    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "Content-Disposition": `attachment; filename="Report.docx"`,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected error.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
