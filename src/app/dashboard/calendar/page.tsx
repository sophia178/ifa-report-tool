"use client";

import { useState, useEffect } from "react";
import { ChevronRight, AlertTriangle, Info, ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { LoadingProgress } from "@/components/loading-progress";

type EconomicEvent = {
  id: string;
  name: string;
  date: string; // YYYY-MM-DD
  country: "GB" | "US" | "EU";
  impact: "High" | "Medium" | "Low";
  explanation?: string;
};

export default function CalendarPage() {
  const router = useRouter();
  const [events, setEvents] = useState<EconomicEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [explainingId, setExplainingId] = useState<string | null>(null);

  useEffect(() => {
    async function checkAccessAndLoad() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        router.push("/login");
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("subscribed, stripe_price_id")
        .eq("id", user.id)
        .single();

      if (!profile?.subscribed) {
        router.push("/pricing?message=subscribe");
        return;
      }

      const isPro = profile.stripe_price_id === process.env.NEXT_PUBLIC_STRIPE_PRO_PRICE_ID;
      
      if (!isPro) {
        router.push("/pricing?message=upgrade-pro");
        return;
      }

      try {
        setLoadError("");
        const response = await fetch("/api/calendar");
        if (!response.ok) {
          throw new Error("Calendar fetch failed");
        }
        const data = await response.json();
        const fetchedEvents: EconomicEvent[] = Array.isArray(data?.events) ? data.events : [];
        setEvents(fetchedEvents);
      } catch {
        setLoadError("Calendar temporarily unavailable - please check back shortly");
        setEvents([]);
      } finally {
        setIsLoading(false);
      }
    }
    checkAccessAndLoad();
  }, [router]);

  async function getExplanation(event: EconomicEvent) {
    if (event.explanation) return;
    setExplainingId(event.id);

    try {
      const response = await fetch("/api/calendar/explain", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: event.name,
          date: event.date,
          impact: event.impact,
          country: event.country,
        }),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || "Failed to get explanation");
      }

      const data = await response.json();
      setEvents(prev => prev.map(e => e.id === event.id ? { ...e, explanation: data.result } : e));
    } catch (err) {
      console.error("Failed to get explanation", err);
    } finally {
      setExplainingId(null);
    }
  }

  if (isLoading) {
    return (
      <div style={{ minHeight: "100vh", backgroundColor: "white", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <LoadingProgress isLoading={true} />
      </div>
    );
  }

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case "High": return { bg: "#FEF2F2", text: "#DC2626", border: "#FEE2E2" };
      case "Medium": return { bg: "#FFFBEB", text: "#D97706", border: "#FEF3C7" };
      case "Low": return { bg: "#F0FDF4", text: "#16A34A", border: "#DCFCE7" };
      default: return { bg: "#F8FAFC", text: "#64748B", border: "#E2E8F0" };
    }
  };

  const flagForCountry = (country: EconomicEvent["country"]) => {
    switch (country) {
      case "GB": return "🇬🇧";
      case "US": return "🇺🇸";
      case "EU": return "🇪🇺";
    }
  };

  const formatDate = (dateStr: string) => {
    const [yearStr, monthStr, dayStr] = dateStr.split("-");
    const year = Number(yearStr);
    const month = Number(monthStr);
    const day = Number(dayStr);
    const date = new Date(year, month - 1, day);
    const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    return `${days[date.getDay()]} ${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
  };

  return (
    <div style={{ maxWidth: "900px", margin: "0 auto", padding: "40px 48px", display: "flex", flexDirection: "column", gap: "24px", backgroundColor: "white", fontFamily: "system-ui, -apple-system, sans-serif" }}>
      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
        <Link href="/dashboard" style={{ display: "inline-flex", alignItems: "center", gap: "8px", color: "#64748B", textDecoration: "none", fontSize: "14px", fontWeight: "600", marginBottom: "16px" }}>
          <ArrowLeft size={16} /> Back to Dashboard
        </Link>
        <h1 style={{ fontSize: "28px", fontWeight: "800", color: "#0A1628", margin: 0 }}>
          Economic Calendar
        </h1>
        <p style={{ color: "#64748B", margin: 0, fontSize: "16px" }}>
          Major upcoming economic events with AI-powered adviser insights.
        </p>
      </div>

      {loadError ? (
        <div style={{ padding: "18px 20px", backgroundColor: "#F8FAFC", borderRadius: "12px", border: "1px solid #E5E7EB", color: "#475569", fontSize: "14px", fontWeight: "600" }}>
          {loadError}
        </div>
      ) : (
      <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        {events.map((event) => {
          const colors = getImpactColor(event.impact);
          const isExplaining = explainingId === event.id;
          
          return (
            <div key={event.id} style={{ backgroundColor: "white", borderRadius: "12px", border: "1px solid #E5E7EB", overflow: "hidden", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
              <div 
                onClick={() => getExplanation(event)}
                style={{ 
                  padding: "24px", 
                  display: "flex", 
                  justifyContent: "space-between", 
                  alignItems: "center", 
                  cursor: "pointer",
                  transition: "background-color 0.2s"
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#F8FAFC"}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "white"}
              >
                <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                  <span style={{ fontSize: "11px", fontWeight: "800", color: "#94A3B8", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                    {formatDate(event.date)}
                  </span>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <span style={{ fontSize: "16px" }}>{flagForCountry(event.country)}</span>
                    <h3 style={{ fontSize: "18px", fontWeight: "700", color: "#0A1628", margin: 0 }}>{event.name}</h3>
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                  <span style={{ 
                    padding: "4px 12px", 
                    borderRadius: "9999px", 
                    fontSize: "12px", 
                    fontWeight: "700", 
                    backgroundColor: colors.bg, 
                    color: colors.text, 
                    border: `1px solid ${colors.border}` 
                  }}>
                    {event.impact} Impact
                  </span>
                  <ChevronRight 
                    size={20} 
                    color="#94A3B8" 
                    style={{ 
                      transition: "transform 0.2s", 
                      transform: (event.explanation || isExplaining) ? "rotate(90deg)" : "none" 
                    }} 
                  />
                </div>
              </div>

              {(event.explanation || isExplaining) && (
                <div style={{ padding: "0 24px 24px 24px" }}>
                  <div style={{ backgroundColor: "#F8FAFC", padding: "20px", borderRadius: "8px", border: "1px solid #E5E7EB", borderLeft: "4px solid #C9A84C", display: "flex", gap: "16px" }}>
                    <Info size={18} color="#C9A84C" style={{ flexShrink: 0, marginTop: "2px" }} />
                    <div style={{ display: "flex", flexDirection: "column", gap: "8px", width: "100%" }}>
                      <span style={{ fontSize: "11px", fontWeight: "800", color: "#C9A84C", textTransform: "uppercase" }}>Adviser Insight</span>
                      {isExplaining ? (
                        <LoadingProgress isLoading={true} messages={["Connecting to AI...", "Analysing event impact...", "Drafting insight..."]} />
                      ) : (
                        <p style={{ fontSize: "14px", color: "#374151", lineHeight: "1.7", margin: 0 }}>
                          {event.explanation}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
      )}

      <div style={{ padding: "24px", backgroundColor: "#FFFBEB", borderRadius: "12px", border: "1px solid #FEF3C7", display: "flex", gap: "16px", alignItems: "start" }}>
        <AlertTriangle size={20} color="#D97706" style={{ flexShrink: 0 }} />
        <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
          <span style={{ fontSize: "14px", fontWeight: "800", color: "#D97706", textTransform: "uppercase" }}>Pro Tip</span>
          <p style={{ fontSize: "13px", color: "#92400E", lineHeight: "1.5", margin: 0 }}>
            These events often trigger volatility. Ensure your clients are aware of potential short-term market moves around these dates, especially for central bank decisions.
          </p>
        </div>
      </div>
    </div>
  );
}
