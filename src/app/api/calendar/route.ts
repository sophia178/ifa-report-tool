import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { getUserPlan } from "@/lib/subscription";

export const dynamic = "force-dynamic";

// Vercel: add FINNHUB_API_KEY to your Environment Variables. You can get a free key at https://finnhub.io/

type CalendarEvent = {
  id: string;
  name: string;
  date: string; // YYYY-MM-DD
  country: "GB" | "US" | "EU";
  importance: number | null;
  impact: "High" | "Medium" | "Low";
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
    return NextResponse.json({ events: (cachedRow.data as any)?.events ?? [] });
  }

  if (!process.env.FINNHUB_API_KEY) {
    if (cachedRow?.data) {
      return NextResponse.json({ events: (cachedRow.data as any)?.events ?? [] });
    }
    return NextResponse.json({ error: "FINNHUB_API_KEY not configured" }, { status: 500 });
  }

  const from = formatDateYYYYMMDD(new Date());
  const to = formatDateYYYYMMDD(new Date(Date.now() + 60 * 24 * 60 * 60 * 1000));
  const url = `https://finnhub.io/api/v1/calendar/economic?from=${from}&to=${to}&token=${process.env.FINNHUB_API_KEY}`;

  try {
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) {
      throw new Error(`Finnhub error: ${res.status}`);
    }

    const json = await res.json();
    const rawEvents = parseFinnhubEvents(json);

    const filtered: CalendarEvent[] = rawEvents
      .map((e) => {
        const name = getEventName(e);
        const date = getEventDate(e);
        const country = typeof e.country === "string" ? mapCountry(e.country) : null;
        const importance = extractImportance(e);

        if (!name || !date || !country) return null;
        if (!isAllowedEventName(name)) return null;

        const impact = impactFromImportance(importance);
        const id = `${country}-${date}-${name}`.toLowerCase().replace(/\s+/g, "-");

        return { id, name, date, country, importance, impact };
      })
      .filter(Boolean) as CalendarEvent[];

    filtered.sort((a, b) => a.date.localeCompare(b.date));

    const events = filtered.slice(0, 10);

    await admin.from("market_data_cache").upsert({
      id: CACHE_ID,
      data: { events },
      updated_at: new Date().toISOString(),
    });

    return NextResponse.json({ events });
  } catch (err) {
    if (cachedRow?.data) {
      return NextResponse.json({ events: (cachedRow.data as any)?.events ?? [] });
    }

    return NextResponse.json(
      { error: "Failed to fetch calendar events" },
      { status: 502 },
    );
  }
}

