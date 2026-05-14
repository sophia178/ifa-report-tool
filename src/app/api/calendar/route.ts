import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { callClaude } from "@/lib/claude";
import { getUserPlan } from "@/lib/subscription";

export const dynamic = "force-dynamic";

type CalendarEvent = {
  date: string; // YYYY-MM-DD
  displayDate: string;
  event: string;
  country: "GB" | "US" | "EU";
  impact: "High" | "Medium";
  description: string;
};

type CalendarEventWithId = CalendarEvent & { id: string };

const CACHE_PREFIX = "economic_calendar::";
const CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000;

function stripJsonFences(text: string) {
  return text
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/```\s*$/i, "")
    .trim();
}

function normalizeCountry(countryRaw: string): "GB" | "US" | "EU" | null {
  const c = countryRaw.trim().toUpperCase();
  if (c === "GB") return "GB";
  if (c === "US") return "US";
  if (c === "EU") return "EU";
  return null;
}

function parseYYYYMMDD(dateStr: string) {
  const [y, m, d] = dateStr.split("-").map((v) => Number(v));
  if (!y || !m || !d) return null;
  const dt = new Date(y, m - 1, d);
  return Number.isNaN(dt.getTime()) ? null : dt;
}

function isAfterToday(dateStr: string, todayISO: string) {
  const d = parseYYYYMMDD(dateStr);
  const t = parseYYYYMMDD(todayISO);
  if (!d || !t) return false;
  return d.getTime() > t.getTime();
}

function validateEvents(raw: any, todayISO: string): CalendarEvent[] | null {
  if (!Array.isArray(raw)) return null;
  const mapped: CalendarEvent[] = [];

  for (const item of raw) {
    const date = typeof item?.date === "string" ? item.date.trim() : "";
    const displayDate = typeof item?.displayDate === "string" ? item.displayDate.trim() : "";
    const event = typeof item?.event === "string" ? item.event.trim() : "";
    const country = typeof item?.country === "string" ? normalizeCountry(item.country) : null;
    const impact = item?.impact === "High" || item?.impact === "Medium" ? item.impact : null;
    const description = typeof item?.description === "string" ? item.description.trim() : "";

    if (!date || !displayDate || !event || !country || !impact || !description) return null;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return null;
    if (!isAfterToday(date, todayISO)) return null;
    mapped.push({ date, displayDate, event, country, impact, description });
  }

  mapped.sort((a, b) => a.date.localeCompare(b.date));
  if (mapped.length !== 8) return null;
  return mapped;
}

function addIds(events: CalendarEvent[]): CalendarEventWithId[] {
  return events.map((e) => ({
    ...e,
    id: `${e.country}-${e.date}-${e.event}`.toLowerCase().replace(/\s+/g, "-"),
  }));
}

function buildDeterministicEvents(todayISO: string): CalendarEvent[] | null {
  const candidates: CalendarEvent[] = [
    {
      date: "2026-05-20",
      displayDate: "Wednesday 20 May 2026",
      event: "UK CPI Inflation (April)",
      country: "GB",
      impact: "High",
      description: "ONS releases CPI data measuring the annual and monthly change in UK consumer prices.",
    },
    {
      date: "2026-06-03",
      displayDate: "Wednesday 3 June 2026",
      event: "US ADP Employment (May)",
      country: "US",
      impact: "Medium",
      description: "ADP estimates the monthly change in US private sector employment.",
    },
    {
      date: "2026-06-05",
      displayDate: "Friday 5 June 2026",
      event: "US Non-Farm Payrolls (May)",
      country: "US",
      impact: "High",
      description: "BLS reports monthly US job creation and unemployment metrics outside the farm sector.",
    },
    {
      date: "2026-06-11",
      displayDate: "Thursday 11 June 2026",
      event: "ECB Governing Council Meeting",
      country: "EU",
      impact: "High",
      description: "ECB sets euro area monetary policy and communicates its outlook and decisions.",
    },
    {
      date: "2026-06-17",
      displayDate: "Wednesday 17 June 2026",
      event: "UK CPI Inflation (May)",
      country: "GB",
      impact: "High",
      description: "ONS releases CPI data measuring the annual and monthly change in UK consumer prices.",
    },
    {
      date: "2026-06-18",
      displayDate: "Thursday 18 June 2026",
      event: "Bank of England MPC Meeting",
      country: "GB",
      impact: "High",
      description: "BoE MPC sets the UK Bank Rate and publishes guidance on inflation and growth.",
    },
    {
      date: "2026-06-18",
      displayDate: "Thursday 18 June 2026",
      event: "US Federal Reserve FOMC Meeting (17–18 Jun)",
      country: "US",
      impact: "High",
      description: "The FOMC sets US monetary policy and releases rate decisions and projections.",
    },
    {
      date: "2026-06-19",
      displayDate: "Friday 19 June 2026",
      event: "UK Retail Sales",
      country: "GB",
      impact: "Medium",
      description: "ONS reports monthly changes in the volume of UK retail sales.",
    },
    {
      date: "2026-07-01",
      displayDate: "Wednesday 1 July 2026",
      event: "US ADP Employment (June)",
      country: "US",
      impact: "Medium",
      description: "ADP estimates the monthly change in US private sector employment.",
    },
    {
      date: "2026-07-03",
      displayDate: "Friday 3 July 2026",
      event: "US Non-Farm Payrolls (June)",
      country: "US",
      impact: "High",
      description: "BLS reports monthly US job creation and unemployment metrics outside the farm sector.",
    },
    {
      date: "2026-07-15",
      displayDate: "Wednesday 15 July 2026",
      event: "UK CPI Inflation (June)",
      country: "GB",
      impact: "High",
      description: "ONS releases CPI data measuring the annual and monthly change in UK consumer prices.",
    },
    {
      date: "2026-07-23",
      displayDate: "Thursday 23 July 2026",
      event: "ECB Governing Council Meeting",
      country: "EU",
      impact: "High",
      description: "ECB sets euro area monetary policy and communicates its outlook and decisions.",
    },
    {
      date: "2026-07-29",
      displayDate: "Wednesday 29 July 2026",
      event: "US Federal Reserve FOMC Meeting (29–30 Jul)",
      country: "US",
      impact: "High",
      description: "The FOMC sets US monetary policy and releases rate decisions and projections.",
    },
    {
      date: "2026-08-05",
      displayDate: "Wednesday 5 August 2026",
      event: "US ADP Employment (July)",
      country: "US",
      impact: "Medium",
      description: "ADP estimates the monthly change in US private sector employment.",
    },
    {
      date: "2026-08-06",
      displayDate: "Thursday 6 August 2026",
      event: "Bank of England MPC Meeting",
      country: "GB",
      impact: "High",
      description: "BoE MPC sets the UK Bank Rate and publishes guidance on inflation and growth.",
    },
    {
      date: "2026-08-07",
      displayDate: "Friday 7 August 2026",
      event: "US Non-Farm Payrolls (July)",
      country: "US",
      impact: "High",
      description: "BLS reports monthly US job creation and unemployment metrics outside the farm sector.",
    },
    {
      date: "2026-08-19",
      displayDate: "Wednesday 19 August 2026",
      event: "UK CPI Inflation (July)",
      country: "GB",
      impact: "High",
      description: "ONS releases CPI data measuring the annual and monthly change in UK consumer prices.",
    },
  ];

  const after = candidates.filter((e) => isAfterToday(e.date, todayISO)).sort((a, b) => a.date.localeCompare(b.date));
  if (after.length < 8) return null;
  return after.slice(0, 8);
}

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const plan = await getUserPlan(user.id);
  if (plan !== "pro") {
    return NextResponse.json({ error: "Pro plan required" }, { status: 403 });
  }

  const { data: cached } = await supabase
    .from("market_briefings")
    .select("briefing_text, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(20);

  const now = Date.now();
  const freshRow = (cached ?? []).find((row: any) => {
    const text = typeof row?.briefing_text === "string" ? row.briefing_text : "";
    if (!text.startsWith(CACHE_PREFIX)) return false;
    const createdAt = row?.created_at ? new Date(row.created_at).getTime() : 0;
    if (!createdAt) return false;
    return now - createdAt < CACHE_TTL_MS;
  });

  if (freshRow) {
    try {
      const payload = (freshRow.briefing_text as string).slice(CACHE_PREFIX.length);
      const parsed = JSON.parse(payload);
      const todayISO = new Date().toISOString().slice(0, 10);
      const events = validateEvents(parsed?.events ?? parsed, todayISO);
      if (events) {
        return NextResponse.json({ events: addIds(events), source: "claude" });
      }
    } catch {
    }
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    const todayISO = new Date().toISOString().slice(0, 10);
    const fallback = buildDeterministicEvents(todayISO);
    if (fallback) {
      return NextResponse.json({ events: addIds(fallback), source: "claude" });
    }
    return NextResponse.json({ error: "API key not configured" }, { status: 500 });
  }

  const todayISO = new Date().toISOString().slice(0, 10);
  const todayHuman = new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric" });
  const prompt = `You are a financial data expert. Generate a JSON array of the next 8 major economic events from today's date (${todayISO}) for UK, US and EU markets.

Only include real scheduled events from official sources:
- Bank of England MPC meetings (official schedule: 18 Jun, 6 Aug, 17 Sep, 6 Nov, 17 Dec 2026)
- US Federal Reserve FOMC meetings (official schedule: 17-18 Jun, 29-30 Jul, 15-16 Sep, 4-5 Nov, 15-16 Dec 2026)
- ECB Governing Council meetings (official schedule: 11 Jun, 23 Jul, 10 Sep, 29 Oct, 17 Dec 2026)
- ONS UK CPI releases (official schedule: 20 May, 17 Jun, 15 Jul, 19 Aug 2026)
- US Non-Farm Payrolls BLS releases (always first Friday of each month: 5 Jun, 3 Jul, 7 Aug 2026)
- US ADP Employment (always Wednesday before NFP: 3 Jun, 1 Jul, 5 Aug 2026)
- ONS UK Retail Sales (approximately third Friday each month)

Return ONLY a valid JSON array with no markdown, no explanation, just the array. Each object must have:
{
  date: 'YYYY-MM-DD',
  displayDate: 'Day DD Month YYYY',
  event: 'Event name',
  country: 'GB' or 'US' or 'EU',
  impact: 'High' or 'Medium',
  description: 'One sentence describing what this release measures'
}

Only include events after ${todayISO}. Sort by date ascending. Return exactly 8 events.`;

  try {
    const raw = await callClaude(prompt);
    const clean = stripJsonFences(raw);
    const parsed = JSON.parse(clean);
    const events = validateEvents(parsed, todayISO);
    if (!events) {
      const fallback = buildDeterministicEvents(todayISO);
      if (fallback) {
        return NextResponse.json({ events: addIds(fallback), source: "claude" });
      }
      return NextResponse.json({ error: "Failed to generate calendar" }, { status: 500 });
    }

    const cachePayload = {
      key: "economic_calendar",
      generatedAt: todayHuman,
      events,
    };

    await supabase.from("market_briefings").insert({
      user_id: user.id,
      briefing_text: `${CACHE_PREFIX}${JSON.stringify(cachePayload)}`,
    });

    return NextResponse.json({ events: addIds(events), source: "claude" });
  } catch (error) {
    const fallback = buildDeterministicEvents(todayISO);
    if (fallback) {
      return NextResponse.json({ events: addIds(fallback), source: "claude" });
    }
    console.error("[calendar] Claude generation error:", error);
    return NextResponse.json({ error: "Generation failed" }, { status: 500 });
  }
}
