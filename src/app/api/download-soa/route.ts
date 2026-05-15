import { NextResponse } from "next/server";
import { buildReportDocx } from "@/lib/docx";
import { createClient } from "@/lib/supabase/server";

type DownloadBody = {
  clientName?: string;
  content?: string;
};

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const soaId = searchParams.get("id");

    if (!soaId) {
      return NextResponse.json({ error: "SOA ID is required." }, { status: 400 });
    }

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data, error } = await supabase
      .from("australian_soas")
      .select("client_name, content, soa_text")
      .eq("id", soaId)
      .eq("user_id", user.id)
      .single();

    if (error || !data) {
      return NextResponse.json({ error: "SOA not found." }, { status: 404 });
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

    const reportText = (data as any).content || (data as any).soa_text || "";
    const buffer = await buildReportDocx(reportText, "AUSTRALIAN STATEMENT OF ADVICE", whiteLabel, {
      preparedBy,
      preparedAt: new Date(),
      clientName: data.client_name,
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
    const content = typeof payload.content === "string" ? payload.content : "";
    const clientName = typeof payload.clientName === "string" ? payload.clientName.trim() : "";

    if (!content.trim() || !clientName) {
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

    const buffer = await buildReportDocx(content, "AUSTRALIAN STATEMENT OF ADVICE", whiteLabel, {
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
