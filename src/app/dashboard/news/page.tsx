"use client";

import { useState, useEffect } from "react";
import { Newspaper, Loader2, Search, RefreshCw, Send, AlertTriangle, MessageSquare, TrendingUp } from "lucide-react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type NewsItem = {
  topic: string;
  developments: string;
  implications: string;
  adviserAdvice: string;
  riskFlags: string;
};

type Briefing = {
  id: string;
  keywords: string[];
  briefing_json: NewsItem[];
  created_at: string;
};

export default function NewsPage() {
  const router = useRouter();
  const [keywords, setKeywords] = useState("");
  const [briefings, setBriefings] = useState<Briefing[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);

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
      
      await fetchBriefings();
      setIsLoading(false);
    }
    checkAccess();
  }, [router]);

  async function fetchBriefings() {
    try {
      const response = await fetch("/api/news");
      const data = await response.json();
      if (response.ok) setBriefings(data);
    } catch (err) {
      console.error("Failed to fetch briefings", err);
    }
  }

  async function handleGenerate() {
    const keywordArray = keywords.split(",").map(k => k.trim()).filter(k => k.length > 0).slice(0, 5);
    if (keywordArray.length === 0) return;
    
    setIsGenerating(true);
    setError("");

    try {
      const response = await fetch("/api/news", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ keywords: keywordArray }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to generate briefing");

      await fetchBriefings();
    } catch (err: any) {
      setError(err.message || "Something went wrong. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  }

  if (isLoading) {
    return (
      <div style={{ minHeight: "100vh", backgroundColor: "white", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Loader2 className="animate-spin text-[#0A1628]" size={48} />
      </div>
    );
  }

  const latestBriefing = briefings[0];

  return (
    <div style={{ maxWidth: "900px", margin: "0 auto", padding: "40px 48px", display: "flex", flexDirection: "column", gap: "40px", backgroundColor: "white", fontFamily: "system-ui, -apple-system, sans-serif" }}>
      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
        <h1 style={{ fontSize: "28px", fontWeight: "800", color: "#0A1628", margin: 0 }}>
          Financial News Feed
        </h1>
        <p style={{ color: "#64748B", margin: 0, fontSize: "16px" }}>
          Generate AI-powered intelligence for your selected assets and topics.
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: "32px", alignItems: "start" }}>
        {/* Search Card */}
        <div style={{ backgroundColor: "white", borderRadius: "12px", padding: "24px", border: "1px solid #E5E7EB", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
          <h2 style={{ fontSize: "16px", fontWeight: "700", color: "#0A1628", marginBottom: "20px", display: "flex", alignItems: "center", gap: "8px" }}>
            <Search size={18} color="#C9A84C" />
            Track Assets
          </h2>
          
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              <label style={{ fontSize: "12px", fontWeight: "700", color: "#94A3B8", textTransform: "uppercase" }}>Keywords</label>
              <input
                type="text"
                placeholder="e.g. FTSE 100, S&P 500, Gilts"
                value={keywords}
                onChange={(e) => setKeywords(e.target.value)}
                style={{ width: "100%", padding: "12px", borderRadius: "8px", border: "1px solid #E5E7EB", fontSize: "14px" }}
              />
              <span style={{ fontSize: "11px", color: "#94A3B8", fontStyle: "italic" }}>Separate with commas (max 5)</span>
            </div>

            <button
              onClick={handleGenerate}
              disabled={isGenerating || !keywords.trim()}
              style={{
                width: "100%",
                padding: "12px",
                backgroundColor: "#0A1628",
                color: "white",
                borderRadius: "8px",
                border: "none",
                fontWeight: "700",
                fontSize: "14px",
                cursor: (isGenerating || !keywords.trim()) ? "not-allowed" : "pointer",
                opacity: (isGenerating || !keywords.trim()) ? 0.6 : 1,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px"
              }}
            >
              {isGenerating ? <Loader2 className="animate-spin" size={16} /> : <Send size={16} />}
              {isGenerating ? "Generating..." : "Generate Briefing"}
            </button>
          </div>
        </div>

        {/* Results Section */}
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          {error && (
            <div style={{ padding: "16px", backgroundColor: "#FEF2F2", border: "1px solid #FEE2E2", borderRadius: "12px", color: "#DC2626", fontSize: "14px", display: "flex", alignItems: "center", gap: "12px" }}>
              <AlertTriangle size={18} />
              {error}
            </div>
          )}

          {latestBriefing ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
              {latestBriefing.briefing_json.map((item, idx) => (
                <div key={idx} style={{ backgroundColor: "white", borderRadius: "12px", padding: "24px", border: "1px solid #E5E7EB", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
                  <h3 style={{ fontSize: "18px", fontWeight: "800", color: "#0A1628", marginBottom: "20px", display: "flex", alignItems: "center", gap: "10px" }}>
                    <TrendingUp size={18} color="#C9A84C" />
                    {item.topic}
                  </h3>
                  
                  <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                    <div>
                      <h4 style={{ fontSize: "12px", fontWeight: "800", color: "#94A3B8", textTransform: "uppercase", marginBottom: "8px" }}>Key Developments</h4>
                      <p style={{ fontSize: "15px", color: "#374151", lineHeight: "1.6", margin: 0 }}>{item.developments}</p>
                    </div>
                    
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px" }}>
                      <div>
                        <h4 style={{ fontSize: "12px", fontWeight: "800", color: "#94A3B8", textTransform: "uppercase", marginBottom: "8px" }}>Implications</h4>
                        <p style={{ fontSize: "14px", color: "#475569", lineHeight: "1.5", margin: 0 }}>{item.implications}</p>
                      </div>
                      <div style={{ backgroundColor: "#F8FAFC", padding: "16px", borderRadius: "8px" }}>
                        <h4 style={{ fontSize: "12px", fontWeight: "800", color: "#0A1628", textTransform: "uppercase", marginBottom: "8px", display: "flex", alignItems: "center", gap: "6px" }}>
                          <MessageSquare size={14} />
                          Adviser Note
                        </h4>
                        <p style={{ fontSize: "13px", color: "#475569", lineHeight: "1.5", margin: 0 }}>{item.adviserAdvice}</p>
                      </div>
                    </div>

                    <div style={{ backgroundColor: "#FFFBEB", padding: "12px 16px", borderRadius: "8px", border: "1px solid #FEF3C7", display: "flex", alignItems: "start", gap: "12px" }}>
                      <AlertTriangle size={16} color="#D97706" style={{ marginTop: "2px" }} />
                      <div>
                        <h4 style={{ fontSize: "11px", fontWeight: "800", color: "#92400E", textTransform: "uppercase", marginBottom: "4px" }}>Risk Flags</h4>
                        <p style={{ fontSize: "13px", color: "#92400E", margin: 0 }}>{item.riskFlags}</p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ padding: "80px 0", textAlign: "center", backgroundColor: "#F8FAFC", borderRadius: "12px", border: "1px solid #E5E7EB" }}>
              <Newspaper size={48} color="#CBD5E1" style={{ marginBottom: "16px" }} />
              <p style={{ color: "#64748B", margin: 0 }}>No briefing generated yet. Enter keywords to start.</p>
            </div>
          )}
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
