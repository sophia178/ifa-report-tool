"use client";

import { loadStripe } from "@stripe/stripe-js";
import Link from "next/link";
import { useState } from "react";

type PricingCtaProps = {
  isLoggedIn: boolean;
  isSubscribed: boolean;
  plan?: "starter" | "plus" | "pro";
  price?: string;
  style?: React.CSSProperties;
};

export function PricingCta({ isLoggedIn, isSubscribed, plan = "starter", price = "£19", style }: PricingCtaProps) {
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
        body: JSON.stringify({ plan }),
      });
      const json = (await response.json()) as { error?: string; url?: string };

      if (!response.ok || !json.url) {
        throw new Error(json.error || "Unable to start checkout.");
      }

      window.location.assign(json.url);
    } catch (caughtError) {
      const message =
        caughtError instanceof Error ? caughtError.message : "Unable to start checkout.";
      setError(message);
      setIsLoading(false);
    }
  }

  if (isSubscribed) {
    return (
      <Link href="/dashboard" className="btn pricing-cta-button" style={style}>
        Go to dashboard
      </Link>
    );
  }

  if (!isLoggedIn) {
    return (
      <Link href="/signup" className="btn pricing-cta-button" style={style}>
        Start now — {price}/month
      </Link>
    );
  }

  return (
    <div className="stack" style={{ gap: 12 }}>
      <button
        type="button"
        className="btn pricing-cta-button"
        onClick={handleCheckout}
        disabled={isLoading}
        style={style}
      >
        {isLoading ? "Redirecting..." : `Start now — ${price}/month`}
      </button>
      {error ? <div className="alert alert-error">{error}</div> : null}
    </div>
  );
}
