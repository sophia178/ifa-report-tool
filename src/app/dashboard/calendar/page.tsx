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
  const [userEmail, setUserEmail] = useState<string | undefined>();

  useEffect(() => {
    async function checkAccess() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        router.push("/login");
        return;
      }

      setUserEmail(user.email);

      const { data: profile } = await supabase
        .from("profiles")
        .select("subscribed")
        .eq("id", user.id)
        .single();

      if (!profile?.subscribed) {
        router.push("/pricing?message=subscribe");
        return;
      }

      // Check if user has Pro plan
      const planRes = await fetch("/api/user-plan");
      const { plan } = await planRes.json();
      
      if (plan === "starter" || plan === "plus") {
        router.push("/pricing?message=upgrade-pro");
        return;
      }
      
      setIsLoading(false);
    }
    checkAccess();
  }, [router]);

  async function getExplanation(event: EconomicEvent) {
    if (event.explanation) return;
    setExplainingId(event.id);

    try {
      const response = await fetch("/api/calendar/explain", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: event.title, date: event.date, impact: event.impact }),
      });

      const data = await response.json();
      if (response.ok) {
        setEvents(prev => prev.map(e => e.id === event.id ? { ...e, explanation: data.explanation } : e));
      }
    } catch (err) {
      console.error("Failed to get explanation", err);
    } finally {
      setExplainingId(null);
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0a1628] flex items-center justify-center">
        <Loader2 className="animate-spin text-[#c1a362]" size={48} />
      </div>
    );
  }

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case "High": return "bg-red-500/10 text-red-500 border-red-500/20";
      case "Medium": return "bg-amber-500/10 text-amber-500 border-amber-500/20";
      case "Low": return "bg-green-500/10 text-green-500 border-green-500/20";
      default: return "bg-gray-500/10 text-gray-500 border-gray-500/20";
    }
  };

  return (
    <div className="stack gap-8">
      <div className="stack gap-2">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Calendar className="text-[#c1a362]" />
          Economic Calendar
        </h2>
        <p className="text-gray-400">
          Major upcoming economic events for the next 30 days with AI-powered adviser insights.
        </p>
      </div>

            <div className="stack gap-4">
              {events.map((event) => (
                <div key={event.id} className="card border border-[rgba(193,163,98,0.15)] overflow-hidden bg-[rgba(15,23,40,0.4)]">
                  <div 
                    className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 cursor-pointer hover:bg-[rgba(193,163,98,0.05)] transition-colors"
                    onClick={() => getExplanation(event)}
                  >
                    <div className="stack gap-1">
                      <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">
                        {format(new Date(event.date), "EEEE, dd MMMM yyyy")}
                      </span>
                      <h3 className="text-lg font-bold text-gray-200">{event.title}</h3>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getImpactColor(event.impact)}`}>
                        {event.impact} Impact
                      </span>
                      <ChevronRight className={`text-gray-600 transition-transform ${event.explanation ? 'rotate-90' : ''}`} size={20} />
                    </div>
                  </div>

                  {(event.explanation || explainingId === event.id) && (
                    <div className="px-6 pb-6 pt-0 fade-in">
                      <div className="p-4 rounded-lg bg-[rgba(193,163,98,0.05)] border border-[rgba(193,163,98,0.1)] flex gap-4">
                        <Info className="text-[#c1a362] shrink-0 mt-1" size={18} />
                        <div className="stack gap-2">
                          <span className="text-xs font-bold text-[#c1a362] uppercase tracking-wider">Adviser Insight</span>
                          {explainingId === event.id ? (
                            <div className="flex items-center gap-2 text-gray-500 text-sm">
                              <Loader2 className="animate-spin" size={14} />
                              Claude is analysing this event...
                            </div>
                          ) : (
                            <p className="text-sm text-gray-300 leading-relaxed italic">
                              {event.explanation}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="p-6 rounded-xl bg-amber-500/5 border border-amber-500/20 flex gap-4 items-start">
              <AlertTriangle className="text-amber-500 shrink-0" size={20} />
              <div className="stack gap-1">
                <span className="text-sm font-bold text-amber-500 uppercase">Pro Tip</span>
                <p className="text-xs text-gray-400 leading-relaxed">
                  These events often trigger volatility. Ensure your clients are aware of the potential for short-term market moves around these dates, especially for BOE and Fed decisions.
                </p>
              </div>
            </div>
          </div>
  );
}
