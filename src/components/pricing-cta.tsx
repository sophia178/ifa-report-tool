"use client";

import { loadStripe } from "@stripe/stripe-js";
import Link from "next/link";
import { useState } from "react";
import { getPriceDisplay, type Currency } from "@/lib/geo-pricing";

type PricingCtaProps = {
  isLoggedIn: boolean;
  isSubscribed: boolean;
  currentPlan?: "starter" | "plus" | "pro" | null;
  tierPlan: "starter" | "plus" | "pro";
  price?: string;
  currency?: Currency;
  priceDisplay?: { symbol: string; starter: string; plus: string; pro: string; locale: string };
  style?: React.CSSProperties;
};

const DEFAULT_DISPLAY = getPriceDisplay("GBP");

export function PricingCta({
  isLoggedIn,
  isSubscribed,
  currentPlan,
  tierPlan,
  price = `${DEFAULT_DISPLAY.symbol}${DEFAULT_DISPLAY.starter}`,
  currency = "GBP",
  priceDisplay,
  style,
}: PricingCtaProps) {
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function handleCheckout() {
    setIsLoading(true);
    setError("");

    try {
      const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;

      if (publishableKey) {
        await loadStripe(publishableKey);
      }

      const response = await fetch("/api/create-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: tierPlan, currency }),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || "Unable to start checkout.");
      }

      const json = (await response.json()) as { error?: string; url?: string };
      if (!json.url) throw new Error("Checkout URL missing.");

      window.location.assign(json.url);
    } catch (caughtError) {
      const message =
        caughtError instanceof Error ? caughtError.message : "Unable to start checkout.";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }

  // 1. Not logged in
  if (!isLoggedIn) {
    return (
      <Link href="/signup" className="btn pricing-cta-button" style={style}>
        Start Free Trial
      </Link>
    );
  }

  // 2. Logged in and this is the current plan
  if (isSubscribed && currentPlan === tierPlan) {
    return (
      <button
        type="button"
        disabled
        style={{
          ...style,
          backgroundColor: "#F1F5F9",
          color: "#94A3B8",
          cursor: "not-allowed",
          border: "1px solid #E2E8F0"
        }}
      >
        Current plan
      </button>
    );
  }

  // 3. Logged in and this is a downgrade
  const planOrder = { "starter": 0, "plus": 1, "pro": 2 };
  const currentRank = currentPlan ? planOrder[currentPlan] : -1;
  const tierRank = planOrder[tierPlan];

  if (isSubscribed && tierRank < currentRank) {
    return (
      <div style={{ textAlign: "center" }}>
        <Link 
          href="/api/customer-portal" 
          style={{ 
            fontSize: "13px", 
            color: "#64748B", 
            textDecoration: "underline",
            fontWeight: "500"
          }}
        >
          Downgrade
        </Link>
      </div>
    );
  }

  // 4. Upgrade or First Subscription
  const getButtonText = () => {
    if (isLoading) return "Redirecting...";
    if (currentPlan) {
      const displayAmount = priceDisplay?.[tierPlan] || price.replace(/^[^\d]+/, "");
      const displaySymbol = priceDisplay?.symbol || price.replace(/[\d.,]/g, "");
      return `Upgrade to ${tierPlan.charAt(0).toUpperCase() + tierPlan.slice(1)} — ${displaySymbol}${displayAmount}/mo`;
    }
    return "Start Free Trial";
  };

  return (
    <div className="stack" style={{ gap: 12 }}>
      <button
        type="button"
        className="btn pricing-cta-button"
        onClick={handleCheckout}
        disabled={isLoading}
        style={style}
      >
        {getButtonText()}
      </button>
      {error ? <div style={{ color: "#EF4444", fontSize: "12px", marginTop: "8px", textAlign: "center" }}>{error}</div> : null}
    </div>
  );
}
