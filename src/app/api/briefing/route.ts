import { NextResponse } from "next/server";
import { callClaude } from "@/lib/claude";
import { createClient } from "@/lib/supabase/server";
import { checkSubscription, getUserPlan } from "@/lib/subscription";

export const dynamic = "force-dynamic";

type Jurisdiction = "uk" | "aus" | "usa" | "global";

function normalizeJurisdiction(value: unknown): Jurisdiction {
  const v = typeof value === "string" ? value.trim().toLowerCase() : "uk";
  if (v === "uk" || v === "aus" || v === "usa") return v;
  return "uk";
}

function getCacheKey(jurisdiction: Jurisdiction) {
  if (jurisdiction === "aus") return "daily_briefing_aus";
  if (jurisdiction === "usa") return "daily_briefing_usa";
  return "daily_briefing_uk";
}

function looksLikeMissingColumn(err: unknown) {
  const m = err && typeof err === "object" && "message" in err ? String((err as any).message) : "";
  return m.includes("column") && (m.includes("does not exist") || m.includes("not found"));
}

async function enforceStarterMonthlyLimit(params: {
  supabase: Awaited<ReturnType<typeof createClient>>;
  userId: string;
  route: string;
  limit: number;
}): Promise<{ allowed: boolean }> {
  const now = new Date();
  const periodStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  const resetDateIso = periodStart.toISOString();

  const existing = await params.supabase
    .from("usage_tracking")
    .select("count, reset_date")
    .eq("user_id", params.userId)
    .eq("route", params.route)
    .maybeSingle();

  if (existing.error) {
    console.error("Usage tracking read error:", existing.error);
    return { allowed: true };
  }

  const currentCount = typeof existing.data?.count === "number" ? existing.data.count : 0;
  const existingReset = typeof existing.data?.reset_date === "string" ? new Date(existing.data.reset_date) : null;
  const needsReset =
    !existingReset ||
    existingReset.getUTCFullYear() !== periodStart.getUTCFullYear() ||
    existingReset.getUTCMonth() !== periodStart.getUTCMonth();

  if (needsReset) {
    if (existing.data) {
      const updated = await params.supabase
        .from("usage_tracking")
        .update({ count: 1, reset_date: resetDateIso } as any)
        .eq("user_id", params.userId)
        .eq("route", params.route);
      if (updated.error) console.error("Usage tracking reset error:", updated.error);
    } else {
      const inserted = await params.supabase
        .from("usage_tracking")
        .insert({ user_id: params.userId, route: params.route, count: 1, reset_date: resetDateIso } as any);
      if (inserted.error) console.error("Usage tracking insert error:", inserted.error);
    }
    return { allowed: true };
  }

  if (currentCount >= params.limit) {
    return { allowed: false };
  }

  const updated = await params.supabase
    .from("usage_tracking")
    .update({ count: currentCount + 1 } as any)
    .eq("user_id", params.userId)
    .eq("route", params.route);

  if (updated.error) {
    console.error("Usage tracking increment error:", updated.error);
  }

  return { allowed: true };
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

    const body = await request.json().catch(() => ({}));
    const jurisdiction = normalizeJurisdiction(body?.jurisdiction);
    const cacheKey = getCacheKey(jurisdiction);

    const plan = (await getUserPlan(user.id)) || "starter";
    if (plan === "starter") {
      const { allowed } = await enforceStarterMonthlyLimit({
        supabase,
        userId: user.id,
        route: "briefing",
        limit: 20,
      });
      if (!allowed) {
        return NextResponse.json(
          { error: "You have reached your monthly limit. Upgrade to Plus for unlimited reports." },
          { status: 429 }
        );
      }
    }

    const today = new Date().toLocaleDateString("en-GB", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });

    const focus =
      jurisdiction === "uk"
        ? "UK markets (FTSE), Bank of England (BoE), FCA updates, ONS data, and key UK economic events."
        : jurisdiction === "aus"
          ? "Australian markets (ASX), RBA updates, ASIC updates, ABS data, Australian economic events, and superannuation industry news."
          : "US markets (S&P 500), Federal Reserve updates, SEC updates, BLS jobs data, key US economic events, and 401k/financial planning news.";

    const preparedFor =
      jurisdiction === "uk"
        ? `Prepared for UK Financial Advisers | ${today}`
        : jurisdiction === "aus"
          ? `Prepared for Australian Financial Advisers | ${today}`
          : `Prepared for US Financial Advisers | ${today}`;

    const sections =
      jurisdiction === "uk"
        ? ["UK Market Overview (FTSE)", "BoE & FCA Highlights", "ONS Data Watch", "Key UK Economic Events", "Adviser Talking Points"]
        : jurisdiction === "aus"
          ? ["Australian Market Overview (ASX)", "RBA & ASIC Highlights", "ABS Data Watch", "Key Australian Economic Events", "Superannuation Industry Notes", "Adviser Talking Points"]
          : ["US Market Overview (S&P 500)", "Fed & SEC Highlights", "BLS Jobs & Macro Data", "Key US Economic Events", "401k & Planning Notes", "Adviser Talking Points"];

    const prompt = `You are a market analyst. Generate a professional daily market briefing focused on: ${focus}.

${preparedFor}

Write a title line at the top (e.g. "DAILY MARKET BRIEFING") and then use "##" for section headings.

Include sections on:
${sections.map((s) => `- ${s}`).join("\n")}

Do not use placeholders like {DATE}. Use the date provided above.
Return plain text only. Maximum 600 words.`;

    const briefingText = await callClaude(prompt, 4000);
    const finalBriefingText = briefingText.replace(/\{DATE\}/g, today);

    const insertWithKey = await supabase
      .from("market_briefings")
      .insert({ user_id: user.id, briefing_text: finalBriefingText, cache_key: cacheKey, jurisdiction } as any)
      .select()
      .maybeSingle();

    const insertWithJurisdiction = looksLikeMissingColumn(insertWithKey.error)
      ? await supabase
          .from("market_briefings")
          .insert({ user_id: user.id, briefing_text: finalBriefingText, jurisdiction } as any)
          .select()
          .maybeSingle()
      : insertWithKey;

    const insertResult = insertWithJurisdiction.error
      ? await supabase
          .from("market_briefings")
          .insert({ user_id: user.id, briefing_text: finalBriefingText } as any)
          .select()
          .maybeSingle()
      : insertWithJurisdiction;

    const { data, error: dbError } = insertResult;

    if (dbError || !data) {
      return NextResponse.json({ error: "Could not save briefing" }, { status: 500 });
    }

    return NextResponse.json({ result: finalBriefingText, id: data.id, lastUpdated: data.created_at || new Date().toISOString() });
  } catch (error) {
    console.error("API route error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Generation failed" },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
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
    const jurisdiction = normalizeJurisdiction(searchParams.get("jurisdiction"));
    const cacheKey = getCacheKey(jurisdiction);
    const twentyFourHoursMs = 24 * 60 * 60 * 1000;

    const attemptByKey = await supabase
      .from("market_briefings")
      .select("id, created_at, briefing_text, cache_key")
      .eq("user_id", user.id)
      .eq("cache_key", cacheKey as any)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    const attemptFiltered = await supabase
      .from("market_briefings")
      .select("id, created_at, briefing_text, jurisdiction")
      .eq("user_id", user.id)
      .eq("jurisdiction", jurisdiction)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    const attemptFallback = await supabase
      .from("market_briefings")
      .select("id, created_at, briefing_text")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    const latest =
      !attemptByKey.error && attemptByKey.data
        ? attemptByKey.data
        : attemptFiltered.error
          ? attemptFallback.data
          : (attemptFiltered.data || attemptFallback.data);
    const createdAt = latest?.created_at ? new Date(latest.created_at) : null;
    const isStale = createdAt ? Date.now() - createdAt.getTime() > twentyFourHoursMs : false;

    return NextResponse.json({
      result: latest?.briefing_text ?? null,
      lastUpdated: latest?.created_at ?? null,
      isStale,
    });
  } catch (error) {
    console.error("API route error:", error);
    return NextResponse.json({ error: "Failed to fetch briefings" }, { status: 500 });
  }
}
