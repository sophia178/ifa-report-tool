"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { TopNav } from "@/components/top-nav";
import { PricingCta } from "@/components/pricing-cta";
import { createClient } from "@/lib/supabase/client";
import { getPriceDisplay, type Currency } from "@/lib/geo-pricing";

type PlanTier = "starter" | "plus" | "pro";
type PriceDisplay = ReturnType<typeof getPriceDisplay>;

function PricingContent() {
  const params = useSearchParams();
  const message = params.get("message") || "";

  const [email, setEmail] = useState<string | undefined>(undefined);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [currentPlan, setCurrentPlan] = useState<PlanTier | null>(null);
  const [currency, setCurrency] = useState<Currency>("GBP");
  const [priceDisplay, setPriceDisplay] = useState<PriceDisplay>(() => getPriceDisplay("GBP"));

  useEffect(() => {
    const supabase = createClient();
    (async () => {
      try {
        const res = await fetch("/api/geo");
        const geo = await res.json().catch(() => ({}));
        if (res.ok && (geo.currency === "GBP" || geo.currency === "USD" || geo.currency === "AUD")) {
          setCurrency(geo.currency);
          if (geo?.prices && typeof geo.prices === "object" && typeof geo.prices.symbol === "string") {
            setPriceDisplay(geo.prices as PriceDisplay);
          } else {
            setPriceDisplay(getPriceDisplay(geo.currency));
          }
        }
      } catch {
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setIsLoggedIn(false);
        setEmail(undefined);
        setIsSubscribed(false);
        setCurrentPlan(null);
        return;
      }

      setIsLoggedIn(true);
      setEmail(user.email || undefined);

      const profileRes = await supabase
        .from("profiles")
        .select("subscribed, stripe_price_id")
        .eq("id", user.id)
        .maybeSingle();

      const subscribed = Boolean(profileRes.data?.subscribed);
      setIsSubscribed(subscribed);

      const stripePriceId = typeof profileRes.data?.stripe_price_id === "string" ? profileRes.data.stripe_price_id : "";
      const proIds = [
        process.env.NEXT_PUBLIC_STRIPE_PRO_PRICE_ID,
        process.env.NEXT_PUBLIC_STRIPE_USD_PRO_PRICE_ID,
        process.env.NEXT_PUBLIC_STRIPE_AUD_PRO_PRICE_ID,
      ].filter(Boolean);
      const plusIds = [
        process.env.NEXT_PUBLIC_STRIPE_PLUS_PRICE_ID,
        process.env.NEXT_PUBLIC_STRIPE_USD_PLUS_PRICE_ID,
        process.env.NEXT_PUBLIC_STRIPE_AUD_PLUS_PRICE_ID,
      ].filter(Boolean);
      const starterIds = [
        process.env.NEXT_PUBLIC_STRIPE_PRICE_ID,
        process.env.NEXT_PUBLIC_STRIPE_USD_STARTER_PRICE_ID,
        process.env.NEXT_PUBLIC_STRIPE_AUD_STARTER_PRICE_ID,
      ].filter(Boolean);

      if (proIds.includes(stripePriceId)) setCurrentPlan("pro");
      else if (plusIds.includes(stripePriceId)) setCurrentPlan("plus");
      else if (starterIds.includes(stripePriceId)) setCurrentPlan("starter");
      else if (subscribed) setCurrentPlan("starter");
      else setCurrentPlan(null);
    })();
  }, []);

  const tiers = useMemo(() => {
    const displayPrice = (tier: PlanTier) => `${priceDisplay.symbol}${priceDisplay[tier]}`;
    return [
      {
        id: "starter" as const,
        name: "STARTER",
        price: displayPrice("starter"),
        description: "Perfect for sole practitioners. Get the report generator for your regulatory jurisdiction.",
        features: [
          "1 jurisdiction report generator (FCA, ASIC, or SEC/FINRA)",
          "Research summariser",
          "Client email drafter",
          "20 reports per month",
          "Word document download",
        ],
        buttonBg: "#0A1628",
        buttonColor: "white",
      },
      {
        id: "plus" as const,
        name: "PLUS",
        price: displayPrice("plus"),
        description: "All three jurisdictions unlocked plus compliance tools.",
        features: [
          "Everything in Starter",
          "All 3 report generators (FCA, ASIC, SEC/FINRA)",
          "Compliance checker",
          "Regulatory Update Alerts",
          "Unlimited reports",
        ],
        isPopular: true,
        buttonBg: "#C9A84C",
        buttonColor: "#0A1628",
      },
      {
        id: "pro" as const,
        name: "PRO",
        price: displayPrice("pro"),
        description: "The complete Suitance OS for advice firms.",
        features: [
          "Everything in Plus",
          "Live market dashboard",
          "AI market briefing",
          "Economic calendar",
          "Portfolio risk analyser",
          "AI Trade journal",
          "Team seats",
        ],
        buttonBg: "#0A1628",
        buttonColor: "white",
      },
    ];
  }, [priceDisplay]);

  return (
    <main style={{ backgroundColor: "white", minHeight: "100vh", paddingTop: "120px" }}>
      <div style={{ maxWidth: "1100px", margin: "0 auto", padding: "40px 48px" }}>
        <TopNav email={email} />

        {message === "subscribe" ? (
          <div style={{ backgroundColor: "#0A1628", color: "white", padding: "16px", textAlign: "center", borderRadius: "12px", marginBottom: "32px", marginTop: "32px", fontWeight: "600" }}>
            Please subscribe to a plan to access the Suitance dashboard.
          </div>
        ) : message === "upgrade" ? (
          <div style={{ backgroundColor: "#C9A84C", color: "#0A1628", padding: "16px", textAlign: "center", borderRadius: "12px", marginBottom: "32px", marginTop: "32px", fontWeight: "700" }}>
            Upgrade your plan to unlock this tool and more advanced features.
          </div>
        ) : null}

        <header style={{ marginTop: "64px" }}>
          <h1 style={{ fontSize: "42px", fontWeight: "800", color: "#0A1628", textAlign: "center", marginBottom: "16px" }}>
            Simple, transparent pricing.
          </h1>
          <p style={{ fontSize: "18px", color: "#64748B", textAlign: "center", marginBottom: "64px" }}>
            Try free for 7 days — then from {priceDisplay.symbol}{priceDisplay.starter}/month. No card commitment.
          </p>
        </header>

        <div style={{ display: "flex", flexWrap: "wrap", gap: "24px" }}>
          {tiers.map((tier) => (
            <article 
              key={tier.id} 
              style={{ 
                backgroundColor: "white", 
                borderRadius: "16px", 
                padding: "0", 
                flex: "1", 
                minWidth: "300px",
                boxShadow: "0 2px 8px rgba(0,0,0,0.08)", 
                border: tier.isPopular ? "2px solid #C9A84C" : "1px solid #E5E7EB",
                position: "relative",
                display: "flex",
                flexDirection: "column"
              }}
            >
              <div style={{ backgroundColor: "#C9A84C", color: "#0A1628", fontSize: "13px", fontWeight: "700", textAlign: "center", padding: "8px", borderRadius: "8px 8px 0 0" }}>
                7 DAYS FREE TRIAL
              </div>
              <div style={{ padding: "40px", display: "flex", flexDirection: "column", flex: 1 }}>
              {tier.isPopular && (
                <div style={{ 
                  position: "absolute", 
                  top: "-12px", 
                  left: "50%", 
                  transform: "translateX(-50%)", 
                  backgroundColor: "#C9A84C", 
                  color: "#0A1628", 
                  fontSize: "12px", 
                  fontWeight: "700", 
                  padding: "4px 16px", 
                  borderRadius: "20px" 
                }}>
                  Most Popular
                </div>
              )}

              <div style={{ fontSize: "14px", fontWeight: "700", color: "#C9A84C", letterSpacing: "2px", marginBottom: "8px" }}>
                {tier.name}
              </div>

              <div style={{ marginBottom: "16px" }}>
                <span style={{ fontSize: "48px", fontWeight: "800", color: "#0A1628" }}>{tier.price}</span>
                <span style={{ fontSize: "18px", color: "#64748B" }}>/month</span>
              </div>
              <div style={{ fontSize: "12px", color: "#C9A84C", marginBottom: "20px" }}>
                No charge for 7 days
              </div>

              <p style={{ fontSize: "15px", color: "#64748B", marginBottom: "32px" }}>
                {tier.description}
              </p>

              <div style={{ flex: 1 }}>
                {tier.features.map((feature) => (
                  <div key={feature} style={{ display: "flex", alignItems: "flex-start", gap: "8px", fontSize: "15px", color: "#374151", marginBottom: "12px" }}>
                    <span style={{ color: "#C9A84C" }}>✓</span>
                    <span>{feature}</span>
                  </div>
                ))}
              </div>

              <div style={{ marginTop: "32px" }}>
                <PricingCta 
                  isLoggedIn={isLoggedIn}
                  isSubscribed={isSubscribed} 
                  currentPlan={currentPlan}
                  tierPlan={tier.id as any}
                  price={tier.price}
                  currency={currency}
                  priceDisplay={priceDisplay}
                  style={{
                    width: "100%",
                    backgroundColor: tier.buttonBg,
                    color: tier.buttonColor,
                    padding: "14px",
                    borderRadius: "8px",
                    fontWeight: "600",
                    fontSize: "15px",
                    border: "none",
                    cursor: "pointer",
                    display: "block",
                    textAlign: "center",
                    textDecoration: "none"
                  }}
                />
              </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </main>
  );
}

export default function PricingPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <PricingContent />
    </Suspense>
  );
}
