"use client";

import { useState, useEffect } from "react";
import { Newspaper, Loader2, Search, Send, AlertTriangle, TrendingUp } from "lucide-react";
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
    async function checkAccessAndFetch() {
      try {
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

        const planRes = await fetch("/api/user-plan");
        if (!planRes.ok) {
          console.error("Failed to fetch user plan");
          // Fallback to starter plan if fetch fails
          await fetchBriefings();
          return;
        }
        
        const planData = await planRes.json();
        const plan = planData.plan || "starter";
        
        if (plan !== "pro") {
          router.push("/pricing?message=upgrade-pro");
          return;
        }
        
        await fetchBriefings();
      } catch (err) {
        console.error("News page initialization error:", err);
        // Ensure briefings are fetched even if access check fails partially
        try {
          await fetchBriefings();
        } catch (fetchErr) {
          console.error("Secondary fetch error:", fetchErr);
        }
        setError("Failed to fully load page data. Some features may be limited.");
      } finally {
        setIsLoading(false);
      }
    }
    checkAccessAndFetch();
  }, [router]);

  async function fetchBriefings() {
    try {
      const response = await fetch("/api/news");
      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || "Failed to fetch briefings");
      }
      const data = await response.json();
      setBriefings(Array.isArray(data) ? data : []);
    } catch (err: any) {
      console.error("Failed to fetch briefings", err);
      // Don't set global error here to allow generation
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
      setKeywords("");
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
                backgroundColor: "#C9A84C",
                color: "#0A1628",
                borderRadius: "8px",
                border: "none",
                fontWeight: "700",
                fontSize: "14px",
                cursor: (isGenerating || !keywords.trim()) ? "not-allowed" : "pointer",
                opacity: (isGenerating || !keywords.trim()) ? 0.6 : 1,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
                transition: "all 0.2s ease"
              }}
            >
              {isGenerating ? (
                <>
                  <div className="animate-spin" style={{ width: "20px", height: "20px", border: "3px solid #0A1628", borderTopColor: "#C9A84C", borderRadius: "50%" }} />
                  Generating...
                </>
              ) : (
                <>
                  <Send size={16} />
                  Generate Briefing
                </>
              )}
            </button>
          </div>
        </div>

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
                        <h4 style={{ fontSize: "12px", fontWeight: "800", color: "#C9A84C", textTransform: "uppercase", marginBottom: "8px" }}>Adviser Strategy</h4>
                        <p style={{ fontSize: "14px", color: "#374151", lineHeight: "1.5", margin: 0, fontWeight: "500" }}>{item.adviserAdvice}</p>
                      </div>
                    </div>
                    
                    {item.riskFlags && (
                      <div style={{ padding: "12px 16px", backgroundColor: "#FEF2F2", borderRadius: "8px", border: "1px solid #FEE2E2", display: "flex", alignItems: "start", gap: "12px" }}>
                        <AlertTriangle size={16} color="#DC2626" style={{ marginTop: "2px" }} />
                        <p style={{ fontSize: "13px", color: "#991B1B", margin: 0 }}>{item.riskFlags}</p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            !error && (
              <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "80px", color: "#94A3B8", textAlign: "center", border: "2px dashed #E5E7EB", borderRadius: "16px" }}>
                <Newspaper size={48} style={{ marginBottom: "16px", opacity: 0.5 }} />
                <h3 style={{ fontSize: "18px", fontWeight: "700", color: "#0A1628", marginBottom: "8px" }}>No Briefing Active</h3>
                <p style={{ fontSize: "15px", maxWidth: "300px" }}>Enter keywords on the left to generate your custom financial news briefing.</p>
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
}
