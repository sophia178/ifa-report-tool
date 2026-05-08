import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { checkSubscription } from "@/lib/subscription";

export const maxDuration = 300; // Increased to 5 minutes for delayed fetching

const API_KEY = process.env.NEXT_PUBLIC_ALPHA_VANTAGE_KEY;
const BASE_URL = "https://www.alphavantage.co/query";

async function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function fetchQuote(symbol: string) {
  const url = `${BASE_URL}?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${API_KEY}`;
  const res = await fetch(url);
  const data = await res.json();
  const quote = data["Global Quote"];
  if (!quote) return null;
  return {
    symbol: quote["01. symbol"],
    price: parseFloat(quote["05. price"]),
    changePercent: quote["10. change percent"],
  };
}

async function fetchFX(from: string, to: string) {
  const url = `${BASE_URL}?function=CURRENCY_EXCHANGE_RATE&from_currency=${from}&to_currency=${to}&apikey=${API_KEY}`;
  const res = await fetch(url);
  const data = await res.json();
  const rate = data["Realtime Currency Exchange Rate"];
  if (!rate) return null;
  return {
    symbol: `${from}/${to}`,
    price: parseFloat(rate["5. Exchange Rate"]),
    changePercent: "0.00%",
  };
}

async function fetchCommodity(func: string) {
  const url = `${BASE_URL}?function=${func}&apikey=${API_KEY}`;
  const res = await fetch(url);
  const data = await res.json();
  if (!data.data || !data.data[0]) return null;
  const latest = data.data[0];
  const prev = data.data[1];
  const price = parseFloat(latest.value);
  const prevPrice = parseFloat(prev.value);
  const change = ((price - prevPrice) / prevPrice) * 100;
  return {
    symbol: func === "WTI" ? "Crude Oil (WTI)" : "Gold",
    price: price,
    changePercent: `${change.toFixed(2)}%`,
  };
}

export async function GET() {
  const adminSupabase = createAdminClient();
  const serverSupabase = await createClient();

  try {
    const { data: { user } } = await serverSupabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const isSubscribed = await checkSubscription(user.id);
    if (!isSubscribed) return NextResponse.json({ error: "Subscription required" }, { status: 403 });

    // 1. Check Cache First
    const { data: cache } = await adminSupabase
      .from("market_data_cache")
      .select("*")
      .eq("id", "global_markets")
      .single();

    const isCacheFresh = cache && (new Date().getTime() - new Date(cache.updated_at).getTime() < 24 * 60 * 60 * 1000);

    if (isCacheFresh) {
      return NextResponse.json({
        ...cache.data,
        lastUpdated: cache.updated_at,
        isLive: true
      });
    }

    // 2. Fetch Fresh Data if cache missing or old
    const indicesSymbols = ["SPY", "QQQ", "^FTSE", "^GDAXI", "^N225", "^FCHI", "^HSI", "^AXJO", "DIA", "IWM"];
    const fxPairs = [["GBP", "USD"], ["EUR", "USD"], ["USD", "JPY"], ["GBP", "EUR"]];

    try {
      const indices: any[] = [];
      for (const symbol of indicesSymbols) {
        const quote = await fetchQuote(symbol);
        if (quote) indices.push(quote);
        await delay(500); // 500ms delay to avoid rate limit
      }

      const fx: any[] = [];
      for (const pair of fxPairs) {
        const rate = await fetchFX(pair[0], pair[1]);
        if (rate) fx.push(rate);
        await delay(500);
      }

      const oil = await fetchCommodity("WTI");
      await delay(500);
      const gold = await fetchCommodity("GOLD");

      const marketData = {
        indices: indices.filter(Boolean),
        fx: fx.filter(Boolean),
        commodities: [oil, gold].filter(Boolean)
      };

      if (marketData.indices.length < 2) throw new Error("API Limit Reached");

      // Update Cache
      await adminSupabase.from("market_data_cache").upsert({
        id: "global_markets",
        data: marketData,
        updated_at: new Date().toISOString()
      });

      return NextResponse.json({
        ...marketData,
        lastUpdated: new Date().toISOString(),
        isLive: true
      });

    } catch (e) {
      console.error("Alpha Vantage fetch failed, using last known cache if available:", e);
      
      if (cache) {
        return NextResponse.json({
          ...cache.data,
          lastUpdated: cache.updated_at,
          isLive: false,
          warning: "Live data temporarily unavailable — showing last known prices"
        });
      }

      // Final fallback if no cache exists
      const fallbackData = {
        indices: [
          { symbol: "S&P 500", price: 5137.08, changePercent: "+0.80%" },
          { symbol: "Nasdaq 100", price: 18302.91, changePercent: "+1.14%" },
          { symbol: "FTSE 100", price: 7682.50, changePercent: "+0.69%" },
          { symbol: "DAX 40", price: 17735.03, changePercent: "+0.32%" },
          { symbol: "Nikkei 225", price: 39910.82, changePercent: "+1.90%" }
        ],
        fx: [
          { symbol: "GBP/USD", price: 1.2655, changePercent: "-0.04%" },
          { symbol: "EUR/USD", price: 1.0837, changePercent: "+0.02%" }
        ],
        commodities: [
          { symbol: "Crude Oil (WTI)", price: 79.97, changePercent: "+2.19%" },
          { symbol: "Gold", price: 2082.90, changePercent: "+1.89%" }
        ]
      };

      return NextResponse.json({
        ...fallbackData,
        lastUpdated: new Date().toISOString(),
        isLive: false,
        warning: "Live data temporarily unavailable — showing default data"
      });
    }
  } catch (error) {
    console.error("Fatal Market API error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
