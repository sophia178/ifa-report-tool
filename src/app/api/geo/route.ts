import { NextRequest, NextResponse } from "next/server";
import { getCurrencyFromCountry, getPriceDisplay } from "@/lib/geo-pricing";

export async function GET(req: NextRequest) {
  const country = req.headers.get("x-vercel-ip-country") || "GB";
  const currency = getCurrencyFromCountry(country);
  const prices = getPriceDisplay(currency);
  return NextResponse.json({ currency, country, prices });
}
