import { NextResponse } from "next/server";
import { callClaude } from "@/lib/claude";
import { createClient } from "@/lib/supabase/server";
import { checkSubscription } from "@/lib/subscription";

export const dynamic = "force-dynamic";

type NormalizedUpdate = {
  title: string;
  summary: string;
  effectiveDate: string;
  actionRequired: string;
  jurisdiction: string;
  impact: "High" | "Medium" | "Low";
};

function normalizeUpdate(update: any): NormalizedUpdate {
  const title = typeof update?.title === "string" ? update.title : "";
  const summary =
    typeof update?.summary === "string"
      ? update.summary
      : typeof update?.summaryText === "string"
        ? update.summaryText
        : "";
  const effectiveDate =
    typeof update?.effectiveDate === "string"
      ? update.effectiveDate
      : typeof update?.effective_date === "string"
        ? update.effective_date
        : "";
  const actionRequired =
    typeof update?.actionRequired === "string"
      ? update.actionRequired
      : typeof update?.action_required === "string"
        ? update.action_required
        : "";
  const jurisdiction = typeof update?.jurisdiction === "string" ? update.jurisdiction : "";
  const rawImpact = typeof update?.impact === "string" ? update.impact : "";
  const impact =
    rawImpact === "High" || rawImpact === "Medium" || rawImpact === "Low"
      ? rawImpact
      : rawImpact.toLowerCase() === "high"
        ? "High"
        : rawImpact.toLowerCase() === "low"
          ? "Low"
          : "Medium";

  return {
    title: title.trim(),
    summary: summary.trim(),
    effectiveDate: effectiveDate.trim(),
    actionRequired: actionRequired.trim(),
    jurisdiction: jurisdiction.trim(),
    impact,
  };
}

function stripJsonFences(text: string) {
  return text
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/```\s*$/i, "")
    .trim();
}

export async function POST(request: Request) {
  try {
    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json(
        { error: "API key not configured" },
        { status: 500 }
      );
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

    const prompt = `You are a regulatory compliance expert. Generate 3 realistic regulatory updates for the following jurisdictions: ${jurisdictions.join(", ")}.
    
    For UK, focus on FCA Consumer Duty, COBS, or MiFID.
    For Australia, focus on ASIC regulatory guides or design and distribution obligations.
    For USA, focus on SEC or FINRA rule changes.
    
    Return the response as a JSON array of objects with these exact keys:
    - title: Professional name of the update
    - summary: A detailed, non-empty summary (2-4 sentences) of what changed
    - effectiveDate: Date in format "DD Month YYYY"
    - actionRequired: A non-empty paragraph with 2-4 specific steps the adviser needs to take (no bullet points)
    - jurisdiction: The jurisdiction code (uk, aus, or usa) or full name (UK, Australia, USA)
    - impact: "High", "Medium", or "Low"
    
    Every object MUST have non-empty strings for summary and actionRequired.
    
    Return ONLY the raw JSON array. Do not use markdown code fences.`;

    const rawResult = await callClaude(prompt);
    const cleanJson = stripJsonFences(rawResult);
    const parsed = JSON.parse(cleanJson);

    const normalizedUpdates: NormalizedUpdate[] = Array.isArray(parsed) ? parsed.map(normalizeUpdate) : [];
    if (normalizedUpdates.length === 0) {
      return NextResponse.json({ error: "Failed to generate updates" }, { status: 500 });
    }

    const needsFill = normalizedUpdates.some((u) => u.summary.length === 0 || u.actionRequired.length === 0);
    let updates = normalizedUpdates;

    if (needsFill) {
      const fillPrompt = `You are a regulatory compliance expert.

You will be given a JSON array of regulatory updates. Some objects have empty strings for summary and/or actionRequired.

For each object:
- If summary is empty, populate it with 2-4 realistic sentences describing the change.
- If actionRequired is empty, populate it with a short paragraph describing 2-4 specific adviser steps (no bullet points).
- Do not change title, effectiveDate, jurisdiction, or impact unless they are empty.

Return ONLY the raw JSON array. Do not use markdown code fences.

JSON array:
${JSON.stringify(updates)}`;

      const fillRaw = await callClaude(fillPrompt);
      const fillClean = stripJsonFences(fillRaw);
      const filledParsed = JSON.parse(fillClean);
      const filledUpdates: NormalizedUpdate[] = Array.isArray(filledParsed) ? filledParsed.map(normalizeUpdate) : [];
      if (filledUpdates.length > 0) {
        updates = filledUpdates;
      }
    }

    return NextResponse.json({ updates });
  } catch (error) {
    console.error("API route error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Generation failed" },
      { status: 500 }
    );
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

    const normalized = (data ?? []).map((row: any) => ({
      ...row,
      updates: Array.isArray(row?.updates) ? row.updates.map(normalizeUpdate) : [],
    }));

    return NextResponse.json(normalized);
  } catch (error) {
    console.error("API route error:", error);
    return NextResponse.json({ error: "Failed to fetch updates" }, { status: 500 });
  }
}
