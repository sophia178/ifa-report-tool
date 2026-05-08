import { NextResponse } from "next/server";
import { generateRegulatoryUpdates } from "@/lib/claude";
import { createClient } from "@/lib/supabase/server";
import { checkSubscription } from "@/lib/subscription";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function POST(request: Request) {
  try {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "Anthropic API key is not configured" }, { status: 500 });
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const isSubscribed = await checkSubscription(user.id);
    if (!isSubscribed) {
      return NextResponse.json({ error: "Subscription required" }, { status: 403 });
    }

    const { jurisdictions } = await request.json();
    if (!jurisdictions || !Array.isArray(jurisdictions) || jurisdictions.length === 0) {
      return NextResponse.json({ error: "Jurisdictions are required" }, { status: 400 });
    }

    const updates = await generateRegulatoryUpdates(jurisdictions);

    // Save to Supabase
    const { data, error: dbError } = await supabase
      .from("regulatory_summaries")
      .insert({
        user_id: user.id,
        jurisdictions,
        updates,
      })
      .select()
      .maybeSingle();

    if (dbError) throw dbError;
    if (!data) throw new Error("Could not save updates.");

    return NextResponse.json(updates);
  } catch (error: any) {
    console.error("Regulatory API error:", error);
    return NextResponse.json({ error: error.message || "Failed to generate regulatory updates" }, { status: 500 });
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
      .from("regulatory_summaries")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;

    return NextResponse.json(data);
  } catch (error) {
    console.error("Regulatory fetch error:", error);
    return NextResponse.json({ error: "Failed to fetch updates" }, { status: 500 });
  }
}
