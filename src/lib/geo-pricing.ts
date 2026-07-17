export type Currency = "GBP" | "USD" | "AUD";

export function getCurrencyFromCountry(country: string): Currency {
  if (country === "US") return "USD";
  if (country === "AU") return "AUD";
  return "GBP";
}

export function getPriceIds(currency: Currency) {
  if (currency === "USD") {
    return {
      starter: process.env.STRIPE_USD_STARTER_PRICE_ID!,
      plus: process.env.STRIPE_USD_PLUS_PRICE_ID!,
      pro: process.env.STRIPE_USD_PRO_PRICE_ID!,
    };
  }
  if (currency === "AUD") {
    return {
      starter: process.env.STRIPE_AUD_STARTER_PRICE_ID!,
      plus: process.env.STRIPE_AUD_PLUS_PRICE_ID!,
      pro: process.env.STRIPE_AUD_PRO_PRICE_ID!,
    };
  }
  return {
    starter: process.env.STRIPE_PRICE_ID!,
    plus: process.env.STRIPE_PLUS_PRICE_ID!,
    pro: process.env.STRIPE_PRO_PRICE_ID!,
  };
}

export function getPriceDisplay(currency: Currency) {
  if (currency === "USD") {
    return {
      symbol: "$",
      starter: "69",
      plus: "149",
      pro: "299",
      locale: "en-US",
    };
  }
  if (currency === "AUD") {
    return {
      symbol: "A$",
      starter: "99",
      plus: "199",
      pro: "399",
      locale: "en-AU",
    };
  }
  return {
    symbol: "£",
    starter: "49",
    plus: "99",
    pro: "199",
    locale: "en-GB",
  };
}
