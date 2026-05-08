"use client";

import { useState, useEffect } from "react";
import { Calendar, Loader2, Info, ChevronRight, AlertTriangle } from "lucide-react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { format, addDays } from "date-fns";

type EconomicEvent = {
  id: string;
  title: string;
  date: string;
  impact: "High" | "Medium" | "Low";
  explanation?: string;
};

const mockEvents: EconomicEvent[] = [
  { id: "1", title: "Bank of England Interest Rate Decision", date: format(addDays(new Date(), 3), "yyyy-MM-dd"), impact: "High" },
  { id: "2", title: "UK Consumer Price Index (CPI) Release", date: format(addDays(new Date(), 7), "yyyy-MM-dd"), impact: "High" },
  { id: "3", title: "US Federal Reserve FOMC Meeting", date: format(addDays(new Date(), 12), "yyyy-MM-dd"), impact: "High" },
  { id: "4", title: "US Non-Farm Payrolls (NFP)", date: format(addDays(new Date(), 14), "yyyy-MM-dd"), impact: "High" },
  { id: "5", title: "UK Gross Domestic Product (GDP) Estimate", date: format(addDays(new Date(), 21), "yyyy-MM-dd"), impact: "Medium" },
  { id: "6", title: "Eurozone Inflation Flash Estimate", date: format(addDays(new Date(), 25), "yyyy-MM-dd"), impact: "Medium" },
  { id: "7", title: "UK Retail Sales Data", date: format(addDays(new Date(), 28), "yyyy-MM-dd"), impact: "Low" },
];

export default function CalendarPage() {
  const router = useRouter();
  const [events, setEvents] = useState<EconomicEvent[]>(mockEvents);
  const [isLoading, setIsLoading] = useState(true);
  const [explainingId, setExplainingId] = useState<string | null>(null);

  useEffect(() => {
    async function checkAccess() {
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
      
      setIsLoading(false);
    }
    checkAccess();
  }, [router]);

  async function getExplanation(event: EconomicEvent) {
    if (event.explanation) {
      // Toggle off if already explained
      setEvents(prev => prev.map(e => e.id === event.id ? { ...e, explanation: undefined } : e));
      return;
    }
    setExplainingId(event.id);

    try {
      const response = await fetch("/api/calendar/explain", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: event.title, date: event.date, impact: event.impact }),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || "Failed to get explanation");
      }

      const data = await response.json();
      setEvents(prev => prev.map(e => e.id === event.id ? { ...e, explanation: data.result } : e));
    } catch (err) {
      console.error("Failed to get explanation", err);
      const errorMessage = err instanceof Error ? err.message : "Failed to connect to AI analysis service. Please try again.";
      setEvents(prev => prev.map(e => e.id === event.id ? { ...e, explanation: `Analysis unavailable: ${errorMessage}` } : e));
    } finally {
      setExplainingId(null);
    }
  }

  if (isLoading) {
    return (
      <div style={{ minHeight: "100vh", backgroundColor: "white", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Loader2 className="animate-spin text-[#0A1628]" size={48} />
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

  return (
    <div style={{ maxWidth: "900px", margin: "0 auto", padding: "40px 48px", display: "flex", flexDirection: "column", gap: "24px", backgroundColor: "white", fontFamily: "system-ui, -apple-system, sans-serif" }}>
      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
        <h1 style={{ fontSize: "28px", fontWeight: "800", color: "#0A1628", margin: 0 }}>
          Economic Calendar
        </h1>
        <p style={{ color: "#64748B", margin: 0, fontSize: "16px" }}>
          Major upcoming economic events with AI-powered adviser insights.
        </p>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        {events.map((event) => {
          const colors = getImpactColor(event.impact);
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
                    {format(new Date(event.date), "EEEE, dd MMMM yyyy")}
                  </span>
                  <h3 style={{ fontSize: "18px", fontWeight: "700", color: "#0A1628", margin: 0 }}>{event.title}</h3>
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
                      transform: event.explanation ? "rotate(90deg)" : "none" 
                    }} 
                  />
                </div>
              </div>

              {(event.explanation || explainingId === event.id) && (
                <div style={{ padding: "0 24px 24px 24px" }}>
                  <div style={{ backgroundColor: "#F8FAFC", padding: "20px", borderRadius: "8px", border: "1px solid #E5E7EB", display: "flex", gap: "16px" }}>
                    <Info size={18} color="#C9A84C" style={{ flexShrink: 0, marginTop: "2px" }} />
                    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                      <span style={{ fontSize: "11px", fontWeight: "800", color: "#C9A84C", textTransform: "uppercase" }}>Adviser Insight</span>
                      {explainingId === event.id ? (
                        <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#64748B", fontSize: "14px" }}>
                          <Loader2 className="animate-spin" size={14} />
                          Analysing event...
                        </div>
                      ) : (
                        <p style={{ fontSize: "14px", color: "#374151", lineHeight: "1.6", margin: 0, fontStyle: "italic" }}>
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

      <div style={{ padding: "24px", backgroundColor: "#FFFBEB", borderRadius: "12px", border: "1px solid #FEF3C7", display: "flex", gap: "16px", alignItems: "start" }}>
        <AlertTriangle size={20} color="#D97706" style={{ flexShrink: 0 }} />
        <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
          <span style={{ fontSize: "14px", fontWeight: "800", color: "#D97706", textTransform: "uppercase" }}>Pro Tip</span>
          <p style={{ fontSize: "13px", color: "#92400E", lineHeight: "1.5", margin: 0 }}>
            These events often trigger volatility. Ensure your clients are aware of potential short-term market moves around these dates, especially for central bank decisions.
          </p>
        </div>
      </div>

      <style jsx global>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .animate-spin {
          animation: spin 1s linear infinite;
        }
      `}</style>
    </div>
  );
}
