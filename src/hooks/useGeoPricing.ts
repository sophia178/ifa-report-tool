"use client";

import { useEffect, useState } from "react";
import { getPriceDisplay } from "@/lib/geo-pricing";

export type PriceDisplay = {
  symbol: string;
  starter: string;
  plus: string;
  pro: string;
  locale: string;
  currency: string;
};

const DEFAULT: PriceDisplay = {
  ...getPriceDisplay("GBP"),
  currency: "GBP",
};

export function useGeoPricing() {
  const [prices, setPrices] = useState<PriceDisplay>(DEFAULT);
  const [currency, setCurrency] = useState("GBP");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/geo")
      .then((r) => r.json())
      .then((data) => {
        const nextCurrency =
          data?.currency === "GBP" || data?.currency === "USD" || data?.currency === "AUD"
            ? data.currency
            : "GBP";
        const incoming = data?.prices && typeof data.prices === "object" ? data.prices : null;

        const nextPrices: PriceDisplay = {
          symbol: typeof incoming?.symbol === "string" ? incoming.symbol : DEFAULT.symbol,
          starter: typeof incoming?.starter === "string" ? incoming.starter : DEFAULT.starter,
          plus: typeof incoming?.plus === "string" ? incoming.plus : DEFAULT.plus,
          pro: typeof incoming?.pro === "string" ? incoming.pro : DEFAULT.pro,
          locale: typeof incoming?.locale === "string" ? incoming.locale : DEFAULT.locale,
          currency: nextCurrency,
        };

        setPrices(nextPrices);
        setCurrency(nextCurrency);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return { prices, currency, loading };
}
