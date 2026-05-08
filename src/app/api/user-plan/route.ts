import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getUserPlan } from "@/lib/subscription";

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("jurisdiction")
      .eq("id", user.id)
      .single();

    const plan = await getUserPlan(user.id);

    return NextResponse.json({ 
      plan,
      jurisdiction: profile?.jurisdiction
    });
  } catch (error) {
    console.error("User plan fetch error:", error);
    return NextResponse.json({ error: "Failed to fetch user plan" }, { status: 500 });
  }
}
