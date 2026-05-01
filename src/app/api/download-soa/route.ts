import { NextResponse } from "next/server";
import { buildSuitabilityReportDocx } from "@/lib/docx";
import { createClient } from "@/lib/supabase/server";

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
      .select("client_name, soa_text")
      .eq("id", soaId)
      .eq("user_id", user.id)
      .single();

    if (error || !data) {
      return NextResponse.json({ error: "SOA not found." }, { status: 404 });
    }

    // We can reuse buildSuitabilityReportDocx as it handles SECTION headers correctly
    const buffer = await buildSuitabilityReportDocx(data.soa_text);

    const filename = `${data.client_name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-soa.docx`;

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
