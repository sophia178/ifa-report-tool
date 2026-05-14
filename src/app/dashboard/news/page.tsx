"use client";

import { useState, useEffect, useCallback } from "react";
import { RefreshCw, Newspaper, AlertTriangle } from "lucide-react";
import { LoadingProgress } from "@/components/loading-progress";
import { createClient } from "@/lib/supabase/client";

interface NewsItem {
  topic: string;
  developments: string;
  implications: string;
  adviserAdvice: string;
  riskFlags: string;
}

export default function NewsPage() {
  const [briefings, setBriefings] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [jurisdiction, setJurisdiction] = useState<"uk" | "aus" | "usa" | "global">("global");

  function getTitle() {
    switch (jurisdiction) {
      case "uk": return "UK Adviser News Briefing";
      case "aus": return "Australian Adviser News Briefing";
      case "usa": return "US Adviser News Briefing";
      default: return "Global Adviser News Briefing";
    }
  }

  const fetchNews = useCallback(async (j: "uk" | "aus" | "usa" | "global") => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/news", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jurisdiction: j }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to fetch news");
      }

      const data = await res.json();
      setBriefings(data.result || []);
    } catch (err) {
      console.error("News fetch error:", err);
      setError(err instanceof Error ? err.message : "An unexpected error occurred while loading news.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    async function init() {
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (user) {
          const { data: profile } = await supabase
            .from("profiles")
            .select("jurisdiction")
            .eq("id", user.id)
            .single();

          const j = typeof profile?.jurisdiction === "string" ? profile.jurisdiction : "global";
          if (j === "uk" || j === "aus" || j === "usa") {
            setJurisdiction(j);
            await fetchNews(j);
            return;
          }
        }

        await fetchNews("global");
      } catch (err) {
        console.error("News init error:", err);
        await fetchNews("global");
      }
    }
    init();
  }, [fetchNews]);

  return (
    <div style={{ maxWidth: "800px", margin: "0 auto", padding: "40px 24px", fontFamily: "system-ui, -apple-system, sans-serif" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", gap: "16px", marginBottom: "32px", flexWrap: "wrap" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          <h1 style={{ fontSize: "28px", fontWeight: "800", color: "#0A1628", margin: 0 }}>
            {getTitle()}
          </h1>
          <p style={{ color: "#64748B", margin: 0, fontSize: "15px" }}>
            Daily insights and regulatory developments for professional financial advisers.
          </p>
        </div>
        <button
          onClick={() => fetchNews(jurisdiction)}
          disabled={isLoading}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            backgroundColor: "#0A1628",
            color: "white",
            padding: "12px 18px",
            borderRadius: "10px",
            fontWeight: "700",
            fontSize: "14px",
            border: "none",
            cursor: isLoading ? "not-allowed" : "pointer",
            opacity: isLoading ? 0.7 : 1,
          }}
        >
          <RefreshCw className={isLoading ? "animate-spin" : ""} size={18} />
          {isLoading ? "Refreshing..." : "Refresh News"}
        </button>
      </div>

      {error && (
        <div style={{ padding: "16px", backgroundColor: "#FEF2F2", border: "1px solid #FEE2E2", borderRadius: "12px", color: "#DC2626", fontSize: "14px", display: "flex", alignItems: "flex-start", gap: "12px", marginBottom: "24px" }}>
          <AlertTriangle size={18} />
          <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
            <span style={{ fontWeight: "800" }}>Could not load news</span>
            <span style={{ fontSize: "13px", color: "#B91C1C" }}>{error}</span>
          </div>
        </div>
      )}

      {isLoading ? (
        <div style={{ marginTop: "24px" }}>
          <LoadingProgress isLoading={true} />
        </div>
      ) : briefings.length > 0 ? (
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {briefings.map((item: NewsItem, idx: number) => (
            <div
              key={idx}
              style={{
                backgroundColor: "white",
                borderRadius: "12px",
                padding: "20px 24px",
                border: "1px solid #E5E7EB",
                borderLeft: "3px solid #C9A84C",
                boxShadow: "0 2px 12px rgba(0,0,0,0.04)",
                display: "flex",
                flexDirection: "column",
                gap: "16px",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <div style={{ width: "44px", height: "44px", borderRadius: "12px", backgroundColor: "#F8FAFC", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Newspaper size={22} color="#C9A84C" />
                </div>
                <h3 style={{ fontWeight: "700", fontSize: "18px", color: "#0A1628", margin: 0 }}>
                  {item.topic}
                </h3>
              </div>

              <div>
                <div style={{ fontSize: "11px", fontWeight: "700", letterSpacing: "1px", textTransform: "uppercase", color: "#C9A84C", marginBottom: "6px" }}>
                  Developments
                </div>
                <div style={{ fontSize: "15px", color: "#374151", lineHeight: "1.7" }}>
                  {item.developments}
                </div>
              </div>

              <div>
                <div style={{ fontSize: "11px", fontWeight: "700", letterSpacing: "1px", textTransform: "uppercase", color: "#C9A84C", marginBottom: "6px" }}>
                  Implications
                </div>
                <div style={{ fontSize: "15px", color: "#374151", lineHeight: "1.7" }}>
                  {item.implications}
                </div>
              </div>

              <div>
                <div style={{ fontSize: "11px", fontWeight: "700", letterSpacing: "1px", textTransform: "uppercase", color: "#C9A84C", marginBottom: "6px" }}>
                  Adviser Advice
                </div>
                <div style={{ fontSize: "15px", color: "#374151", lineHeight: "1.7" }}>
                  {item.adviserAdvice}
                </div>
              </div>

              <div>
                <div style={{ fontSize: "11px", fontWeight: "700", letterSpacing: "1px", textTransform: "uppercase", color: "#C9A84C", marginBottom: "6px" }}>
                  Risk Flags
                </div>
                <div style={{ fontSize: "15px", color: "#374151", lineHeight: "1.7" }}>
                  {item.riskFlags}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : !error && (
        <div style={{ textAlign: "center", padding: "80px 24px", backgroundColor: "#F8FAFC", borderRadius: "16px", border: "1px dashed #E5E7EB" }}>
          <p style={{ color: "#64748B", margin: 0 }}>No news briefings available at the moment.</p>
        </div>
      )}

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
