import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { checkSubscription } from "@/lib/subscription";

export const maxDuration = 60;

const API_KEY = process.env.NEXT_PUBLIC_ALPHA_VANTAGE_KEY;
const BASE_URL = "https://www.alphavantage.co/query";

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
    changePercent: "0.00%", // Free API doesn't give daily change easily for FX in this endpoint
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

    // Due to free API limits, we'll fetch a subset or use a strategy
    // For this demo/task, we'll try to fetch them. 
    // In a real app with free tier, you'd cache this for all users.
    
    const indicesSymbols = ["SPY", "QQQ", "^FTSE", "^GDAXI", "^N225", "^FCHI", "^HSI", "^AXJO", "DIA", "IWM"];
    const fxPairs = [["GBP", "USD"], ["EUR", "USD"], ["USD", "JPY"], ["GBP", "EUR"]];

    const indices = await Promise.all(indicesSymbols.map(s => fetchQuote(s)));
    const fx = await Promise.all(fxPairs.map(p => fetchFX(p[0], p[1])));
    const oil = await fetchCommodity("WTI");
    const gold = await fetchCommodity("GOLD");

    return NextResponse.json({
      indices: indices.filter(Boolean),
      fx: fx.filter(Boolean),
      commodities: [oil, gold].filter(Boolean)
    });
  } catch (error) {
    console.error("Market API error:", error);
    return NextResponse.json({ error: "Failed to fetch market data" }, { status: 500 });
  }
}
