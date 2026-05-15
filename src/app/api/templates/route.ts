import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { checkSubscription } from "@/lib/subscription";

type TemplateType = "fca" | "soa" | "usa";

function normalizeTemplateType(value: unknown): TemplateType | null {
  if (value === "fca" || value === "soa" || value === "usa") return value;
  if (typeof value !== "string") return null;
  const v = value.trim().toLowerCase();
  if (v === "fca" || v === "soa" || v === "usa") return v;
  return null;
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const isSubscribed = await checkSubscription(user.id);
    if (!isSubscribed) {
      return NextResponse.json({ error: "Subscription required" }, { status: 403 });
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

    const { data, error: dbError } = await supabase
      .from("report_templates")
      .insert({
        user_id: user.id,
        name: templateName,
        content: templateContent,
        type: templateType,
      })
      .select()
      .maybeSingle();

    if (dbError) throw dbError;
    if (!data) throw new Error("Could not save template.");

    return NextResponse.json(data);
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

    const { data, error } = await supabase
      .from("report_templates")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) throw error;

    return NextResponse.json(data);
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

    const isSubscribed = await checkSubscription(user.id);
    if (!isSubscribed) {
      return NextResponse.json({ error: "Subscription required" }, { status: 403 });
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

    const { data, error } = await supabase
      .from("report_templates")
      .update({ name, content, type })
      .eq("id", id)
      .eq("user_id", user.id)
      .select()
      .maybeSingle();

    if (error) throw error;
    if (!data) return NextResponse.json({ error: "Template not found" }, { status: 404 });

    return NextResponse.json(data);
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

    const isSubscribed = await checkSubscription(user.id);
    if (!isSubscribed) {
      return NextResponse.json({ error: "Subscription required" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id") || "";
    if (!id) {
      return NextResponse.json({ error: "Template id is required" }, { status: 400 });
    }

    const { error } = await supabase
      .from("report_templates")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id);

    if (error) throw error;

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Templates delete error:", error);
    const message = error instanceof Error ? error.message : "Unexpected error.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
