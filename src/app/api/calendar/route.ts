import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { getUserPlan } from "@/lib/subscription";

export const dynamic = "force-dynamic";

// Vercel: add FINNHUB_API_KEY to your Environment Variables. You can get a free key at https://finnhub.io/

type CalendarEvent = {
  id: string;
  event: string;
  date: string; // YYYY-MM-DD
  country: "GB" | "US" | "EU";
  importance: number | null;
  impact: "High" | "Medium" | "Low";
  description?: string;
};

type FinnhubEvent = {
  country?: string;
  event?: string;
  time?: string;
  impact?: number;
  importance?: number;
  date?: string;
};

function formatDateYYYYMMDD(date: Date) {
  return date.toISOString().slice(0, 10);
}

function mapCountry(countryRaw: string): "GB" | "US" | "EU" | null {
  const c = countryRaw.trim();
  if (c === "GB" || c === "UK" || c.toLowerCase() === "united kingdom") return "GB";
  if (c === "US" || c.toLowerCase() === "united states") return "US";
  if (c === "EU" || c.toLowerCase() === "eurozone" || c.toLowerCase() === "european union") return "EU";
  return null;
}

function getEventName(raw: FinnhubEvent) {
  const name = typeof raw.event === "string" ? raw.event : "";
  return name.trim();
}

function getEventDate(raw: FinnhubEvent) {
  const date = typeof raw.date === "string" ? raw.date : "";
  return date.trim();
}

function extractImportance(raw: FinnhubEvent) {
  const importance =
    typeof raw.importance === "number"
      ? raw.importance
      : typeof raw.impact === "number"
        ? raw.impact
        : null;
  return importance;
}

function impactFromImportance(importance: number | null): "High" | "Medium" | "Low" {
  if (importance == null) return "Medium";
  if (importance >= 3) return "High";
  if (importance === 2) return "Medium";
  return "Low";
}

function isAllowedEventName(name: string) {
  const hay = name.toLowerCase();
  const needles = [
    "interest rate decision",
    "cpi",
    "inflation",
    "gdp",
    "non-farm payroll",
    "nonfarm payroll",
    "employment",
    "retail sales",
    "pmi",
  ];
  return needles.some((n) => hay.includes(n));
}

function parseFinnhubEvents(payload: any): FinnhubEvent[] {
  if (Array.isArray(payload)) return payload;
  if (payload && Array.isArray(payload.economicCalendar)) return payload.economicCalendar;
  if (payload && Array.isArray(payload.economicCalendarData)) return payload.economicCalendarData;
  if (payload && Array.isArray(payload.data)) return payload.data;
  return [];
}

const CACHE_ID = "economic_calendar_finnhub_gb_us_eu_60d";
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;

const fallbackEvents = [
  { date: "2026-05-20", event: "UK CPI Inflation (April)", country: "GB", impact: "High", description: "ONS releases April 2026 CPI data" },
  { date: "2026-06-03", event: "US ADP Employment Report", country: "US", impact: "Medium", description: "Private sector jobs for May 2026" },
  { date: "2026-06-05", event: "ECB Interest Rate Decision", country: "EU", impact: "High", description: "ECB monetary policy decision" },
  { date: "2026-06-06", event: "US Non-Farm Payrolls", country: "US", impact: "High", description: "BLS jobs report for May 2026" },
  { date: "2026-06-17", event: "UK CPI Inflation (May)", country: "GB", impact: "High", description: "ONS releases May 2026 CPI data" },
  { date: "2026-06-18", event: "US Federal Reserve FOMC", country: "US", impact: "High", description: "Fed interest rate decision" },
  { date: "2026-06-18", event: "Bank of England MPC Decision", country: "GB", impact: "High", description: "BoE interest rate announcement" },
  { date: "2026-06-20", event: "UK Retail Sales (May)", country: "GB", impact: "Medium", description: "ONS retail sales volume data" },
] as const;

function buildFallbackEvents(): CalendarEvent[] {
  return fallbackEvents.map((e) => ({
    id: `${e.country}-${e.date}-${e.event}`.toLowerCase().replace(/\s+/g, "-"),
    event: e.event,
    date: e.date,
    country: e.country,
    importance: null,
    impact: e.impact,
    description: e.description,
  }));
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

  const admin = createAdminClient();

  const { data: cachedRow } = await admin
    .from("market_data_cache")
    .select("data, updated_at")
    .eq("id", CACHE_ID)
    .maybeSingle();

  const now = Date.now();
  const cachedUpdatedAt = cachedRow?.updated_at ? new Date(cachedRow.updated_at).getTime() : 0;
  const cacheFresh = cachedRow?.data && cachedUpdatedAt > 0 && now - cachedUpdatedAt < CACHE_TTL_MS;

  if (cacheFresh) {
    const events = (cachedRow.data as any)?.events ?? [];
    const source = (cachedRow.data as any)?.source ?? "finnhub";
    return NextResponse.json({ events, source });
  }

  if (!process.env.FINNHUB_API_KEY) {
    if (cachedRow?.data) {
      const events = (cachedRow.data as any)?.events ?? [];
      const source = (cachedRow.data as any)?.source ?? "finnhub";
      return NextResponse.json({ events, source });
    }
    const events = buildFallbackEvents();
    await admin.from("market_data_cache").upsert({
      id: CACHE_ID,
      data: { events, source: "fallback" },
      updated_at: new Date().toISOString(),
    });
    return NextResponse.json({ events, source: "fallback" });
  }

  const from = formatDateYYYYMMDD(new Date());
  const to = formatDateYYYYMMDD(new Date(Date.now() + 60 * 24 * 60 * 60 * 1000));
  const url = `https://finnhub.io/api/v1/calendar/economic?from=${from}&to=${to}&token=${process.env.FINNHUB_API_KEY}`;

  try {
    console.log("[calendar] Finnhub URL:", url);
    const res = await fetch(url, { cache: "no-store" });

    console.log("[calendar] Finnhub status:", res.status);
    const rawText = await res.text();
    console.log("[calendar] Finnhub raw response:", rawText);

    if (!res.ok) {
      if (res.status === 401 || res.status === 403) {
        console.warn("[calendar] Finnhub economic calendar may require a paid plan or has insufficient permissions for this API key.");
      }
      throw new Error(`Finnhub error: ${res.status}`);
    }

    let json: any = null;
    try {
      json = rawText ? JSON.parse(rawText) : null;
    } catch (parseErr) {
      console.error("[calendar] Finnhub JSON parse error:", parseErr);
      throw new Error("Finnhub returned non-JSON response");
    }

    const rawEvents = parseFinnhubEvents(json);
    console.log("[calendar] Events returned before filtering:", rawEvents.length);

    const required = rawEvents
      .map((e) => {
        const name = getEventName(e);
        const date = getEventDate(e);
        const country = typeof e.country === "string" ? mapCountry(e.country) : null;
        const importance = extractImportance(e);

        return { name, date, country, importance };
      })
      .filter((e) => Boolean(e.name) && Boolean(e.date));

    console.log("[calendar] After required fields filter:", required.length);

    const countryFiltered = required.filter((e) => e.country === "GB" || e.country === "US" || e.country === "EU");
    console.log("[calendar] After country filter (GB/US/EU):", countryFiltered.length);

    const nameFiltered = countryFiltered.filter((e) => isAllowedEventName(e.name));
    console.log("[calendar] After event name filter (allowed types):", nameFiltered.length);

    const mapped: CalendarEvent[] = nameFiltered.map((e) => {
      const impact = impactFromImportance(e.importance);
      const id = `${e.country}-${e.date}-${e.name}`.toLowerCase().replace(/\s+/g, "-");
      return {
        id,
        event: e.name,
        date: e.date,
        country: e.country as "GB" | "US" | "EU",
        importance: e.importance,
        impact,
      };
    });
    console.log("[calendar] After mapping:", mapped.length);

    mapped.sort((a, b) => a.date.localeCompare(b.date));
    console.log("[calendar] After sort:", mapped.length);

    const events = mapped.slice(0, 10);
    console.log("[calendar] After max-10 limit:", events.length);

    if (events.length === 0) {
      console.warn("[calendar] Finnhub returned 0 events after filtering. Falling back to scheduled events. Finnhub economic calendar may not be available on the free tier.");
      const fallback = buildFallbackEvents();
      await admin.from("market_data_cache").upsert({
        id: CACHE_ID,
        data: { events: fallback, source: "fallback" },
        updated_at: new Date().toISOString(),
      });
      return NextResponse.json({ events: fallback, source: "fallback" });
    }

    await admin.from("market_data_cache").upsert({
      id: CACHE_ID,
      data: { events, source: "finnhub" },
      updated_at: new Date().toISOString(),
    });

    return NextResponse.json({ events, source: "finnhub" });
  } catch (err) {
    console.error("[calendar] Finnhub fetch error:", err);
    if (cachedRow?.data) {
      const events = (cachedRow.data as any)?.events ?? [];
      const source = (cachedRow.data as any)?.source ?? "finnhub";
      return NextResponse.json({ events, source });
    }

    const events = buildFallbackEvents();
    await admin.from("market_data_cache").upsert({
      id: CACHE_ID,
      data: { events, source: "fallback" },
      updated_at: new Date().toISOString(),
    });

    return NextResponse.json({ events, source: "fallback" });
  }
}
