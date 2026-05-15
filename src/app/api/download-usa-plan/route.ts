import { NextResponse } from "next/server";
import { buildReportDocx } from "@/lib/docx";
import { createClient } from "@/lib/supabase/server";

type DownloadBody = {
  clientName?: string;
  planText?: string;
  content?: string;
};

async function getPreparedBy(supabase: Awaited<ReturnType<typeof createClient>>, userId: string) {
  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name")
    .eq("id", userId)
    .maybeSingle();

  return (profile?.display_name && String(profile.display_name).trim()) || "Your Financial Adviser";
}

export async function GET(request: Request) {
  try {
    void request;
    return NextResponse.json(
      { error: "Method not allowed. Use POST with { clientName, content } to download the current plan." },
      { status: 405 }
    );
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

    const payload = (await request.json()) as DownloadBody;
    const planText =
      typeof payload.content === "string"
        ? payload.content
        : typeof payload.planText === "string"
          ? payload.planText
          : "";
    const clientName = typeof payload.clientName === "string" ? payload.clientName.trim() : "";

    if (!planText.trim() || !clientName) {
      return NextResponse.json({ error: "Missing required fields." }, { status: 400 });
    }

    const { data: whiteLabel } = await supabase
      .from("white_label_settings")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();

    const preparedBy = await getPreparedBy(supabase, user.id);
    const buffer = await buildReportDocx(planText, "USA FINANCIAL PLAN", whiteLabel, {
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
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
