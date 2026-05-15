import { NextResponse } from "next/server";
import { buildReportDocx } from "@/lib/docx";
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

    const buffer = await buildReportDocx(data.soa_text, "Australian Statement of Advice", whiteLabel, { preparedBy, preparedAt: new Date() });

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
