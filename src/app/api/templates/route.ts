import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

type TemplateType = "FCA" | "SOA" | "USA";

function normalizeTemplateType(value: unknown): TemplateType | null {
  if (value === "FCA" || value === "SOA" || value === "USA") return value;
  if (typeof value !== "string") return null;
  const v = value.trim().toUpperCase();
  if (v === "FCA" || v === "SOA" || v === "USA") return v as TemplateType;
  return null;
}

function getWriteClient(supabase: Awaited<ReturnType<typeof createClient>>) {
  const hasServiceRoleKey = Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY);
  if (!hasServiceRoleKey) return supabase;
  return createAdminClient();
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { name, content, type } = await request.json();
    const templateName = typeof name === "string" ? name.trim() : "";
    const templateContent = typeof content === "string" ? content.trim() : "";
    const templateType = normalizeTemplateType(type);

    if (!templateName || !templateContent || !templateType) {
      return NextResponse.json(
        { error: "Name, content, and type are required" },
        { status: 400 }
      );
    }

    const writeClient = getWriteClient(supabase);
    const { data, error: dbError } = await writeClient
      .from("report_templates")
      .insert({
        user_id: user.id,
        name: templateName,
        content: templateContent,
        type: templateType,
        created_at: new Date().toISOString(),
      })
      .select()
      .maybeSingle();

    console.log("Insert error:", dbError);
    console.log("Insert data:", data);
    console.log("User:", user?.id);

    if (dbError) throw dbError;
    if (!data) throw new Error("Could not save template.");

    return NextResponse.json({ success: true, template: data });
  } catch (error) {
    console.error("Templates error:", error);
    const message = error instanceof Error ? error.message : "Unexpected error.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const readClient = getWriteClient(supabase);
    const { data, error } = await readClient
      .from("report_templates")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) throw error;

    return NextResponse.json({ success: true, templates: data ?? [] });
  } catch (error) {
    console.error("Templates fetch error:", error);
    return NextResponse.json({ error: "Failed to fetch templates" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const id = typeof body?.id === "string" ? body.id : "";
    const name = typeof body?.name === "string" ? body.name.trim() : "";
    const content = typeof body?.content === "string" ? body.content.trim() : "";
    const type = normalizeTemplateType(body?.type);

    if (!id || !name || !content || !type) {
      return NextResponse.json(
        { error: "id, name, content, and type are required" },
        { status: 400 }
      );
    }

    const writeClient = getWriteClient(supabase);
    const { data, error } = await writeClient
      .from("report_templates")
      .update({ name, content, type })
      .eq("id", id)
      .eq("user_id", user.id)
      .select()
      .maybeSingle();

    if (error) throw error;
    if (!data) return NextResponse.json({ error: "Template not found" }, { status: 404 });

    return NextResponse.json({ success: true, template: data });
  } catch (error) {
    console.error("Templates update error:", error);
    const message = error instanceof Error ? error.message : "Unexpected error.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id") || "";
    if (!id) {
      return NextResponse.json({ error: "Template id is required" }, { status: 400 });
    }

    const writeClient = getWriteClient(supabase);
    const { error } = await writeClient
      .from("report_templates")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Templates delete error:", error);
    const message = error instanceof Error ? error.message : "Unexpected error.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
